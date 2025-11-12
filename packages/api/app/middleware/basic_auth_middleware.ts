import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import User from '#models/user'

/**
 * Middleware to handle HTTP Basic Authentication for scanner app
 */
export default class BasicAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const authHeader = ctx.request.header('authorization')

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return ctx.response.unauthorized({
        message: 'Missing or invalid Authorization header',
      })
    }

    // Extract and decode credentials
    const base64Credentials = authHeader.substring(6)
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
    const [email, password] = credentials.split(':')

    if (!email || !password) {
      return ctx.response.unauthorized({
        message: 'Invalid credentials format',
      })
    }

    try {
      // Verify credentials against database
      const user = await User.verifyCredentials(email, password)

      // Check if user is blocked
      if (user.isBlocked) {
        return ctx.response.forbidden({
          message: 'Your account has been blocked. Please contact support.',
        })
      }

      // Check if user has staff privileges (support, admin, super_admin)
      const allowedRoles = ['super_admin', 'admin', 'support']
      if (!allowedRoles.includes(user.role)) {
        return ctx.response.forbidden({
          message: 'Access denied. Staff privileges required.',
        })
      }

      // Attach user to context for use in controller
      // Can't set auth.user directly, so we use a custom property
      (ctx as any).user = user

      return next()
    } catch (error) {
      return ctx.response.unauthorized({
        message: 'Invalid credentials',
      })
    }
  }
}
