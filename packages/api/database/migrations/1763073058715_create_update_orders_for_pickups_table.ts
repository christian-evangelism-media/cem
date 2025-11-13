import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Add delivery_method enum (shipping or pickup)
      table.enum('delivery_method', ['shipping', 'pickup']).defaultTo('shipping').notNullable()

      // Make address_id nullable since pickup orders don't need an address
      table.integer('address_id').unsigned().nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('delivery_method')

      // Restore address_id to not nullable
      table.integer('address_id').unsigned().notNullable().alter()
    })
  }
}