import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import OrderStatusChange from '#models/order_status_change'
import CartItem from '#models/cart_item'
import Media from '#models/media'
import inventoryService from '#services/inventory_service'
import vine from '@vinejs/vine'

export default class OrdersController {
  async index({ auth, response }: HttpContext) {
    const user = auth.user!

    const orders = await Order.query()
      .where('user_id', user.id)
      .preload('address')
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('media')
      })
      .orderBy('created_at', 'desc')

    return response.json({ orders })
  }

  async show({ auth, params, response }: HttpContext) {
    const user = auth.user!

    const order = await Order.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .preload('address')
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('media')
      })
      .firstOrFail()

    return response.json({ order })
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.user!

    const schema = vine.compile(
      vine.object({
        addressId: vine.number(),
        items: vine.array(
          vine.object({
            mediaId: vine.number(),
            quantity: vine.number().min(1),
          })
        ),
      })
    )

    const data = await request.validateUsing(schema)

    const order = await Order.create({
      userId: user.id,
      addressId: data.addressId,
      status: 'pending',
    })

    // Log initial status change - who created the order
    await OrderStatusChange.create({
      orderId: order.id,
      status: 'pending',
      changedBy: user.id,
    })

    // Create order items and deduct inventory
    for (const item of data.items) {
      await OrderItem.create({
        orderId: order.id,
        mediaId: item.mediaId,
        quantity: item.quantity,
      })

      // Deduct inventory if tracking is enabled
      try {
        await inventoryService.deductStock(item.mediaId, item.quantity, order.id)
      } catch (error) {
        // Inventory not tracked for this item, continue
      }

      // Increment times_ordered counter
      const media = await Media.find(item.mediaId)
      if (media) {
        media.timesOrdered = (media.timesOrdered || 0) + 1
        await media.save()
      }
    }

    await order.load('items', (itemsQuery) => {
      itemsQuery.preload('media')
    })

    // Clear the cart after order is placed
    await CartItem.query().where('user_id', user.id).delete()

    return response.json({ order })
  }

  async cancel({ auth, params, response }: HttpContext) {
    const user = auth.user!

    const order = await Order.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .firstOrFail()

    // Only allow cancellation for orders that haven't shipped yet
    if (['shipped', 'cancelled', 'cancelling'].includes(order.status)) {
      return response.forbidden({
        message: 'Cannot cancel order at this stage',
      })
    }

    // If pending, go straight to cancelled (no action needed)
    // Otherwise, go to cancelling (staff needs to return items to inventory)
    const newStatus = order.status === 'pending' ? 'cancelled' : 'cancelling'

    order.status = newStatus
    await order.save()

    // Create status change record
    await OrderStatusChange.create({
      orderId: order.id,
      status: newStatus,
      changedBy: user.id,
    })

    // If cancelled (not cancelling), restore inventory immediately
    if (newStatus === 'cancelled') {
      await order.load('items')
      for (const item of order.items) {
        try {
          await inventoryService.restoreStock(item.mediaId, item.quantity, order.id)
        } catch (error) {
          // Inventory not tracked for this item, continue
        }
      }
    }

    await order.load('items', (itemsQuery) => {
      itemsQuery.preload('media')
    })

    return response.json({ order })
  }

  async adminIndex({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const orders = await Order.query()
      .preload('user')
      .preload('address')
      .preload('statusChanges', (query) => {
        query.preload('changedByUser').orderBy('created_at', 'asc')
      })
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('media')
      })
      .preload('messages', (query) => {
        query.preload('user').orderBy('created_at', 'desc')
      })
      .orderBy('created_at', 'desc')
      .paginate(page, limit)

    return response.json({
      meta: orders.getMeta(),
      data: orders.all(),
    })
  }

  async adminShow({ params, response }: HttpContext) {
    const order = await Order.query()
      .where('id', params.id)
      .preload('user')
      .preload('address')
      .preload('statusChanges', (query) => {
        query.preload('changedByUser').orderBy('created_at', 'asc')
      })
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('media')
      })
      .preload('messages', (query) => {
        query.preload('user').orderBy('created_at', 'desc')
      })
      .firstOrFail()

    return response.json({ order })
  }

  async update({ auth, params, request, response }: HttpContext) {
    const order = await Order.findOrFail(params.id)

    const schema = vine.compile(
      vine.object({
        status: vine.enum(['pending', 'processing', 'packing', 'ready', 'shipping', 'shipped', 'cancelling', 'cancelled']).optional(),
        trackingNumber: vine.string().trim().nullable().optional(),
        notes: vine.string().trim().nullable().optional(),
      })
    )

    const data = await request.validateUsing(schema)

    // If status is being changed, create audit log
    if (data.status && data.status !== order.status) {
      const currentUser = auth.user!
      order.status = data.status

      await OrderStatusChange.create({
        orderId: order.id,
        status: data.status,
        changedBy: (data.status === 'ready' || data.status === 'shipped') ? null : currentUser.id,
      })
    }

    // Update other fields
    if (data.trackingNumber !== undefined) {
      order.trackingNumber = data.trackingNumber
    }
    if (data.notes !== undefined) {
      order.notes = data.notes
    }

    await order.save()

    return response.json({ order })
  }

  async grab({ auth, params, response }: HttpContext) {
    const currentUser = auth.user!
    const order = await Order.findOrFail(params.id)

    // Can only grab pending or cancelling orders
    if (!['pending', 'cancelling'].includes(order.status)) {
      return response.badRequest({
        message: 'Order cannot be grabbed in current status',
      })
    }

    // Update status to processing
    order.status = 'processing'
    await order.save()

    // Create status change record
    await OrderStatusChange.create({
      orderId: order.id,
      status: 'processing',
      changedBy: currentUser.id,
    })

    // Load relationships for response
    await order.load('user')
    await order.load('statusChanges', (query) => {
      query.preload('changedByUser').orderBy('created_at', 'asc')
    })
    await order.load('items', (itemsQuery) => {
      itemsQuery.preload('media')
    })

    return response.json({ order })
  }

  async myOrders({ auth, response }: HttpContext) {
    const currentUser = auth.user!

    const orders = await Order.query()
      .whereHas('statusChanges', (query) => {
        query.where('changed_by', currentUser.id)
      })
      .whereIn('status', ['processing', 'packing', 'ready', 'shipping'])
      .preload('user')
      .preload('address')
      .preload('statusChanges', (query) => {
        query.preload('changedByUser').orderBy('created_at', 'asc')
      })
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('media')
      })
      .orderBy('created_at', 'asc')

    return response.json({ orders })
  }
}