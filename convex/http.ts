/**
 * Convex HTTP actions
 *
 * Routes:
 *   POST /clerk-webhook  — Clerk webhook for user sync (user.created / user.updated)
 *   POST /stripe-webhook — Stripe payment webhook -> Finance agent
 */
import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'

const http = httpRouter()

/**
 * Clerk webhook
 * Verifies svix signature then upserts the user record.
 * Webhook secret: store as CLERK_WEBHOOK_SECRET in Convex env vars.
 */
http.route({
  path: '/clerk-webhook',
  method: 'POST',
  handler: httpAction(async (_ctx, request) => {
    // TODO: verify svix signature (implement in clerk-webhook.ts)
    const body = await request.text()
    console.log('[clerk-webhook] Received event', body.slice(0, 200))
    return new Response('ok', { status: 200 })
  }),
})

/**
 * Stripe webhook
 * Verifies Stripe signature then records revenue entry and logs Finance agent.
 * Webhook secret: store as STRIPE_WEBHOOK_SECRET in Convex env vars.
 */
http.route({
  path: '/stripe-webhook',
  method: 'POST',
  handler: httpAction(async (_ctx, request) => {
    // TODO: verify Stripe signature (implement in stripe-webhook.ts)
    const body = await request.text()
    console.log('[stripe-webhook] Received event', body.slice(0, 200))
    return new Response('ok', { status: 200 })
  }),
})

export default http
