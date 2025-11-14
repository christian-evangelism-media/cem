import env from '#start/env'
import Stripe from 'stripe'

export const stripeConfig = {
  apiKey: env.get('STRIPE_SECRET_KEY'),
  webhookSecret: env.get('STRIPE_WEBHOOK_SECRET'),
}

export const stripe = new Stripe(stripeConfig.apiKey, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
})
