import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Media extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare type: string

  @column({
    prepare: (value: string[]) => JSON.stringify(value),
    consume: (value: string | string[]) => {
      if (typeof value === 'string') {
        return JSON.parse(value)
      }
      return value
    },
  })
  declare languages: string[]

  @column({
    columnName: 'name_i18n',
    prepare: (value: Record<string, string>) => JSON.stringify(value),
    consume: (value: string | Record<string, string> | null) => {
      if (!value) return null
      if (typeof value === 'string') {
        return JSON.parse(value)
      }
      return value
    },
  })
  declare nameI18n: Record<string, string> | null

  @column({
    columnName: 'description_i18n',
    prepare: (value: Record<string, string>) => JSON.stringify(value),
    consume: (value: string | Record<string, string> | null) => {
      if (!value) return null
      if (typeof value === 'string') {
        return JSON.parse(value)
      }
      return value
    },
  })
  declare descriptionI18n: Record<string, string> | null

  @column({
    columnName: 'type_i18n',
    prepare: (value: Record<string, string>) => JSON.stringify(value),
    consume: (value: string | Record<string, string> | null) => {
      if (!value) return null
      if (typeof value === 'string') {
        return JSON.parse(value)
      }
      return value
    },
  })
  declare typeI18n: Record<string, string> | null

  @column({
    columnName: 'allowed_quantities',
    prepare: (value: number[]) => JSON.stringify(value),
    consume: (value: string | number[]) => {
      if (typeof value === 'string') {
        return JSON.parse(value)
      }
      return value
    },
  })
  declare allowedQuantities: number[]

  @column({
    columnName: 'bundle_sizes',
    prepare: (value: number[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | number[] | null) => {
      if (!value) return null
      if (typeof value === 'string') {
        return JSON.parse(value)
      }
      return value
    },
  })
  declare bundleSizes: number[] | null

  @column({ columnName: 'digital_pdf_url' })
  declare digitalPdfUrl: string | null

  @column({ columnName: 'press_pdf_url' })
  declare pressPdfUrl: string | null

  @column({ columnName: 'is_visible' })
  declare isVisible: boolean

  @column({ columnName: 'created_by' })
  declare createdBy: number | null

  @column({ columnName: 'track_inventory' })
  declare trackInventory: boolean

  @column({
    columnName: 'inventory_stock',
    prepare: (value: Record<string, number> | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | Record<string, number> | null) => {
      if (!value) return null
      if (typeof value === 'string') {
        return JSON.parse(value)
      }
      return value
    },
  })
  declare inventoryStock: Record<string, number> | null

  @column({ columnName: 'low_stock_threshold' })
  declare lowStockThreshold: number | null

  @column({ columnName: 'times_ordered' })
  declare timesOrdered: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}