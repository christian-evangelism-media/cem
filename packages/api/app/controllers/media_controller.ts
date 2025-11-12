import type { HttpContext } from '@adonisjs/core/http'
import Media from '#models/media'

export default class MediaController {
  async index({ request, response, auth }: HttpContext) {
    const type = request.input('type')
    const languages = request.input('languages') // Can be comma-separated string or array
    const lang = request.input('lang', 'en') // UI language for translations
    const isManualFilter = request.input('isManualFilter') === 'true' // Whether user manually selected languages
    const search = request.input('search', '')
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const sortByPopularity = request.input('sortByPopularity') === 'true' // For staff viewing in ops panel

    // Check if user is authenticated and has preferred languages
    let preferredLanguages: string[] | null = null
    let isStaff = false
    try {
      await auth.check()
      preferredLanguages = auth.user?.preferredLanguages || null
      isStaff = auth.user?.role !== 'user'
    } catch (error) {
      // User not authenticated, continue without preferences
    }

    const query = Media.query()

    // Regular users only see visible media, staff see all
    if (!isStaff) {
      query.where('is_visible', true)
    }

    if (type) {
      query.where('type', type)
    }

    // Search by name (check both name and name_i18n)
    if (search) {
      query.where((builder) => {
        builder
          .whereILike('name', `%${search}%`)
          .orWhereRaw('name_i18n::text ILIKE ?', [`%${search}%`])
      })
    }

    if (languages) {
      // Handle both comma-separated string and array
      const languageArray = Array.isArray(languages)
        ? languages
        : languages.split(',').map((l: string) => l.trim())

      // Convert language names to ISO codes (for backward compatibility with filter)
      const languageMap: Record<string, string> = {
        'English': 'en', 'Spanish': 'es', 'Chinese': 'zh', 'Hindi': 'hi',
        'Arabic': 'ar', 'Bengali': 'bn', 'Portuguese': 'pt', 'Russian': 'ru',
        'French': 'fr', 'Punjabi': 'pa', 'Japanese': 'ja', 'Korean': 'ko',
        'Vietnamese': 'vi', 'Tamil': 'ta', 'Italian': 'it', 'Tagalog': 'tl',
        'Persian': 'fa', 'Romanian': 'ro', 'Greek': 'el', 'Haitian Creole': 'ht',
        'Ilocano': 'ilo', 'Fulah': 'ff', 'Urdu': 'ur', 'Hebrew': 'he',
        'German': 'de', 'Indonesian': 'id', 'Marathi': 'mr', 'Swahili': 'sw',
        'Telugu': 'te', 'Turkish': 'tr'
      }

      const langCodes = languageArray.map((lang: string) => languageMap[lang] || lang.toLowerCase())

      if (isManualFilter) {
        // Manual filter: subset check
        // Show only media where ALL languages are in the selected set
        // e.g., filtering for ["en", "es"] shows: ["en"], ["es"], ["en","es"]
        // but NOT ["en","zh"] or ["es","fr"]
        // PostgreSQL <@ operator: left jsonb array is subset of right jsonb array
        query.whereRaw('languages <@ ?::jsonb', [JSON.stringify(langCodes)])
      } else {
        // UI language default: overlap check
        // Show media containing ANY of the selected languages
        // e.g., filtering for ["en"] shows: ["en"], ["en","es"], ["en","zh"], etc.
        // Use jsonb_path_exists to check if any element matches
        query.where((subQuery) => {
          langCodes.forEach((code: string, index: number) => {
            if (index === 0) {
              subQuery.whereJsonSuperset('languages', [code])
            } else {
              subQuery.orWhereJsonSuperset('languages', [code])
            }
          })
        })
      }
    }

    // Order by:
    // 1. If sortByPopularity requested (cem-ops): popularity (times_ordered DESC)
    // 2. For users with preferences: preference match, then name
    // 3. Default: name alphabetically
    if (sortByPopularity && isStaff) {
      query.orderBy('times_ordered', 'desc').orderBy('name', 'asc')
    } else if (preferredLanguages && preferredLanguages.length > 0) {
      query.orderByRaw('(languages <@ ?::jsonb) DESC, name ASC', [JSON.stringify(preferredLanguages)])
    } else {
      query.orderBy('name', 'asc')
    }

    const media = await query.paginate(page, limit)

    // Transform media items to use translations based on lang parameter
    const translatedData = media.all().map((item) => {
      return {
        ...item.serialize(),
        name: item.nameI18n?.[lang] || item.nameI18n?.en || item.name,
        description: item.descriptionI18n?.[lang] || item.descriptionI18n?.en || item.description,
        type: item.typeI18n?.[lang] || item.typeI18n?.en || item.type,
      }
    })

    return response.json({
      meta: media.getMeta(),
      data: translatedData,
    })
  }

  async show({ params, response }: HttpContext) {
    const media = await Media.findOrFail(params.id)

    return response.json({ media })
  }

  async store({ auth, request, response }: HttpContext) {
    const data = request.only([
      'name',
      'nameI18n',
      'description',
      'descriptionI18n',
      'type',
      'typeI18n',
      'languages',
      'allowedQuantities',
      'digitalPdfUrl',
      'pressPdfUrl',
      'isVisible'
    ])

    const media = await Media.create({
      ...data,
      createdBy: auth.user!.id,
    })

    return response.created({ media })
  }

  async update({ auth, params, request, response }: HttpContext) {
    const media = await Media.findOrFail(params.id)
    const user = auth.user!

    // Permission check
    if (user.role === 'help' || user.role === 'support') {
      // Help/Support can only edit their own invisible media
      if (media.createdBy !== user.id) {
        return response.forbidden({ message: 'You can only edit media you created' })
      }
      if (media.isVisible) {
        return response.forbidden({ message: 'You cannot edit visible media' })
      }
    }

    const data = request.only([
      'name',
      'nameI18n',
      'description',
      'descriptionI18n',
      'type',
      'typeI18n',
      'languages',
      'allowedQuantities',
      'digitalPdfUrl',
      'pressPdfUrl',
      'isVisible'
    ])

    // Help/Support cannot change visibility
    if ((user.role === 'help' || user.role === 'support') && data.isVisible !== undefined) {
      delete data.isVisible
    }

    media.merge(data)
    await media.save()

    return response.json({ media })
  }

  async destroy({ auth, params, response }: HttpContext) {
    const media = await Media.findOrFail(params.id)
    const user = auth.user!

    // Permission check
    if (user.role === 'help' || user.role === 'support') {
      // Help/Support can only delete their own invisible media
      if (media.createdBy !== user.id) {
        return response.forbidden({ message: 'You can only delete media you created' })
      }
      if (media.isVisible) {
        return response.forbidden({ message: 'You cannot delete visible media' })
      }
    }

    await media.delete()

    return response.noContent()
  }
}