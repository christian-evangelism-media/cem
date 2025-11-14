import type { HttpContext } from '@adonisjs/core/http'
import { stripe } from '#config/stripe'
import Donation from '#models/donation'
import vine from '@vinejs/vine'
import env from '#start/env'

export default class DonationsController {
  async createCheckoutSession({ auth, request, response }: HttpContext) {
    const schema = vine.compile(
      vine.object({
        amount: vine.number().min(1),
        currency: vine.string().optional(),
        message: vine.string().optional(),
      })
    )

    const payload = await request.validateUsing(schema)
    const user = auth.user

    const amount = payload.amount
    const currency = payload.currency || 'CAD'

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: 'Donation to Christian Evangelism Media',
                description: payload.message || 'Support our mission to support evangelists worldwide',
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${env.get('FRONTEND_URL')}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.get('FRONTEND_URL')}/donate/cancel`,
        customer_email: user?.email,
        metadata: {
          userId: user?.id?.toString() || '',
          message: payload.message || '',
        },
      })

      // Create pending donation record
      await Donation.create({
        userId: user?.id || null,
        amount,
        currency,
        stripeSessionId: session.id,
        status: 'pending',
        donorEmail: user?.email || null,
        donorName: user ? `${user.firstName} ${user.lastName}` : null,
        message: payload.message || null,
        metadata: {
          sessionUrl: session.url,
        },
      })

      return response.json({ sessionId: session.id, url: session.url })
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error)
      return response.status(500).json({ error: 'Failed to create checkout session' })
    }
  }

  async handleWebhook({ request, response }: HttpContext) {
    const sig = request.header('stripe-signature')

    if (!sig) {
      return response.status(400).json({ error: 'Missing stripe-signature header' })
    }

    try {
      const event = stripe.webhooks.constructEvent(
        request.raw() as string,
        sig,
        env.get('STRIPE_WEBHOOK_SECRET')
      )

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any
          const donation = await Donation.findByOrFail('stripeSessionId', session.id)

          donation.status = 'completed'
          donation.stripePaymentIntentId = session.payment_intent as string
          donation.donorEmail = donation.donorEmail || session.customer_email
          await donation.save()
          break
        }

        case 'checkout.session.expired': {
          const session = event.data.object as any
          const donation = await Donation.findByOrFail('stripeSessionId', session.id)

          donation.status = 'failed'
          await donation.save()
          break
        }

        case 'charge.refunded': {
          const charge = event.data.object as any
          const donation = await Donation.findByOrFail(
            'stripePaymentIntentId',
            charge.payment_intent
          )

          donation.status = 'refunded'
          await donation.save()
          break
        }

        default:
          console.log(`Unhandled event type ${event.type}`)
      }

      return response.json({ received: true })
    } catch (error) {
      console.error('Webhook error:', error)
      return response.status(400).json({ error: 'Webhook handler failed' })
    }
  }

  async index({ auth, response }: HttpContext) {
    const user = auth.user!

    // Super admin and admin can see all donations
    if (user.role === 'super_admin' || user.role === 'admin') {
      const donations = await Donation.query()
        .preload('user')
        .orderBy('created_at', 'desc')

      return response.json({ donations })
    }

    // Regular users can only see their own donations
    const donations = await Donation.query()
      .where('user_id', user.id)
      .orderBy('created_at', 'desc')

    return response.json({ donations })
  }

  async show({ auth, params, response }: HttpContext) {
    const user = auth.user!
    const donation = await Donation.query()
      .where('id', params.id)
      .preload('user')
      .firstOrFail()

    // Check permissions
    if (
      user.role !== 'super_admin' &&
      user.role !== 'admin' &&
      donation.userId !== user.id
    ) {
      return response.status(403).json({ error: 'Unauthorized' })
    }

    return response.json({ donation })
  }

  async getSessionDetails({ request, response }: HttpContext) {
    const schema = vine.compile(
      vine.object({
        sessionId: vine.string(),
      })
    )

    const payload = await request.validateUsing(schema)

    try {
      const donation = await Donation.findByOrFail('stripeSessionId', payload.sessionId)
      return response.json({ donation })
    } catch (error) {
      return response.status(404).json({ error: 'Donation not found' })
    }
  }
}
