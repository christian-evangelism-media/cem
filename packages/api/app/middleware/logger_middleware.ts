import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class LoggerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const start = Date.now()
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12) // HH:MM:SS.mmm

    console.log(`[${timestamp}] → ${ctx.request.method()} ${ctx.request.url()}`)

    await next()

    const duration = Date.now() - start
    const endTimestamp = new Date().toISOString().split('T')[1].slice(0, 12)
    console.log(`[${endTimestamp}] ← ${ctx.response.getStatus()} ${ctx.request.method()} ${ctx.request.url()} (${duration}ms)`)
  }
}
