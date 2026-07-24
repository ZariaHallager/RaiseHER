/**
 * Convex HTTP actions
 *
 * Routes:
 *   POST /clerk-webhook  — Clerk user sync (user.created / user.updated)
 *   POST /stripe-webhook — Stripe payment events -> Finance agent
 *
 * Environment variables (set in Convex dashboard):
 *   CLERK_WEBHOOK_SECRET   — svix signing secret from Clerk dashboard
 *   STRIPE_WEBHOOK_SECRET  — whsec_... from Stripe dashboard
 */
import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'

const http = httpRouter()

// ---------------------------------------------------------------------------
// Clerk webhook
// ---------------------------------------------------------------------------

/**
 * Verifies a Svix webhook signature using Web Crypto API (no Node.js required).
 *
 * Svix algorithm:
 *   1. secret = base64Decode(CLERK_WEBHOOK_SECRET.replace("whsec_", ""))
 *   2. signed  = "{svix-id}.{svix-timestamp}.{rawBody}"
 *   3. digest  = HMAC-SHA256(secret, signed)  →  base64Encode(digest)
 *   4. compare against each "v1,{sig}" entry in svix-signature (space-sep.)
 *
 * Also rejects requests with a timestamp more than 5 minutes old.
 */
async function verifySvixSignature(
  rawBody: string,
  msgId: string,
  timestamp: string,
  sigHeader: string,
  secret: string
): Promise<void> {
  // Reject stale webhooks (5 minute tolerance)
  const ts = parseInt(timestamp, 10)
  if (isNaN(ts)) throw new Error('Invalid svix-timestamp')
  const nowSecs = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSecs - ts) > 300) throw new Error('Svix timestamp out of tolerance window')

  // Decode the base64 secret (strip "whsec_" prefix)
  const base64Secret = secret.startsWith('whsec_') ? secret.slice(6) : secret
  const secretBytes = Uint8Array.from(atob(base64Secret), (c) => c.charCodeAt(0))

  const signedContent = `${msgId}.${timestamp}.${rawBody}`
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const digestBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signedContent)
  )
  const digest = btoa(String.fromCharCode(...new Uint8Array(digestBytes)))

  // svix-signature is space-separated "v1,<base64>" tokens
  const isValid = sigHeader
    .split(' ')
    .filter((s) => s.startsWith('v1,'))
    .some((s) => timingSafeEqual(s.slice(3), digest))

  if (!isValid) throw new Error('Svix signature verification failed')
}

/** Clerk webhook payload shapes we care about. */
interface ClerkEmailAddress {
  email_address: string
  id: string
}

interface ClerkUserEventData {
  id: string
  first_name: string | null
  last_name: string | null
  email_addresses: ClerkEmailAddress[]
  primary_email_address_id: string | null
}

interface ClerkWebhookEvent {
  type: string
  data: ClerkUserEventData | Record<string, unknown>
}

http.route({
  path: '/clerk-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const rawBody = await request.text()

    // --- Signature verification ---
    const secret = process.env.CLERK_WEBHOOK_SECRET
    if (!secret) {
      console.error('[clerk-webhook] CLERK_WEBHOOK_SECRET is not set')
      return new Response('Webhook secret not configured', { status: 500 })
    }

    const msgId = request.headers.get('svix-id')
    const timestamp = request.headers.get('svix-timestamp')
    const sigHeader = request.headers.get('svix-signature')

    if (!msgId || !timestamp || !sigHeader) {
      return new Response('Missing Svix headers', { status: 400 })
    }

    try {
      await verifySvixSignature(rawBody, msgId, timestamp, sigHeader, secret)
    } catch (err) {
      console.error('[clerk-webhook] Signature verification failed:', err)
      return new Response('Signature verification failed', { status: 400 })
    }

    // --- Parse event ---
    let event: ClerkWebhookEvent
    try {
      event = JSON.parse(rawBody) as ClerkWebhookEvent
    } catch {
      return new Response('Invalid JSON body', { status: 400 })
    }

    console.log('[clerk-webhook] Verified event:', event.type)

    // --- Handle user sync events ---
    if (event.type === 'user.created' || event.type === 'user.updated') {
      const data = event.data as ClerkUserEventData

      const primaryEmail = data.email_addresses?.find(
        (e) => e.id === data.primary_email_address_id
      )

      await ctx.runMutation(internal.users.upsertFromClerk, {
        clerkId: data.id,
        email: primaryEmail?.email_address,
        firstName: data.first_name ?? undefined,
        lastName: data.last_name ?? undefined,
      })

      console.log('[clerk-webhook] User upserted:', data.id)
    }

    return new Response('ok', { status: 200 })
  }),
})

// ---------------------------------------------------------------------------
// Stripe webhook
// ---------------------------------------------------------------------------

