import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class Address extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column()
  declare name: string

  @column()
  declare label: string | null

  @column({ columnName: 'street_address' })
  declare streetAddress: string

  @column({ columnName: 'street_address_2' })
  declare streetAddress2: string | null

  @column()
  declare city: string

  @column()
  declare province: string | null

  @column({ columnName: 'postal_code' })
  declare postalCode: string

  @column()
  declare country: string

  @column({ columnName: 'is_default' })
  declare isDefault: boolean

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}