import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE').notNullable()
      table.string('subject').notNullable()
      table.text('body').notNullable()
      table.boolean('is_read').defaultTo(false).notNullable()
      table.integer('responded_by_id').unsigned().references('users.id').onDelete('SET NULL').nullable()
      table.text('response_body').nullable()
      table.timestamp('responded_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
