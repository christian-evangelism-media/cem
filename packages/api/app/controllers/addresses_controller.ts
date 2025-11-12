import type { HttpContext } from '@adonisjs/core/http'
import Address from '#models/address'
import vine from '@vinejs/vine'

export default class AddressesController {
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const addresses = await Address.query()
      .where('user_id', user.id)
      .orderBy('is_default', 'desc')
      .orderBy('created_at', 'desc')

    return response.json({ addresses })
  }

  async show({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const address = await Address.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .firstOrFail()

    return response.json({ address })
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.user!

    const schema = vine.compile(
      vine.object({
        name: vine.string().minLength(2),
        label: vine.string().optional(),
        streetAddress: vine.string(),
        streetAddress2: vine.string().optional(),
        city: vine.string(),
        province: vine.string().optional(),
        postalCode: vine.string(),
        country: vine.string().minLength(2).maxLength(2),
        isDefault: vine.boolean().optional(),
      })
    )

    const data = await request.validateUsing(schema)

    // If this address is being set as default, unset other defaults
    if (data.isDefault) {
      await Address.query().where('user_id', user.id).update({ isDefault: false })
    }

    const address = await Address.create({
      userId: user.id,
      ...data,
    })

    return response.json({ address })
  }

  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.user!

    const address = await Address.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .firstOrFail()

    const schema = vine.compile(
      vine.object({
        name: vine.string().minLength(2).optional(),
        label: vine.string().optional(),
        streetAddress: vine.string().optional(),
        streetAddress2: vine.string().optional(),
        city: vine.string().optional(),
        province: vine.string().optional(),
        postalCode: vine.string().optional(),
        country: vine.string().minLength(2).maxLength(2).optional(),
        isDefault: vine.boolean().optional(),
      })
    )

    const data = await request.validateUsing(schema)

    // If this address is being set as default, unset other defaults
    if (data.isDefault) {
      await Address.query()
        .where('user_id', user.id)
        .whereNot('id', address.id)
        .update({ isDefault: false })
    }

    address.merge(data)
    await address.save()

    return response.json({ address })
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.user!

    const address = await Address.query()
      .where('id', params.id)
      .where('user_id', user.id)
      .firstOrFail()

    await address.delete()

    return response.json({ message: 'Address deleted successfully' })
  }
}