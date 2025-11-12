import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('orders', (table) => {
      table.integer('address_id').unsigned().nullable().references('id').inTable('addresses').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable('orders', (table) => {
      table.dropColumn('address_id')
    })
  }
}