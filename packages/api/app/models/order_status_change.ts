import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from './order.js'
import User from './user.js'

export default class OrderStatusChange extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'order_id' })
  declare orderId: number

  @column()
  declare status: string

  @column({ columnName: 'changed_by' })
  declare changedBy: number | null

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => User, { foreignKey: 'changedBy' })
  declare changedByUser: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}