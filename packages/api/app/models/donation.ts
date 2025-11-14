import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export type DonationStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export default class Donation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number | null

  @column()
  declare amount: number

  @column()
  declare currency: string

  @column({ columnName: 'stripe_session_id' })
  declare stripeSessionId: string

  @column({ columnName: 'stripe_payment_intent_id' })
  declare stripePaymentIntentId: string | null

  @column()
  declare status: DonationStatus

  @column({ columnName: 'donor_email' })
  declare donorEmail: string | null

  @column({ columnName: 'donor_name' })
  declare donorName: string | null

  @column()
  declare message: string | null

  @column()
  declare metadata: Record<string, any> | null

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}