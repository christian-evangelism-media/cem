import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class MaintenanceMode extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare isActive: boolean

  @column()
  declare reason: string | null

  @column()
  declare activatedBy: number | null

  @column.dateTime()
  declare activatedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'activatedBy',
  })
  declare activator: BelongsTo<typeof User>

  static async isInMaintenance(): Promise<boolean> {
    const mode = await MaintenanceMode.query().orderBy('id', 'desc').first()
    return mode?.isActive ?? false
  }
}