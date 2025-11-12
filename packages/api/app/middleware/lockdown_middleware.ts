import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import SystemSetting from '#models/system_setting'

export default class LockdownMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Check if system is in lock-down mode
    const isLockedDown = await SystemSetting.isLockedDown()

    if (!isLockedDown) {
      return next()
    }

    // Define routes that are allowed during lock-down
    const allowedRoutes = [
      '/lockdown/status',           // Status check endpoint
      '/media',                      // Public media browsing (GET only)
      '/lockdown/activate',          // Lock-down activation endpoint
      '/logout',                     // Allow users to logout during lockdown
    ]

    const path = ctx.request.url()
    const method = ctx.request.method()

    // Allow public media browsing (GET requests only)
    if (path.startsWith('/media') && method === 'GET') {
      return next()
    }

    // Allow lock-down status check and activation
    if (allowedRoutes.some(route => path === route || path.startsWith(route))) {
      return next()
    }

    // System is locked down - return 423 Locked status
    return ctx.response.status(423).json({
      message: 'System is currently in emergency lock-down mode. Please try again later.',
      isLockedDown: true
    })
  }
}