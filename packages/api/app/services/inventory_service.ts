import Media from '#models/media'
import InventoryMovement from '#models/inventory_movement'
import db from '@adonisjs/lucid/services/db'

export class InventoryService {
  /**
   * Deduct stock using the largest available bundles first
   * For example, to fulfill 100 tracts, prefer 2x50 over 5x20
   */
  async deductStock(
    mediaId: number,
    quantityOrdered: number,
    orderId: number | null = null,
    reason: string | null = 'Order placed'
  ) {
    return await db.transaction(async (trx) => {
      const media = await Media.findOrFail(mediaId, { client: trx })

      if (!media.trackInventory || !media.inventoryStock) {
        return media
      }

      const inventory = { ...media.inventoryStock }
      const bundleSizes = Object.keys(inventory)
        .map(Number)
        .sort((a, b) => b - a) // Sort descending (largest first)

      let remaining = quantityOrdered
      const deductions: Record<string, number> = {}

      // Try to fulfill using largest bundles first
      for (const bundleSize of bundleSizes) {
        if (remaining === 0) break

        const bundlesNeeded = Math.floor(remaining / bundleSize)
        const bundlesAvailable = inventory[bundleSize] || 0
        const bundlesToUse = Math.min(bundlesNeeded, bundlesAvailable)

        if (bundlesToUse > 0) {
          deductions[bundleSize] = bundlesToUse
          inventory[bundleSize] -= bundlesToUse
          remaining -= bundlesToUse * bundleSize
        }
      }

      if (remaining > 0) {
        throw new Error(`Insufficient stock to fulfill order of ${quantityOrdered} tracts`)
      }

      media.inventoryStock = inventory
      await media.save()

      // Log the movement with details of what was deducted
      await InventoryMovement.create(
        {
          mediaId,
          quantityChange: -quantityOrdered,
          quantityAfter: this.getTotalTracts(inventory),
          type: 'deduction',
          reason: reason || `Deducted: ${JSON.stringify(deductions)}`,
          orderId,
          changedBy: null,
        },
        { client: trx }
      )

      return media
    })
  }

  /**
   * Restore stock to specific bundle sizes
   */
  async restoreStock(
    mediaId: number,
    quantity: number,
    orderId: number | null = null,
    reason: string | null = 'Order cancelled'
  ) {
    return await db.transaction(async (trx) => {
      const media = await Media.findOrFail(mediaId, { client: trx })

      if (!media.trackInventory || !media.inventoryStock) {
        return media
      }

      const inventory = { ...media.inventoryStock }
      const bundleSizes = Object.keys(inventory)
        .map(Number)
        .sort((a, b) => b - a)

      let remaining = quantity
      const additions: Record<string, number> = {}

      // Restore using largest bundles first
      for (const bundleSize of bundleSizes) {
        if (remaining === 0) break

        const bundlesToAdd = Math.floor(remaining / bundleSize)
        if (bundlesToAdd > 0) {
          additions[bundleSize] = bundlesToAdd
          inventory[bundleSize] = (inventory[bundleSize] || 0) + bundlesToAdd
          remaining -= bundlesToAdd * bundleSize
        }
      }

      media.inventoryStock = inventory
      await media.save()

      await InventoryMovement.create(
        {
          mediaId,
          quantityChange: quantity,
          quantityAfter: this.getTotalTracts(inventory),
          type: 'addition',
          reason: reason || `Restored: ${JSON.stringify(additions)}`,
          orderId,
          changedBy: null,
        },
        { client: trx }
      )

      return media
    })
  }

  /**
   * Set specific bundle quantities (for admin manual adjustments)
   */
  async setStock(
    mediaId: number,
    bundleSize: number,
    newQuantity: number,
    changedBy: number,
    reason: string | null = 'Manual adjustment'
  ) {
    return await db.transaction(async (trx) => {
      const media = await Media.findOrFail(mediaId, { client: trx })

      if (!media.trackInventory) {
        throw new Error('Inventory tracking is not enabled for this media item')
      }

      if (!media.inventoryStock) {
        throw new Error('Inventory stock not initialized for this media item')
      }

      const inventory = { ...media.inventoryStock }
      const oldQuantity = inventory[bundleSize] || 0

      inventory[bundleSize] = newQuantity
      media.inventoryStock = inventory

      await media.save()

      const quantityChange = (newQuantity - oldQuantity) * bundleSize

      await InventoryMovement.create(
        {
          mediaId,
          quantityChange,
          quantityAfter: this.getTotalTracts(inventory),
          type: quantityChange >= 0 ? 'addition' : 'deduction',
          reason: reason || `Adjusted bundle ${bundleSize}: ${oldQuantity} → ${newQuantity}`,
          changedBy,
        },
        { client: trx }
      )

      return media
    })
  }

  /**
   * Check if we have enough stock to fulfill an order
   */
  async checkStock(mediaId: number, requiredQuantity: number): Promise<boolean> {
    const media = await Media.findOrFail(mediaId)

    if (!media.trackInventory || !media.inventoryStock) {
      return true
    }

    const totalAvailable = this.getTotalTracts(media.inventoryStock)
    return totalAvailable >= requiredQuantity
  }

  /**
   * Check if any bundle is low on stock
   */
  async isLowStock(mediaId: number): Promise<boolean> {
    const media = await Media.findOrFail(mediaId)

    if (
      !media.trackInventory ||
      !media.inventoryStock ||
      media.lowStockThreshold === null
    ) {
      return false
    }

    const totalTracts = this.getTotalTracts(media.inventoryStock)
    return totalTracts <= media.lowStockThreshold
  }

  /**
   * Get all media items that are low on stock
   */
  async getLowStockItems(): Promise<Media[]> {
    const allMedia = await Media.query()
      .where('track_inventory', true)
      .whereNotNull('inventory_stock')
      .whereNotNull('low_stock_threshold')

    return allMedia.filter((media) => {
      const totalTracts = this.getTotalTracts(media.inventoryStock!)
      return totalTracts <= media.lowStockThreshold!
    })
  }

  /**
   * Calculate total number of individual tracts from bundle inventory
   */
  private getTotalTracts(inventory: Record<string, number>): number {
    return Object.entries(inventory).reduce((total, [bundleSize, count]) => {
      return total + Number(bundleSize) * count
    }, 0)
  }

  /**
   * Initialize inventory stock for a new media item
   */
  async initializeInventory(
    mediaId: number,
    bundleSizes: number[] = [1, 20, 50]
  ): Promise<Media> {
    const media = await Media.findOrFail(mediaId)

    const inventory: Record<string, number> = {}
    bundleSizes.forEach((size) => {
      inventory[size] = 0
    })

    media.inventoryStock = inventory
    await media.save()

    return media
  }
}

export default new InventoryService()
