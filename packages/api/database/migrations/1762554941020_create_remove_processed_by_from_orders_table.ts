import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('processed_by')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('processed_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
    })
  }
}