import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Address from './address.js'
import OrderItem from './order_item.js'
import OrderStatusChange from './order_status_change.js'
import Message from './message.js'

export type OrderStatus = 'pending' | 'processing' | 'packing' | 'ready' | 'shipping' | 'shipped' | 'awaiting' | 'collected' | 'cancelling' | 'cancelled'
export type DeliveryMethod = 'shipping' | 'pickup'

export default class Order extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'address_id' })
  declare addressId: number | null

  @column()
  declare status: OrderStatus

  @column({ columnName: 'delivery_method' })
  declare deliveryMethod: DeliveryMethod

  @column({ columnName: 'tracking_number' })
  declare trackingNumber: string | null

  @column()
  declare notes: string | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Address)
  declare address: BelongsTo<typeof Address>

  @hasMany(() => OrderItem)
  declare items: HasMany<typeof OrderItem>

  @hasMany(() => OrderStatusChange)
  declare statusChanges: HasMany<typeof OrderStatusChange>

  @hasMany(() => Message)
  declare messages: HasMany<typeof Message>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}