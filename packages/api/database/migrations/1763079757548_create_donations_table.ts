import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'donations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.decimal('amount', 10, 2).notNullable()
      table.string('currency', 3).notNullable().defaultTo('USD')
      table.string('stripe_session_id').unique().notNullable()
      table.string('stripe_payment_intent_id').unique().nullable()
      table.enum('status', ['pending', 'completed', 'failed', 'refunded']).notNullable().defaultTo('pending')
      table.string('donor_email').nullable()
      table.string('donor_name').nullable()
      table.text('message').nullable()
      table.json('metadata').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}