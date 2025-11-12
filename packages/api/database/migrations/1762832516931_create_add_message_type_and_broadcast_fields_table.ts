import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.enum('type', ['contact', 'announcement', 'order_feedback']).defaultTo('contact')
      table.boolean('is_broadcast').defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('type')
      table.dropColumn('is_broadcast')
    })
  }
}