import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'maintenance_modes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.boolean('is_active').defaultTo(false).notNullable()
      table.text('reason').nullable()
      table.integer('activated_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('activated_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}