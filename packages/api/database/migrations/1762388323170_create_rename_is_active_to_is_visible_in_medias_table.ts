import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'media'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('is_active', 'is_visible')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('is_visible', 'is_active')
    })
  }
}