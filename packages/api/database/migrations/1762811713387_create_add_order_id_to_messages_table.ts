import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('order_id').unsigned().nullable().references('id').inTable('orders').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('order_id')
    })
  }
}