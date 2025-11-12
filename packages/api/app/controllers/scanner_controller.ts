import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import OrderStatusChange from '#models/order_status_change'

export default class ScannerController {
  async login(ctx: HttpContext) {
    const user = (ctx as any).user

    // Just return user info - credentials already validated by middleware
    return ctx.response.ok({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    })
  }
  async shipOrder(ctx: HttpContext) {
    const user = (ctx as any).user

    const order = await Order.findOrFail(ctx.params.id)

    // Update order status to shipping (ready to hand to carrier)
    order.status = 'shipping'
    await order.save()

    // Create status change record
    await OrderStatusChange.create({
      orderId: order.id,
      status: 'shipping',
      changedBy: user.id,
    })

    return ctx.response.ok({ message: 'Order marked as shipping', order })
  }

  async unshipOrder(ctx: HttpContext) {
    const user = (ctx as any).user

    const order = await Order.findOrFail(ctx.params.id)

    // Revert order status to ready
    order.status = 'ready'
    await order.save()

    // Create status change record
    await OrderStatusChange.create({
      orderId: order.id,
      status: 'ready',
      changedBy: user.id,
    })

    return ctx.response.ok({ message: 'Order reverted to ready', order })
  }

  async batchShip(ctx: HttpContext) {
    const user = (ctx as any).user
    const { orderIds } = ctx.request.only(['orderIds'])

    for (const orderId of orderIds) {
      const order = await Order.findOrFail(orderId)
      order.status = 'shipped'
      await order.save()

      await OrderStatusChange.create({
        orderId: order.id,
        status: 'shipped',
        changedBy: user.id,
      })
    }

    return ctx.response.ok({ message: `${orderIds.length} orders marked as shipped` })
  }

  async batchUnship(ctx: HttpContext) {
    const user = (ctx as any).user
    const { orderIds } = ctx.request.only(['orderIds'])

    for (const orderId of orderIds) {
      const order = await Order.findOrFail(orderId)
      order.status = 'ready'
      await order.save()

      await OrderStatusChange.create({
        orderId: order.id,
        status: 'ready',
        changedBy: user.id,
      })
    }

    return ctx.response.ok({ message: `${orderIds.length} orders reverted to ready` })
  }
}
