import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'media'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('name_i18n').nullable()
      table.json('description_i18n').nullable()
      table.json('type_i18n').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('name_i18n')
      table.dropColumn('description_i18n')
      table.dropColumn('type_i18n')
    })
  }
}