import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Media from './media.js'
import User from './user.js'
import Order from './order.js'

export default class InventoryMovement extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'media_id' })
  declare mediaId: number

  @column({ columnName: 'quantity_change' })
  declare quantityChange: number

  @column({ columnName: 'quantity_after' })
  declare quantityAfter: number

  @column()
  declare type: string

  @column()
  declare reason: string | null

  @column({ columnName: 'order_id' })
  declare orderId: number | null

  @column({ columnName: 'changed_by' })
  declare changedBy: number | null

  @belongsTo(() => Media)
  declare media: BelongsTo<typeof Media>

  @belongsTo(() => User)
  declare changedByUser: BelongsTo<typeof User>

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
