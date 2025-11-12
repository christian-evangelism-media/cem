import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'media'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('stock_quantity')
      table.jsonb('inventory_stock').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('inventory_stock')
      table.integer('stock_quantity').unsigned().defaultTo(0)
    })
  }
}