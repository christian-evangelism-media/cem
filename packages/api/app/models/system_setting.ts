import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class SystemSetting extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'is_locked_down' })
  declare isLockedDown: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Get the singleton system settings instance
   */
  static async get(): Promise<SystemSetting> {
    const settings = await SystemSetting.first()
    if (!settings) {
      throw new Error('System settings not initialized')
    }
    return settings
  }

  /**
   * Check if system is in lock-down mode
   */
  static async isLockedDown(): Promise<boolean> {
    const settings = await SystemSetting.get()
    return settings.isLockedDown
  }

  /**
   * Activate emergency lock-down
   */
  static async activateLockDown(): Promise<void> {
    const settings = await SystemSetting.get()
    settings.isLockedDown = true
    await settings.save()
  }

  /**
   * Deactivate lock-down (must be done via database)
   */
  static async deactivateLockDown(): Promise<void> {
    const settings = await SystemSetting.get()
    settings.isLockedDown = false
    await settings.save()
  }
}