import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Order from './order.js'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'order_id' })
  declare orderId: number | null

  @column()
  declare type: 'contact' | 'announcement' | 'order_feedback'

  @column({ columnName: 'is_broadcast' })
  declare isBroadcast: boolean

  @column()
  declare subject: string

  @column()
  declare body: string

  @column({ columnName: 'is_read' })
  declare isRead: boolean

  @column({ columnName: 'responded_by_id' })
  declare respondedById: number | null

  @column({ columnName: 'response_body' })
  declare responseBody: string | null

  @column.dateTime({ columnName: 'responded_at' })
  declare respondedAt: DateTime | null

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'respondedById' })
  declare respondedBy: BelongsTo<typeof User>

  @belongsTo(() => Order, { foreignKey: 'orderId' })
  declare order: BelongsTo<typeof Order>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
