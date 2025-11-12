import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'media'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('inventory_stock').nullable().defaultTo(null)
      table.integer('low_stock_threshold').nullable().defaultTo(null)
      table.boolean('track_inventory').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('inventory_stock')
      table.dropColumn('low_stock_threshold')
      table.dropColumn('track_inventory')
    })
  }
}