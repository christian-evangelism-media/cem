/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Feel free to define as many
| throttle middleware as needed.
|
*/

import limiter from '@adonisjs/limiter/services/main'

export const throttle = limiter.define('global', () => {
  return limiter.allowRequests(10).every('1 minute')
})

export const authThrottle = limiter.define('auth', (ctx) => {
  return limiter
    .allowRequests(5)
    .every('15 minutes')
    .usingKey(`auth_${ctx.request.ip()}`)
})

export const registerThrottle = limiter.define('register', (ctx) => {
  return limiter
    .allowRequests(3)
    .every('1 hour')
    .usingKey(`register_${ctx.request.ip()}`)
})