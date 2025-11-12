import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'media'

  async up() {
    this.schema.raw('ALTER TABLE media ALTER COLUMN languages TYPE jsonb USING languages::jsonb')
  }

  async down() {
    this.schema.raw('ALTER TABLE media ALTER COLUMN languages TYPE json USING languages::json')
  }
}