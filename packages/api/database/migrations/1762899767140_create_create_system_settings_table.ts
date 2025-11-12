import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'system_settings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.boolean('is_locked_down').defaultTo(false).notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    // Insert the single settings row
    this.defer(async (db) => {
      await db.table(this.tableName).insert({
        is_locked_down: false,
        created_at: new Date(),
        updated_at: new Date()
      })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}