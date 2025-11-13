import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Order from '#models/order'
import Media from '#models/media'
import Message from '#models/message'
import db from '@adonisjs/lucid/services/db'

export default class AdminController {
  async stats({ response }: HttpContext) {
    const totalUsers = await User.query().count('* as total')
    const totalMedia = await Media.query().count('* as total')

    // Get total shipped orders
    const ordersShipped = await Order.query()
      .where('status', 'shipped')
      .count('* as total')

    // Get unique countries from shipped orders
    const countriesResult = await db
      .from('orders')
      .join('addresses', 'orders.address_id', 'addresses.id')
      .whereIn('orders.status', ['shipped'])
      .distinct('addresses.country')

    const uniqueCountries = countriesResult.length

    // Get unique cities from shipped orders
    const citiesResult = await db
      .from('orders')
      .join('addresses', 'orders.address_id', 'addresses.id')
      .whereIn('orders.status', ['shipped'])
      .distinct('addresses.city')

    const uniqueCities = citiesResult.length

    // Get count of orders ready to ship
    const ordersReadyToShip = await Order.query()
      .where('status', 'ready')
      .where('delivery_method', 'shipping')
      .count('* as total')

    // Get count of orders awaiting pickup
    const ordersAwaitingPickup = await Order.query()
      .where('status', 'awaiting')
      .where('delivery_method', 'pickup')
      .count('* as total')

    // Get count of low stock media items
    const mediaItems = await Media.query()
      .where('track_inventory', true)
      .where('is_visible', true)
      .whereNotNull('low_stock_threshold')

    let lowStockMedia = 0
    for (const media of mediaItems) {
      if (media.inventoryStock && media.lowStockThreshold) {
        const totalStock = Object.values(media.inventoryStock).reduce((sum, val) => sum + (val || 0), 0)
        if (totalStock <= media.lowStockThreshold) {
          lowStockMedia++
        }
      }
    }

    // Get total quantity of gospel tracts shipped
    const tractsShippedResult = await db
      .from('order_items')
      .join('orders', 'order_items.order_id', 'orders.id')
      .join('media', 'order_items.media_id', 'media.id')
      .whereIn('orders.status', ['shipped'])
      .where('media.type', 'Gospel Tract')
      .sum('order_items.quantity as total')

    const totalTractsShipped = tractsShippedResult[0]?.total || 0

    // Get orders shipped per month (last 6 months)
    const ordersPerMonth = await db.rawQuery(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month_sort,
        COUNT(*) as count
      FROM orders
      WHERE status = 'shipped'
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `)

    // Get tracts shipped by country (top 10)
    const tractsByCountry = await db.rawQuery(`
      SELECT
        addresses.country,
        SUM(order_items.quantity) as count
      FROM order_items
      JOIN orders ON order_items.order_id = orders.id
      JOIN addresses ON orders.address_id = addresses.id
      JOIN media ON order_items.media_id = media.id
      WHERE orders.status = 'shipped'
        AND media.type = 'Gospel Tract'
      GROUP BY addresses.country
      ORDER BY count DESC
      LIMIT 10
    `)

    // Get orders with unread feedback
    const messagesWithUnreadFeedback = await Message.query()
      .whereNotNull('order_id')
      .where('is_read', false)
      .select('order_id')
      .groupBy('order_id')

    const unreadFeedbackOrderIds = messagesWithUnreadFeedback.map((msg) => msg.orderId!)

    const recentOrders = await Order.query()
      .where((query) => {
        query.whereIn('status', ['pending', 'cancelling'])
        if (unreadFeedbackOrderIds.length > 0) {
          query.orWhereIn('id', unreadFeedbackOrderIds)
        }
      })
      .preload('user')
      .preload('statusChanges', (query) => {
        query.preload('changedByUser').orderBy('created_at', 'asc')
      })
      .preload('items', (itemsQuery) => {
        itemsQuery.preload('media')
      })
      .preload('messages', (messagesQuery) => {
        messagesQuery.preload('user').orderBy('created_at', 'desc')
      })
      .orderByRaw(`
        CASE
          WHEN id IN (${unreadFeedbackOrderIds.length > 0 ? unreadFeedbackOrderIds.join(',') : 'NULL'}) THEN 0
          WHEN status = 'cancelling' THEN 1
          ELSE 2
        END
      `)
      .orderBy('created_at', 'asc')
      .limit(10)

    return response.json({
      totalUsers: totalUsers[0].$extras.total,
      ordersShipped: ordersShipped[0].$extras.total,
      totalMedia: totalMedia[0].$extras.total,
      uniqueCountries,
      uniqueCities,
      totalTractsShipped,
      ordersReadyToShip: ordersReadyToShip[0].$extras.total,
      ordersAwaitingPickup: ordersAwaitingPickup[0].$extras.total,
      lowStockMedia,
      ordersPerMonth: ordersPerMonth.rows,
      tractsByCountry: tractsByCountry.rows,
      recentOrders: recentOrders,
    })
  }
}