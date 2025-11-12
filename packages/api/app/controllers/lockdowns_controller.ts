import type { HttpContext } from '@adonisjs/core/http'
import SystemSetting from '#models/system_setting'

export default class LockdownsController {
  /**
   * Check lock-down status (public endpoint)
   */
  async status({ response }: HttpContext) {
    const isLockedDown = await SystemSetting.isLockedDown()
    return response.json({ isLockedDown })
  }

  /**
   * Activate emergency lock-down (staff only: help+)
   */
  async activate({ auth, response }: HttpContext) {
    const user = auth.user

    if (!user) {
      return response.unauthorized({ message: 'Unauthorized' })
    }

    // Only staff can activate lock-down
    const allowedRoles = ['super_admin', 'admin', 'support', 'help']
    if (!allowedRoles.includes(user.role)) {
      return response.forbidden({ message: 'Access denied. Staff privileges required.' })
    }

    // Activate lock-down
    await SystemSetting.activateLockDown()

    // Logout the user who activated it
    await auth.use('web').logout()

    return response.json({
      message: 'Emergency lock-down activated. All users have been logged out.',
      isLockedDown: true
    })
  }
}