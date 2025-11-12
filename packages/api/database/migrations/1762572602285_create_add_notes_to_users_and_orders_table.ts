import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.text('notes').nullable()
    })

    this.schema.alterTable('orders', (table) => {
      table.text('notes').nullable()
      table.string('tracking_number').nullable()
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropColumn('notes')
    })

    this.schema.alterTable('orders', (table) => {
      table.dropColumn('notes')
      table.dropColumn('tracking_number')
    })
  }
}
