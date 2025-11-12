import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('full_name', 'first_name')
      table.string('last_name').notNullable().after('first_name')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('last_name')
      table.renameColumn('first_name', 'full_name')
    })
  }
}