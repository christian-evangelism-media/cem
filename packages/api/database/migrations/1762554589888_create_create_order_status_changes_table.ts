import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_status_changes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE')
      table.string('status').notNullable()
      table.integer('changed_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}