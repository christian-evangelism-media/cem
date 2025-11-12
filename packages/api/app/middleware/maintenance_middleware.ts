import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import MaintenanceMode from '#models/maintenance_mode'

/**
 * Middleware to block requests during maintenance mode.
 * Always allows:
 * - Health check endpoint
 * - Maintenance mode status/control endpoints (for admin+)
 */
export default class MaintenanceMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    // Always allow health checks
    if (request.url().startsWith('/health')) {
      return next()
    }

    // Always allow maintenance mode endpoints
    if (request.url().startsWith('/maintenance')) {
      return next()
    }

    // Check if in maintenance mode
    const isInMaintenance = await MaintenanceMode.isInMaintenance()

    if (isInMaintenance) {
      return response.status(503).json({
        error: 'Service Unavailable',
        message: 'System is currently under maintenance. Please check back later.',
      })
    }

    return next()
  }
}