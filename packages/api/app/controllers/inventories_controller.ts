import type { HttpContext } from '@adonisjs/core/http'
import Media from '#models/media'
import inventoryService from '#services/inventory_service'
import vine from '@vinejs/vine'

export default class InventoriesController {
  async lowStock({ response }: HttpContext) {
    const items = await inventoryService.getLowStockItems()
    return response.json({ items })
  }

  async adjust({ auth, params, request, response }: HttpContext) {
    const user = auth.user!

    const schema = vine.compile(
      vine.object({
        bundleSize: vine.number().min(1),
        quantity: vine.number().min(0),
        reason: vine.string().optional(),
      })
    )

    const data = await request.validateUsing(schema)

    try {
      const media = await inventoryService.setStock(
        params.id,
        data.bundleSize,
        data.quantity,
        user.id,
        data.reason || 'Manual adjustment'
      )

      return response.json({ media })
    } catch (error) {
      return response.badRequest({
        message: error instanceof Error ? error.message : 'Failed to adjust inventory',
      })
    }
  }

  async enableTracking({ params, request, response }: HttpContext) {
    const schema = vine.compile(
      vine.object({
        trackInventory: vine.boolean(),
        bundleSizes: vine.array(vine.number().min(1)).optional(),
        lowStockThreshold: vine.number().min(0).optional(),
      })
    )

    const data = await request.validateUsing(schema)

    const media = await Media.findOrFail(params.id)
    media.trackInventory = data.trackInventory

    if (data.trackInventory) {
      // Initialize inventory with media's bundle sizes
      const bundleSizes = data.bundleSizes || media.bundleSizes || [1]
      await inventoryService.initializeInventory(params.id, bundleSizes)
      media.lowStockThreshold = data.lowStockThreshold ?? null
    }

    await media.save()

    return response.json({ media })
  }
}
