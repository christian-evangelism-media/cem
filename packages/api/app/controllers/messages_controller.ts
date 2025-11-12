import type { HttpContext } from '@adonisjs/core/http'
import Message from '#models/message'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

export default class MessagesController {
  /**
   * List messages
   * - Users see their own messages + broadcast announcements
   * - Staff (support/admin/super_admin) see all messages
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.user!

    let query = Message.query()
      .preload('user')
      .preload('respondedBy')
      .preload('order')
      .orderBy('created_at', 'desc')

    // Regular users see their own messages + broadcasts
    if (user.role === 'user') {
      query = query.where((builder) => {
        builder.where('user_id', user.id).orWhere('is_broadcast', true)
      })
    }
    // Staff roles see all messages
    else if (!['support', 'admin', 'super_admin'].includes(user.role)) {
      return response.forbidden({ message: 'Access denied' })
    }

    const messages = await query

    // Get unread count
    let unreadCount = 0
    if (user.role === 'user') {
      // Users: unread messages for them + unread broadcasts
      const result = await Message.query()
        .where((builder) => {
          builder.where('user_id', user.id).orWhere('is_broadcast', true)
        })
        .where('is_read', false)
        .count('* as total')
      unreadCount = result[0].$extras.total
    } else {
      // Staff: all unread non-broadcast messages
      const result = await Message.query()
        .where('is_read', false)
        .where('is_broadcast', false)
        .count('* as total')
      unreadCount = result[0].$extras.total
    }

    return response.json({
      messages,
      unreadCount,
    })
  }

  /**
   * Show a specific message
   */
  async show({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const message = await Message.query()
      .where('id', params.id)
      .preload('user')
      .preload('respondedBy')
      .preload('order')
      .firstOrFail()

    // Users can only view their own messages
    if (user.role === 'user' && message.userId !== user.id) {
      return response.forbidden({ message: 'Access denied' })
    }

    // Staff can view all messages
    if (
      user.role !== 'user' &&
      !['support', 'admin', 'super_admin'].includes(user.role)
    ) {
      return response.forbidden({ message: 'Access denied' })
    }

    // Mark as read when staff views it
    if (user.role !== 'user' && !message.isRead) {
      message.isRead = true
      await message.save()
    }

    return response.json({ message })
  }

  /**
   * Create a new message (users only)
   */
  async store({ auth, request, response }: HttpContext) {
    const user = auth.user!

    const validator = vine.compile(
      vine.object({
        subject: vine.string().trim().minLength(1).maxLength(200),
        body: vine.string().trim().minLength(1),
        orderId: vine.number().optional(),
        type: vine.enum(['contact', 'order_feedback'] as const).optional(),
      })
    )

    const data = await request.validateUsing(validator)

    // Determine message type
    let type: 'contact' | 'order_feedback' = 'contact'
    if (data.type) {
      type = data.type
    } else if (data.orderId) {
      type = 'order_feedback'
    }

    const message = await Message.create({
      userId: user.id,
      subject: data.subject,
      body: data.body,
      orderId: data.orderId || null,
      type,
      isBroadcast: false,
      isRead: false,
    })

    await message.load('user')

    return response.json({ message })
  }

  /**
   * Respond to a message (staff only: support/admin/super_admin)
   */
  async respond({ auth, params, request, response }: HttpContext) {
    const user = auth.user!

    // Only support/admin/super_admin can respond
    if (!['support', 'admin', 'super_admin'].includes(user.role)) {
      return response.forbidden({ message: 'Access denied' })
    }

    const message = await Message.findOrFail(params.id)

    const validator = vine.compile(
      vine.object({
        responseBody: vine.string().trim().minLength(1),
      })
    )

    const data = await request.validateUsing(validator)

    message.responseBody = data.responseBody
    message.respondedById = user.id
    message.respondedAt = DateTime.now()
    message.isRead = true

    await message.save()
    await message.load('user')
    await message.load('respondedBy')

    return response.json({ message })
  }

  /**
   * Toggle read/unread status (staff only: support/admin/super_admin)
   */
  async toggleRead({ auth, params, response }: HttpContext) {
    const user = auth.user!

    // Only support/admin/super_admin can toggle read status
    if (!['support', 'admin', 'super_admin'].includes(user.role)) {
      return response.forbidden({ message: 'Access denied' })
    }

    const message = await Message.findOrFail(params.id)
    message.isRead = !message.isRead
    await message.save()

    return response.json({ message })
  }

  /**
   * Create a broadcast announcement (staff only: admin/super_admin)
   */
  async broadcast({ auth, request, response }: HttpContext) {
    const user = auth.user!

    // Only admin/super_admin can broadcast
    if (!['admin', 'super_admin'].includes(user.role)) {
      return response.forbidden({ message: 'Access denied' })
    }

    const validator = vine.compile(
      vine.object({
        subject: vine.string().trim().minLength(1).maxLength(200),
        body: vine.string().trim().minLength(1),
      })
    )

    const data = await request.validateUsing(validator)

    const message = await Message.create({
      userId: user.id, // Track who sent it
      subject: data.subject,
      body: data.body,
      orderId: null,
      type: 'announcement',
      isBroadcast: true,
      isRead: false,
      respondedById: user.id, // Mark as from staff
    })

    await message.load('user')

    return response.json({ message })
  }
}
