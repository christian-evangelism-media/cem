import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'addresses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('label').nullable()
      table.string('street_address').notNullable()
      table.string('street_address_2').nullable()
      table.string('city').notNullable()
      table.string('province').nullable()
      table.string('postal_code').notNullable()
      table.string('country').notNullable()
      table.boolean('is_default').defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}