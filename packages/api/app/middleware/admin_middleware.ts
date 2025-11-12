import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    if (!user) {
      return ctx.response.unauthorized({ message: 'Unauthorized access' })
    }

    const allowedRoles = ['super_admin', 'admin', 'support', 'help']
    if (!allowedRoles.includes(user.role)) {
      return ctx.response.forbidden({ message: 'Access denied. Staff privileges required.' })
    }

    const output = await next()
    return output
  }
}