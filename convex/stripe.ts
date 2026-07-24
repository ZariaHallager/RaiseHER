/**
 * Stripe-related Convex internal mutations.
 *
 * Called exclusively from the /stripe-webhook HTTP action.
 * Never exposed to the client.
 */
import { internalMutation, internalQuery, mutation, query } from './_generated/server'
import { v } from 'convex/values'

// ---------------------------------------------------------------------------
// Revenue recording
// ---------------------------------------------------------------------------

/**
 * Insert a revenue entry, deduplicating by externalId so webhook retries
 * are idempotent.
 */
export const recordRevenue = internalMutation({
  args: {
    source: v.string(),
    amountUsdCents: v.number(),
    currency: v.string(),
    amountLocalCents: v.number(),
    description: v.string(),
    externalId: v.optional(v.string()),
    userId: v.optional(v.id('users')),
    recordedAt: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.externalId) {
      const all = await ctx.db.query('revenueEntries').collect()
      const existing = all.find((r) => r.externalId === args.externalId)
      if (existing) return existing._id
    }
    return await ctx.db.insert('revenueEntries', args)
  },
})

// ---------------------------------------------------------------------------
// Expense recording
// ---------------------------------------------------------------------------

/**
 * Internal: insert an expense entry (called by agents).
 */
export const recordExpenseInternal = internalMutation({
  args: {
    category: v.string(),
    amountUsdCents: v.number(),
    description: v.string(),
    vendor: v.optional(v.string()),
    invoiceUrl: v.optional(v.string()),
    recordedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('expenseEntries', args)
  },
})

/**
 * Public: founders can log expenses manually from the Agent Ops Dashboard.
 * Auth check is enforced via `isFounder` on the users table.
 */
export const addExpenseEntry = mutation({
  args: {
    category: v.string(),
    amountUsdCents: v.number(),
    description: v.string(),
    vendor: v.optional(v.string()),
    invoiceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user?.isFounder) throw new Error('Forbidden: founders only')

    return await ctx.db.insert('expenseEntries', {
      ...args,
      recordedAt: Date.now(),
    })
  },
})

// ---------------------------------------------------------------------------
// Running ledger queries (used by Finance agent and Dashboard)
// ---------------------------------------------------------------------------

/**
 * Returns the running P&L totals and recent entries in the submission-template
 * export shape. Callable by founders from the client.
 */
export const getLedger = query({
  args: {},
  handler: async (ctx) => {
    const [allRevenue, allExpenses] = await Promise.all([
      ctx.db.query('revenueEntries').withIndex('by_recorded_at').order('desc').collect(),
      ctx.db.query('expenseEntries').withIndex('by_recorded_at').order('desc').collect(),
    ])

    const totalRevenueCents = allRevenue.reduce((s, r) => s + r.amountUsdCents, 0)
    const totalExpenseCents = allExpenses.reduce((s, e) => s + e.amountUsdCents, 0)
    const netCents = totalRevenueCents - totalExpenseCents

    const revenueBySource: Record<string, number> = {}
    for (const r of allRevenue) {
      revenueBySource[r.source] = (revenueBySource[r.source] ?? 0) + r.amountUsdCents
    }

    const expenseByCategory: Record<string, number> = {}
    for (const e of allExpenses) {
      expenseByCategory[e.category] = (expenseByCategory[e.category] ?? 0) + e.amountUsdCents
    }

    return {
      generatedAt: Date.now(),
      totalRevenueCents,
      totalExpenseCents,
      netCents,
      totalRevenueUsd: totalRevenueCents / 100,
      totalExpensesUsd: totalExpenseCents / 100,
      netUsd: netCents / 100,
      revenueBySource,
      expenseByCategory,
      recentRevenue: allRevenue.slice(0, 20).map((r) => ({
        id: r._id,
        source: r.source,
        amountUsdCents: r.amountUsdCents,
        currency: r.currency,
        description: r.description,
        externalId: r.externalId,
        recordedAt: r.recordedAt,
      })),
      recentExpenses: allExpenses.slice(0, 20).map((e) => ({
        id: e._id,
        category: e.category,
        amountUsdCents: e.amountUsdCents,
        description: e.description,
        vendor: e.vendor,
        recordedAt: e.recordedAt,
      })),
    }
  },
})

/**
 * Internal version for the Finance agent (no auth needed).
 */
export const getLedgerInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const [allRevenue, allExpenses] = await Promise.all([
      ctx.db.query('revenueEntries').collect(),
      ctx.db.query('expenseEntries').collect(),
    ])
    return { allRevenue, allExpenses }
  },
})