/**
 * Verifies the Stripe-Signature header using HMAC-SHA256 (Web Crypto API).
 * Throws if the signature is invalid or the timestamp is stale.
 */
async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
  toleranceSeconds = 300
): Promise<void> {
  // Parse "t=...,v1=...,v0=..." header
  const parts: Record<string, string[]> = {}
  for (const part of sigHeader.split(',')) {
    const eqIdx = part.indexOf('=')
    if (eqIdx === -1) continue
    const k = part.slice(0, eqIdx).trim()
    const v = part.slice(eqIdx + 1).trim()
      ; (parts[k] ??= []).push(v)
  }

  const timestamp = parseInt(parts['t']?.[0] ?? '0', 10)
  const v1Signatures = parts['v1'] ?? []

  if (!timestamp || v1Signatures.length === 0) {
    throw new Error('Invalid Stripe-Signature header')
  }

  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    throw new Error('Stripe webhook timestamp out of tolerance window')
  }

  const signedPayload = `${timestamp}.${payload}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
  const expectedSig = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const isValid = v1Signatures.some((sig) => timingSafeEqual(sig, expectedSig))
  if (!isValid) {
    throw new Error('Stripe signature verification failed')
  }
}

/** Constant-time string comparison to prevent timing attacks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/** Minimal Stripe event shapes we care about. */
interface StripeCheckoutSession {
  id: string
  object: 'checkout.session'
  amount_total: number | null
  currency: string
  payment_status: string
  status: string
  payment_intent: string | null
  customer_email: string | null
  metadata: Record<string, string>
}

interface StripeEvent {
  id: string
  type: string
  data: {
    object: StripeCheckoutSession | Record<string, unknown>
  }
}

http.route({
  path: '/stripe-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const body = await request.text()
    const sigHeader = request.headers.get('stripe-signature')

    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) {
      console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set')
      return new Response('Webhook secret not configured', { status: 500 })
    }

    if (!sigHeader) {
      return new Response('Missing stripe-signature header', { status: 400 })
    }

    try {
      await verifyStripeSignature(body, sigHeader, secret)
    } catch (err) {
      console.error('[stripe-webhook] Signature verification failed:', err)
      return new Response('Signature verification failed', { status: 400 })
    }

    let event: StripeEvent
    try {
      event = JSON.parse(body) as StripeEvent
    } catch {
      return new Response('Invalid JSON body', { status: 400 })
    }

    console.log('[stripe-webhook] Verified event:', event.type, event.id)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as StripeCheckoutSession

        if (session.payment_status !== 'paid' || session.status !== 'complete') {
          console.log('[stripe-webhook] Session not fully paid, skipping:', session.id)
          break
        }

        const amountCents = session.amount_total ?? 0
        const currency = session.currency.toUpperCase()
        const product = session.metadata?.product ?? 'unknown'
        const description = productLabel(product)

        // Record the revenue entry (idempotent via externalId)
        await ctx.runMutation(internal.stripe.recordRevenue, {
          source: 'stripe',
          amountUsdCents: currency === 'USD' ? amountCents : 0,
          currency,
          amountLocalCents: amountCents,
          description,
          externalId: session.id,
          recordedAt: Date.now(),
        })

        // Log the Finance agent activity
        await ctx.runMutation(internal.agentActivityLog.logActivity, {
          agentName: 'finance',
          action: 'stripe_revenue_recorded',
          summary: `Stripe payment received: ${description} — ${formatMoney(amountCents, currency)}.`,
          metadata: {
            sessionId: session.id,
            paymentIntent: session.payment_intent,
            product,
            amountCents,
            currency,
            customerEmail: session.customer_email,
          },
          success: true,
          timestamp: Date.now(),
        })

        console.log(
          `[stripe-webhook] Recorded revenue: ${description} ${formatMoney(amountCents, currency)}`
        )
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Record<string, unknown>
        console.warn('[stripe-webhook] Payment failed:', pi['id'])

        await ctx.runMutation(internal.agentActivityLog.logActivity, {
          agentName: 'finance',
          action: 'stripe_payment_failed',
          summary: `Stripe payment failed for intent ${pi['id']}.`,
          metadata: { paymentIntentId: pi['id'], eventId: event.id },
          success: false,
          errorMessage: String(pi['last_payment_error'] ?? 'Unknown reason'),
          timestamp: Date.now(),
        })
        break
      }

      default:
        console.log('[stripe-webhook] Unhandled event type:', event.type)
    }

    return new Response('ok', { status: 200 })
  }),
})

function productLabel(product: string): string {
  switch (product) {
    case 'teams_pilot':
      return 'RaiseHER Teams Pilot'
    case 'season_pass':
      return 'RaiseHER Season Pass'
    default:
      return `RaiseHER - ${product}`
  }
}

function formatMoney(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency}`
}

export default http
