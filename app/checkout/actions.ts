'use server'

import { redirect } from 'next/navigation'
import Stripe from 'stripe'

type Product = 'season_pass' | 'teams_pilot'

const PRICE_IDS: Record<Product, string | undefined> = {
  season_pass: process.env.STRIPE_SEASON_PASS_PRICE_ID,
  teams_pilot: process.env.STRIPE_TEAMS_PILOT_PRICE_ID,
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

/**
 * Server action: creates a Stripe Checkout session and redirects to the
 * Stripe-hosted payment page.
 *
 * Returns an error string if something goes wrong (no redirect happens).
 */
export async function startCheckout(product: Product): Promise<{ error?: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return { error: 'Checkout is not configured. Please try again later.' }
  }

  const priceId = PRICE_IDS[product]
  if (!priceId) {
    return { error: 'The selected plan is not available yet. Please contact support.' }
  }

  const stripe = new Stripe(secretKey)
  const baseUrl = getBaseUrl()

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      metadata: { product },
      customer_creation: 'always',
    })
  } catch (err) {
    console.error('[startCheckout] Stripe error:', err)
    return { error: 'Unable to create checkout session. Please try again.' }
  }

  if (!session.url) {
    return { error: 'No checkout URL returned from Stripe.' }
  }

  redirect(session.url)
}

/**
 * Create a checkout session and return the URL.
 * Used by the server-side auto-redirect in page.tsx when ?product= is set.
 */
export async function createCheckoutUrl(product: Product): Promise<string | null> {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return null

  const priceId = PRICE_IDS[product]
  if (!priceId) return null

  const stripe = new Stripe(secretKey)
  const baseUrl = getBaseUrl()

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      metadata: { product },
      customer_creation: 'always',
    })
    return session.url
  } catch {
    return null
  }
}
