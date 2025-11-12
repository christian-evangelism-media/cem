import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import Address from './address.js'
import Favorite from './favorite.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export type UserRole = 'super_admin' | 'admin' | 'support' | 'help' | 'user'

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'first_name' })
  declare firstName: string

  @column({ columnName: 'last_name' })
  declare lastName: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: UserRole

  @column({ columnName: 'is_blocked' })
  declare isBlocked: boolean

  @column.dateTime({ columnName: 'email_verified_at' })
  declare emailVerifiedAt: DateTime | null

  @column({
    columnName: 'preferred_languages',
    prepare: (value: string[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | string[] | null) => {
      if (!value) return null
      if (typeof value === 'string') {
        return JSON.parse(value)
      }
      return value
    },
  })
  declare preferredLanguages: string[] | null

  @column()
  declare notes: string | null

  @hasMany(() => Address)
  declare addresses: HasMany<typeof Address>

  @hasMany(() => Favorite)
  declare favorites: HasMany<typeof Favorite>

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime | null
}