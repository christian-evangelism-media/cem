import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Order from '#models/order'
import Media from '#models/media'
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
    const ordersWithUnreadFeedback = await db.rawQuery(`
      SELECT DISTINCT order_id
      FROM messages
      WHERE order_id IS NOT NULL
        AND is_read = false
    `)
    const unreadFeedbackOrderIds = ordersWithUnreadFeedback.rows.map((row: any) => row.order_id)

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
      totalTractsShipped,
      ordersPerMonth: ordersPerMonth.rows,
      tractsByCountry: tractsByCountry.rows,
      recentOrders: recentOrders,
    })
  }
}