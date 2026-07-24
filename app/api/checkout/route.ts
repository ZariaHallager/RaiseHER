import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

/**
 * POST /api/checkout
 *
 * Body: { product: 'season_pass' | 'teams_pilot' }
 * Returns: { url: string }
 *
 * Used by external integrations. Client-side flows use the startCheckout
 * server action in app/checkout/actions.ts instead.
 */

const PRICE_IDS: Record<string, string | undefined> = {
  season_pass: process.env.STRIPE_SEASON_PASS_PRICE_ID,
  teams_pilot: process.env.STRIPE_TEAMS_PILOT_PRICE_ID,
}

function getBaseUrl(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  const url = new URL(req.url)
  return `${url.protocol}//${url.host}`
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  let body: { product?: string }
  try {
    body = (await req.json()) as { product?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const product = body.product
  if (!product || !(product in PRICE_IDS)) {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400 })
  }

  const priceId = PRICE_IDS[product]
  if (!priceId) {
    return NextResponse.json({ error: 'Price not configured for this product' }, { status: 500 })
  }

  const stripe = new Stripe(secretKey)
  const baseUrl = getBaseUrl(req)

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      metadata: { product },
      customer_creation: 'always',
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[/api/checkout] Stripe error:', err)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
