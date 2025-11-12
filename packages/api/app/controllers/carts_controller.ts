import type { HttpContext } from '@adonisjs/core/http'
import CartItem from '#models/cart_item'
import vine from '@vinejs/vine'

export default class CartsController {
  // Get current user's cart
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const cartItems = await CartItem.query()
      .where('user_id', user.id)
      .preload('media')
      .orderBy('created_at', 'desc')

    return response.json({ cartItems })
  }

  // Add item to cart or update quantity if it exists
  async store({ auth, request, response }: HttpContext) {
    const user = auth.user!

    const schema = vine.compile(
      vine.object({
        mediaId: vine.number(),
        quantity: vine.number().min(1),
      })
    )

    const data = await request.validateUsing(schema)

    // Check if item already exists in cart
    const existingItem = await CartItem.query()
      .where('user_id', user.id)
      .where('media_id', data.mediaId)
      .first()

    if (existingItem) {
      // Update quantity
      existingItem.quantity = data.quantity
      await existingItem.save()
      await existingItem.load('media')
      return response.json({ cartItem: existingItem })
    }

    // Create new cart item
    const cartItem = await CartItem.create({
      userId: user.id,
      mediaId: data.mediaId,
      quantity: data.quantity,
    })

    await cartItem.load('media')
    return response.json({ cartItem })
  }

  // Update cart item quantity
  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.user!

    const schema = vine.compile(
      vine.object({
        quantity: vine.number().min(1),
      })
    )

    const data = await request.validateUsing(schema)

    const cartItem = await CartItem.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .firstOrFail()

    cartItem.quantity = data.quantity
    await cartItem.save()
    await cartItem.load('media')

    return response.json({ cartItem })
  }

  // Remove item from cart
  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user!

    const cartItem = await CartItem.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .firstOrFail()

    await cartItem.delete()

    return response.json({ message: 'Item removed from cart' })
  }

  // Clear entire cart
  async clear({ auth, response }: HttpContext) {
    const user = auth.user!

    await CartItem.query().where('user_id', user.id).delete()

    return response.json({ message: 'Cart cleared' })
  }
}
