import type { HttpContext } from '@adonisjs/core/http'
import MaintenanceMode from '#models/maintenance_mode'
import { DateTime } from 'luxon'

export default class MaintenancesController {
  /**
   * Get current maintenance mode status
   */
  async status({ response }: HttpContext) {
    const mode = await MaintenanceMode.query().orderBy('id', 'desc').first()

    if (!mode || !mode.isActive) {
      return response.ok({
        isActive: false,
        reason: null,
        activatedAt: null,
        activatedBy: null,
      })
    }

    await mode.load('activator')

    return response.ok({
      isActive: mode.isActive,
      reason: mode.reason,
      activatedAt: mode.activatedAt,
      activatedBy: mode.activator
        ? {
            id: mode.activator.id,
            firstName: mode.activator.firstName,
            lastName: mode.activator.lastName,
            email: mode.activator.email,
          }
        : null,
    })
  }

  /**
   * Activate maintenance mode (admin+ only)
   */
  async activate({ auth, request, response }: HttpContext) {
    const user = auth.user!

    // Only admin and super_admin can activate maintenance mode
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return response.forbidden({
        error: 'Forbidden',
        message: 'Only administrators can activate maintenance mode',
      })
    }

    const { reason } = request.only(['reason'])

    const mode = await MaintenanceMode.create({
      isActive: true,
      reason: reason || null,
      activatedBy: user.id,
      activatedAt: DateTime.now(),
    })

    return response.ok({
      message: 'Maintenance mode activated',
      mode: {
        isActive: mode.isActive,
        reason: mode.reason,
        activatedAt: mode.activatedAt,
      },
    })
  }

  /**
   * Deactivate maintenance mode (admin+ only)
   */
  async deactivate({ auth, response }: HttpContext) {
    const user = auth.user!

    // Only admin and super_admin can deactivate maintenance mode
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return response.forbidden({
        error: 'Forbidden',
        message: 'Only administrators can deactivate maintenance mode',
      })
    }

    const mode = await MaintenanceMode.query().orderBy('id', 'desc').first()

    if (!mode || !mode.isActive) {
      return response.ok({
        message: 'Maintenance mode is not active',
      })
    }

    mode.isActive = false
    await mode.save()

    return response.ok({
      message: 'Maintenance mode deactivated',
    })
  }
}
