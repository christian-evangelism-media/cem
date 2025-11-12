import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'addresses'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('name').notNullable().after('user_id')
      table.string('phone').nullable().after('country')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('name')
      table.dropColumn('phone')
    })
  }
}