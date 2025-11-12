import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'media'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('allowed_quantities').notNullable().defaultTo(JSON.stringify([1, 20, 50, 100, 150, 200]))
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('allowed_quantities')
    })
  }
}