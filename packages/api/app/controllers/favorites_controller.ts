import type { HttpContext } from '@adonisjs/core/http'
import Favorite from '#models/favorite'
import vine from '@vinejs/vine'

export default class FavoritesController {
  // Get current user's favorites
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const favorites = await Favorite.query()
      .where('user_id', user.id)
      .preload('media')
      .orderBy('created_at', 'desc')

    return response.json({ favorites })
  }

  // Add item to favorites (toggle)
  async store({ auth, request, response }: HttpContext) {
    const user = auth.user!

    const schema = vine.compile(
      vine.object({
        mediaId: vine.number(),
      })
    )

    const data = await request.validateUsing(schema)

    // Check if item already exists in favorites
    const existingFavorite = await Favorite.query()
      .where('user_id', user.id)
      .where('media_id', data.mediaId)
      .first()

    if (existingFavorite) {
      // Remove from favorites (toggle off)
      await existingFavorite.delete()
      return response.json({ message: 'Removed from favorites', isFavorited: false })
    }

    // Add to favorites
    const favorite = await Favorite.create({
      userId: user.id,
      mediaId: data.mediaId,
    })

    await favorite.load('media')
    return response.json({ favorite, isFavorited: true })
  }

  // Remove item from favorites
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user!

    const favorite = await Favorite.query()
      .where('media_id', params.id)
      .where('user_id', user.id)
      .firstOrFail()

    await favorite.delete()

    return response.json({ message: 'Removed from favorites' })
  }
}
