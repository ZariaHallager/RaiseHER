/**
 * The Circle: anonymous aggregate outcome reporting.
 *
 * Design constraints (from the plan):
 *   - Aggregate stats only — no free-text posts, no individual data exposed.
 *   - Minimum cohort threshold: MINIMUM_COHORT outcomes must exist before
 *     any aggregate figure is returned to the client. Below the threshold the
 *     query returns null so the UI shows a "building up" state.
 *   - raiseAmountUsd: amounts are normalized to USD at write time using
 *     approximate exchange rates. No live FX API required for MVP.
 *   - One outcome per user (upsert semantics). Users can update their report.
 *   - circleStats is updated in the same mutation as the outcome write so the
 *     two can never drift.
 */
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MINIMUM_COHORT = 10
const STAT_KEY = 'circle_v1'

/**
 * Approximate USD exchange rates for the currencies most likely to appear
 * from our four supported locales (en/es/fr/pt).
 * Rates are intentionally rough; we surface "~$X" to the user.
 * Default to 1.0 (treat as USD) for unknown currencies.
 */
const APPROX_USD_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.09,
  GBP: 1.27,
  CAD: 0.73,
  AUD: 0.65,
  BRL: 0.18,
  MXN: 0.057,
  COP: 0.00024,
  ARS: 0.0011,
  CLP: 0.001,
  PEN: 0.27,
  CHF: 1.12,
  JPY: 0.0065,
  KRW: 0.00073,
  INR: 0.012,
  SGD: 0.74,
  HKD: 0.13,
  NZD: 0.60,
  ZAR: 0.055,
}

function toUsd(amount: number, currency: string): number {
  const rate = APPROX_USD_RATES[currency.toUpperCase()] ?? 1.0
  return Math.round(amount * rate)
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function requireUser(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
  db: {
    query: (table: string) => {
      withIndex: (name: string, q: (q: unknown) => unknown) => {
        unique: () => Promise<{ _id: Id<'users'>;[key: string]: unknown } | null>
      }
    }
  }
}) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Not authenticated.')

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', identity.subject))
    .unique()

  if (!user) throw new Error('User record not found. Complete onboarding first.')
  return user as { _id: Id<'users'>;[key: string]: unknown }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns the calling user's outcome report, or null if they haven't filed one.
 */
export const getUserOutcome = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user) return null

    return await ctx.db
      .query('outcomes')
      .withIndex('by_user', (q: any) => q.eq('userId', user._id))
      .unique()
  },
})

/**
 * Returns the anonymized aggregate stats for The Circle.
 *
 * Returns null if the outcome count is below MINIMUM_COHORT so that no
 * individual can be inferred from aggregate figures.
 *
 * Shape when sufficient cohort:
 *   { totalRaisedUsd: number; outcomeCount: number; computedAt: number }
 */
export const getCircleStats = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query('circleStats')
      .withIndex('by_key', (q: any) => q.eq('statKey', STAT_KEY))
      .unique()

    if (!row) return null
    if (row.outcomeCount < MINIMUM_COHORT) return null

    return {
      totalRaisedUsd: row.totalRaisedUsd,
      outcomeCount: row.outcomeCount,
      computedAt: row.computedAt,
    }
  },
})

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Report or update the calling user's outcome.
 *
 * Upsert semantics: one row per user. If the user already has an outcome
 * the row is patched and circleStats is adjusted by the delta.
 *
 * raiseAmount + currency are optional (for outcomeType 'promotion' / 'other'
 * the raise amount may not be known).
 */
export const reportOutcome = mutation({
  args: {
    outcomeType: v.union(
      v.literal('raise'),
      v.literal('promotion'),
      v.literal('new_job'),
      v.literal('other'),
    ),
    raiseAmount: v.optional(v.number()),
    currency: v.optional(v.string()),
    rehearsalSessionId: v.optional(v.id('rehearsalSessions')),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx as any)
    const now = Date.now()

    const newAmountUsd =
      args.raiseAmount != null && args.currency
        ? toUsd(args.raiseAmount, args.currency)
        : 0

    // -- Upsert outcome row --------------------------------------------------
    const existing = await ctx.db
      .query('outcomes')
      .withIndex('by_user', (q: any) => q.eq('userId', user._id))
      .unique()

    const oldAmountUsd = existing?.raiseAmountUsd ?? 0

    if (existing) {
      await ctx.db.patch(existing._id, {
        outcomeType: args.outcomeType,
        raiseAmount: args.raiseAmount,
        currency: args.currency,
        raiseAmountUsd: newAmountUsd,
        rehearsalSessionId: args.rehearsalSessionId,
        recordedAt: now,
      })
    } else {
      await ctx.db.insert('outcomes', {
        userId: user._id,
        outcomeType: args.outcomeType,
        raiseAmount: args.raiseAmount,
        currency: args.currency,
        raiseAmountUsd: newAmountUsd,
        rehearsalSessionId: args.rehearsalSessionId,
        recordedAt: now,
      })
    }

    // -- Update circleStats (same transaction — can never drift) -------------
    const statsRow = await ctx.db
      .query('circleStats')
      .withIndex('by_key', (q: any) => q.eq('statKey', STAT_KEY))
      .unique()

    const isNew = !existing

    if (statsRow) {
      await ctx.db.patch(statsRow._id, {
        totalRaisedUsd: statsRow.totalRaisedUsd - oldAmountUsd + newAmountUsd,
        outcomeCount: statsRow.outcomeCount + (isNew ? 1 : 0),
        computedAt: now,
      })
    } else {
      await ctx.db.insert('circleStats', {
        statKey: STAT_KEY,
        totalRaisedUsd: newAmountUsd,
        outcomeCount: 1,
        computedAt: now,
      })
    }

    return { success: true }
  },
})

/**
 * Delete the calling user's outcome report and adjust circleStats.
 * Used when a user wants to remove their data.
 */
export const deleteOutcome = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx as any)
    const now = Date.now()

    const existing = await ctx.db
      .query('outcomes')
      .withIndex('by_user', (q: any) => q.eq('userId', user._id))
      .unique()

    if (!existing) return { success: true }

    const oldAmountUsd = existing.raiseAmountUsd ?? 0

    await ctx.db.delete(existing._id)

    const statsRow = await ctx.db
      .query('circleStats')
      .withIndex('by_key', (q: any) => q.eq('statKey', STAT_KEY))
      .unique()

    if (statsRow) {
      await ctx.db.patch(statsRow._id, {
        totalRaisedUsd: Math.max(0, statsRow.totalRaisedUsd - oldAmountUsd),
        outcomeCount: Math.max(0, statsRow.outcomeCount - 1),
        computedAt: now,
      })
    }

    return { success: true }
  },
})
