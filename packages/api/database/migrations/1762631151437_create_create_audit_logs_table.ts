import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE').notNullable()
      table.integer('modified_by_id').unsigned().references('users.id').onDelete('SET NULL').nullable()
      table.string('action').notNullable() // e.g., 'password_reset', 'email_changed', 'details_updated'
      table.string('field_name').nullable() // what field was changed
      table.text('old_value').nullable()
      table.text('new_value').nullable()
      table.timestamp('created_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
