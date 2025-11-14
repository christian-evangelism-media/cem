/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { registerThrottle, authThrottle } from '#start/limiter'

// Health check endpoint
router.get('/health', '#controllers/health_checks_controller.handle')

// Maintenance mode routes (admin+ only)
router.get('/maintenance/status', '#controllers/maintenances_controller.status')
router.post('/maintenance/activate', '#controllers/maintenances_controller.activate').use([middleware.auth(), middleware.admin()])
router.post('/maintenance/deactivate', '#controllers/maintenances_controller.deactivate').use([middleware.auth(), middleware.admin()])

router.post('/register', '#controllers/auth_controller.register').use(registerThrottle)
router.post('/login', '#controllers/auth_controller.login').use(authThrottle)
router.post('/logout', '#controllers/auth_controller.logout').use(middleware.auth())
router.get('/me', '#controllers/auth_controller.me').use(middleware.auth())
router.put('/me/preferences', '#controllers/auth_controller.updatePreferences').use(middleware.auth())
router.put('/me/profile', '#controllers/auth_controller.updateProfile').use(middleware.auth())
router.put('/me/password', '#controllers/auth_controller.changePassword').use(middleware.auth())
router.get('/verify-email', '#controllers/auth_controller.verifyEmail')
router.post('/resend-verification', '#controllers/auth_controller.resendVerification')

// Lock-down routes
router.get('/lockdown/status', '#controllers/lockdowns_controller.status')
router.post('/lockdown/activate', '#controllers/lockdowns_controller.activate').use(middleware.auth())

router.get('/media', '#controllers/media_controller.index')
router.get('/media/:id', '#controllers/media_controller.show')

router.get('/orders', '#controllers/orders_controller.index').use(middleware.auth())
router.get('/orders/:id', '#controllers/orders_controller.show').use(middleware.auth())
router.post('/orders', '#controllers/orders_controller.store').use(middleware.auth())
router.put('/orders/:id/cancel', '#controllers/orders_controller.cancel').use(middleware.auth())

router.get('/addresses', '#controllers/addresses_controller.index').use(middleware.auth())
router.get('/addresses/:id', '#controllers/addresses_controller.show').use(middleware.auth())
router.post('/addresses', '#controllers/addresses_controller.store').use(middleware.auth())
router.put('/addresses/:id', '#controllers/addresses_controller.update').use(middleware.auth())
router.delete('/addresses/:id', '#controllers/addresses_controller.destroy').use(middleware.auth())

router.get('/cart', '#controllers/carts_controller.index').use(middleware.auth())
router.post('/cart/items', '#controllers/carts_controller.store').use(middleware.auth())
router.put('/cart/items/:id', '#controllers/carts_controller.update').use(middleware.auth())
router.delete('/cart/items/:id', '#controllers/carts_controller.destroy').use(middleware.auth())
router.delete('/cart', '#controllers/carts_controller.clear').use(middleware.auth())

router.get('/favorites', '#controllers/favorites_controller.index').use(middleware.auth())
router.post('/favorites', '#controllers/favorites_controller.store').use(middleware.auth())
router.delete('/favorites/:id', '#controllers/favorites_controller.destroy').use(middleware.auth())

// Donation routes
router.post('/donations/checkout', '#controllers/donations_controller.createCheckoutSession')
router.post('/donations/webhook', '#controllers/donations_controller.handleWebhook')
router.get('/donations', '#controllers/donations_controller.index').use(middleware.auth())
router.get('/donations/:id', '#controllers/donations_controller.show').use(middleware.auth())
router.get('/donations/session/:sessionId', '#controllers/donations_controller.getSessionDetails')

router.get('/messages', '#controllers/messages_controller.index').use(middleware.auth())
router.get('/messages/:id', '#controllers/messages_controller.show').use(middleware.auth())
router.post('/messages', '#controllers/messages_controller.store').use(middleware.auth())
router.put('/messages/:id/respond', '#controllers/messages_controller.respond').use(middleware.auth())
router.put('/messages/:id/toggle-read', '#controllers/messages_controller.toggleRead').use(middleware.auth())
router.post('/messages/broadcast', '#controllers/messages_controller.broadcast').use(middleware.auth())

// Scanner routes (Basic Auth)
router.group(() => {
  router.post('/login', '#controllers/scanner_controller.login')
  router.put('/orders/:id/ship', '#controllers/scanner_controller.shipOrder')
  router.put('/orders/:id/unship', '#controllers/scanner_controller.unshipOrder')
  router.put('/orders/batch-ship', '#controllers/scanner_controller.batchShip')
  router.put('/orders/batch-unship', '#controllers/scanner_controller.batchUnship')
}).prefix('/scanner').use([middleware.basicAuth()])

// Admin routes
router.group(() => {
  router.get('/stats', '#controllers/admin_controller.stats')
  router.get('/users', '#controllers/users_controller.index')
  router.get('/users/:id', '#controllers/users_controller.show')
  router.post('/users', '#controllers/users_controller.store')
  router.put('/users/:id', '#controllers/users_controller.update')
  router.put('/users/:id/role', '#controllers/users_controller.updateRole')
  router.put('/users/:id/block', '#controllers/users_controller.toggleBlock')
  router.delete('/users/:id', '#controllers/users_controller.delete')
  router.get('/orders', '#controllers/orders_controller.adminIndex')
  router.get('/orders/:id', '#controllers/orders_controller.adminShow')
  router.put('/orders/:id', '#controllers/orders_controller.update')
  router.put('/orders/:id/status', '#controllers/orders_controller.update')
  router.put('/orders/:id/grab', '#controllers/orders_controller.grab')
  router.get('/my-orders', '#controllers/orders_controller.myOrders')
  router.post('/media', '#controllers/media_controller.store')
  router.put('/media/:id', '#controllers/media_controller.update')
  router.delete('/media/:id', '#controllers/media_controller.destroy')
  router.get('/inventory/low-stock', '#controllers/inventories_controller.lowStock')
  router.put('/inventory/:id/tracking', '#controllers/inventories_controller.enableTracking')
}).prefix('/admin').use([middleware.auth(), middleware.admin()])

// Inventory adjust - available to all staff
router.put('/admin/inventory/:id/adjust', '#controllers/inventories_controller.adjust').use(middleware.auth())
