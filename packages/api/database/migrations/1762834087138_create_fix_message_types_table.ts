import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    // Update messages that have an order_id to be type 'order_feedback'
    this.defer(async (db) => {
      await db
        .from(this.tableName)
        .whereNotNull('order_id')
        .update({ type: 'order_feedback' })
    })
  }

  async down() {
    // Revert messages back to 'contact' type
    this.defer(async (db) => {
      await db
        .from(this.tableName)
        .whereNotNull('order_id')
        .update({ type: 'contact' })
    })
  }
}