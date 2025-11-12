import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'inventory_movements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('media_id').unsigned().notNullable().references('id').inTable('media').onDelete('CASCADE')
      table.integer('quantity_change').notNullable()
      table.integer('quantity_after').notNullable()
      table.string('type').notNullable()
      table.string('reason').nullable()
      table.integer('order_id').unsigned().nullable().references('id').inTable('orders').onDelete('SET NULL')
      table.integer('changed_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}