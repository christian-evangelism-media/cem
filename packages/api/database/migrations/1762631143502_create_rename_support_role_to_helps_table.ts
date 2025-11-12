import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Rename existing 'support' role users to 'help'
    this.defer(async (db) => {
      await db.from('users').where('role', 'support').update({ role: 'help' })
    })
  }

  async down() {
    // Revert 'help' back to 'support'
    this.defer(async (db) => {
      await db.from('users').where('role', 'help').update({ role: 'support' })
    })
  }
}
