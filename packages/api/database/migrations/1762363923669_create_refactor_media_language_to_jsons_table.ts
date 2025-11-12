import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'media'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('languages').notNullable().defaultTo('[]')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('language')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('language').notNullable().defaultTo('')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('languages')
    })
  }
}