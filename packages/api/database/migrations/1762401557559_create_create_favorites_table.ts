import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'favorites'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.integer('media_id').unsigned().notNullable().references('id').inTable('media').onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Ensure a user can only favorite a media item once
      table.unique(['user_id', 'media_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}