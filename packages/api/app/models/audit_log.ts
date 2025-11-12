import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class AuditLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'modified_by_id' })
  declare modifiedById: number | null

  @column()
  declare action: string

  @column({ columnName: 'field_name' })
  declare fieldName: string | null

  @column({ columnName: 'old_value' })
  declare oldValue: string | null

  @column({ columnName: 'new_value' })
  declare newValue: string | null

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'modifiedById' })
  declare modifiedBy: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime
}
