import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Media from '#models/media'
import env from '#start/env'

export default class extends BaseSeeder {
  async run() {
    // Clear existing media to make this seeder idempotent
    await Media.query().delete()

    // Optional media items - loop through SEED_MEDIA_n_* env vars
    let mediaIndex = 1
    while (env.get(`SEED_MEDIA_${mediaIndex}_NAME`)) {
      // Parse languages and allowed quantities from JSON strings
      const languagesJson = env.get(`SEED_MEDIA_${mediaIndex}_LANGUAGES`)
      const quantitiesJson = env.get(`SEED_MEDIA_${mediaIndex}_ALLOWED_QUANTITIES`)

      await Media.create({
        name: env.get(`SEED_MEDIA_${mediaIndex}_NAME`),
        description: env.get(`SEED_MEDIA_${mediaIndex}_DESCRIPTION`),
        type: env.get(`SEED_MEDIA_${mediaIndex}_TYPE`),
        languages: languagesJson ? JSON.parse(languagesJson) : [],
        allowedQuantities: quantitiesJson ? JSON.parse(quantitiesJson) : [],
        digitalPdfUrl: env.get(`SEED_MEDIA_${mediaIndex}_DIGITAL_PDF_URL`),
        pressPdfUrl: env.get(`SEED_MEDIA_${mediaIndex}_PRESS_PDF_URL`),
        isVisible: env.get(`SEED_MEDIA_${mediaIndex}_IS_VISIBLE`) === 'true',
      })

      mediaIndex++
    }
  }
}
