import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'media'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('pdf_url', 'digital_pdf_url')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.string('press_pdf_url').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('press_pdf_url')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('digital_pdf_url', 'pdf_url')
    })
  }
}