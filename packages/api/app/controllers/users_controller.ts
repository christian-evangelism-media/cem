import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import AuditLog from '#models/audit_log'
import { randomBytes } from 'node:crypto'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import vine from '@vinejs/vine'
import app from '@adonisjs/core/services/app'

export default class UsersController {
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const search = request.input('search', '')

    const query = User.query()

    // Search through firstName, lastName, and email
    if (search) {
      query.where((builder) => {
        builder
          .whereILike('first_name', `%${search}%`)
          .orWhereILike('last_name', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
      })
    }

    const users = await query
      .orderBy('created_at', 'desc')
      .paginate(page, limit)

    return response.json({
      meta: users.getMeta(),
      data: users.all(),
    })
  }

  async show({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)

    return response.json({ user })
  }

  async store({ auth, request, response }: HttpContext) {
    const currentUser = auth.user!

    // Build email validator - normalize only in production
    let emailValidator = vine.string().email()
    if (app.inProduction) {
      emailValidator = emailValidator.normalizeEmail()
    }

    const schema = vine.compile(
      vine.object({
        firstName: vine.string().trim(),
        lastName: vine.string().trim(),
        email: emailValidator,
        role: vine.enum(['user', 'help', 'support', 'admin']),
      })
    )

    const data = await request.validateUsing(schema)

    // Permission check: only super_admin can create admins
    if (data.role === 'admin' && currentUser.role !== 'super_admin') {
      return response.forbidden({ message: 'Only super admins can create admin users' })
    }

    // Generate a random temporary password
    const tempPassword = randomBytes(16).toString('hex')

    const user = await User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: tempPassword,
      role: data.role,
    })

    // Send welcome email with temporary password
    await mail.send((message) => {
      message
        .to(user.email)
        .from(env.get('MAIL_FROM_ADDRESS', 'noreply@example.com'))
        .subject('Welcome - Your Account Has Been Created')
        .htmlView('emails/admin_created_user', {
          user,
          tempPassword,
          appUrl: env.get('APP_URL'),
        })
    })

    return response.created({ user })
  }

  async updateRole({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.user!
    const user = await User.findOrFail(params.id)

    const schema = vine.compile(
      vine.object({
        role: vine.enum(['user', 'help', 'support', 'admin']),
      })
    )

    const data = await request.validateUsing(schema)

    // Cannot modify super_admin
    if (user.role === 'super_admin') {
      return response.forbidden({ message: 'Cannot modify super admin role' })
    }

    // Cannot modify yourself
    if (user.id === currentUser.id) {
      return response.forbidden({ message: 'Cannot modify your own role' })
    }

    // Regular admin restrictions
    if (currentUser.role === 'admin') {
      // Cannot promote to admin
      if (data.role === 'admin') {
        return response.forbidden({ message: 'Only super admins can create admin users' })
      }
      // Cannot modify existing admins
      if (user.role === 'admin') {
        return response.forbidden({ message: 'Cannot modify other admin users' })
      }
    }

    user.role = data.role
    await user.save()

    return response.json({ user })
  }

  async update({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.user!
    const user = await User.findOrFail(params.id)

    // Help cannot modify users at all
    if (currentUser.role === 'help') {
      return response.forbidden({ message: 'Help cannot modify users' })
    }

    // Cannot modify super_admin unless you are super_admin
    if (user.role === 'super_admin' && currentUser.role !== 'super_admin') {
      return response.forbidden({ message: 'Cannot modify super admin' })
    }

    // Regular admin cannot modify other admins
    if (currentUser.role === 'admin' && user.role === 'admin' && user.id !== currentUser.id) {
      return response.forbidden({ message: 'Cannot modify other admin users' })
    }

    // Support can only modify regular users
    if (currentUser.role === 'support' && user.role !== 'user') {
      return response.forbidden({ message: 'Support can only modify regular users' })
    }

    // Build email validator - normalize only in production
    let emailValidator = vine.string().email()
    if (app.inProduction) {
      emailValidator = emailValidator.normalizeEmail()
    }

    const schema = vine.compile(
      vine.object({
        firstName: vine.string().trim().optional(),
        lastName: vine.string().trim().optional(),
        email: emailValidator.optional(),
        password: vine.string().minLength(6).optional(),
        preferredLanguages: vine.array(vine.string()).nullable().optional(),
        notes: vine.string().trim().nullable().optional(),
      })
    )

    const data = await request.validateUsing(schema)

    // Track changes for audit log (only for support role)
    const changes: { field: string; oldValue: string; newValue: string }[] = []

    if (currentUser.role === 'support') {
      if (data.firstName && data.firstName !== user.firstName) {
        changes.push({ field: 'firstName', oldValue: user.firstName, newValue: data.firstName })
      }
      if (data.lastName && data.lastName !== user.lastName) {
        changes.push({ field: 'lastName', oldValue: user.lastName, newValue: data.lastName })
      }
      if (data.email && data.email !== user.email) {
        changes.push({ field: 'email', oldValue: user.email, newValue: data.email })
      }
      if (data.password) {
        changes.push({ field: 'password', oldValue: '[hidden]', newValue: '[reset by support]' })
      }
    }

    user.merge(data)
    await user.save()

    // Create audit log entries for support changes
    if (currentUser.role === 'support' && changes.length > 0) {
      for (const change of changes) {
        await AuditLog.create({
          userId: user.id,
          modifiedById: currentUser.id,
          action: 'user_updated',
          fieldName: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
        })
      }
    }

    return response.json({ user })
  }

  async toggleBlock({ auth, params, response }: HttpContext) {
    const currentUser = auth.user!
    const user = await User.findOrFail(params.id)

    // Support cannot block users
    if (currentUser.role === 'support') {
      return response.forbidden({ message: 'Support cannot block users' })
    }

    // Cannot block super_admin
    if (user.role === 'super_admin') {
      return response.forbidden({ message: 'Cannot block super admin' })
    }

    // Cannot block yourself
    if (user.id === currentUser.id) {
      return response.forbidden({ message: 'Cannot block yourself' })
    }

    // Regular admin cannot block other admins
    if (currentUser.role === 'admin' && user.role === 'admin') {
      return response.forbidden({ message: 'Cannot block other admin users' })
    }

    user.isBlocked = !user.isBlocked
    await user.save()

    return response.json({ user })
  }

  async delete({ auth, params, response }: HttpContext) {
    const currentUser = auth.user!
    const user = await User.findOrFail(params.id)

    // Support cannot delete users
    if (currentUser.role === 'support') {
      return response.forbidden({ message: 'Support cannot delete users' })
    }

    // Cannot delete super_admin
    if (user.role === 'super_admin') {
      return response.forbidden({ message: 'Cannot delete super admin' })
    }

    // Cannot delete yourself
    if (user.id === currentUser.id) {
      return response.forbidden({ message: 'Cannot delete yourself' })
    }

    // Regular admin cannot delete other admins
    if (currentUser.role === 'admin' && user.role === 'admin') {
      return response.forbidden({ message: 'Cannot delete other admin users' })
    }

    await user.delete()

    return response.noContent()
  }
}