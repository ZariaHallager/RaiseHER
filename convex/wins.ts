/**
 * Wins Ledger: public queries and mutations.
 *
 * The AI rewrite action lives in winsAction.ts to keep this file
 * free of scheduler/action imports and avoid circular type-inference.
 */
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

// ---------------------------------------------------------------------------
// Helper: resolve the Convex user from the Clerk identity
// ---------------------------------------------------------------------------
async function requireUser(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> }; db: any }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Not authenticated.')

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', identity.subject))
    .unique()

  if (!user) throw new Error('User record not found. Complete onboarding first.')
  return user
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Return the calling user's wins, sorted by date descending.
 * `limit` defaults to 200 which is well above expected MVP volume.
 */
export const listWins = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user) return []

    return await ctx.db
      .query('wins')
      .withIndex('by_user_date', (q: any) => q.eq('userId', user._id))
      .order('desc')
      .take(args.limit ?? 200)
  },
})

/**
 * Return a single win. Returns null if it does not belong to the caller.
 */
export const getWin = query({
  args: { winId: v.id('wins') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const win = await ctx.db.get(args.winId)
    if (!win) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q: any) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user || win.userId !== user._id) return null
    return win
  },
})

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const addWin = mutation({
  args: {
    description: v.string(),
    impact: v.optional(v.string()),
    estimatedValue: v.optional(v.number()),
    currency: v.optional(v.string()),
    date: v.number(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx as any)
    const now = Date.now()

    const winId = await ctx.db.insert('wins', {
      userId: user._id,
      description: args.description,
      impact: args.impact,
      estimatedValue: args.estimatedValue,
      currency: args.currency,
      date: args.date,
      tags: args.tags,
      createdAt: now,
      updatedAt: now,
    })

    return { winId }
  },
})

export const updateWin = mutation({
  args: {
    winId: v.id('wins'),
    description: v.string(),
    impact: v.optional(v.string()),
    estimatedValue: v.optional(v.number()),
    currency: v.optional(v.string()),
    date: v.number(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx as any)

    const win = await ctx.db.get(args.winId)
    if (!win || win.userId !== user._id) {
      throw new Error('Win not found.')
    }

    await ctx.db.patch(args.winId, {
      description: args.description,
      impact: args.impact,
      estimatedValue: args.estimatedValue,
      currency: args.currency,
      date: args.date,
      tags: args.tags,
      updatedAt: Date.now(),
    })

    return { winId: args.winId }
  },
})

export const deleteWin = mutation({
  args: { winId: v.id('wins') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx as any)

    const win = await ctx.db.get(args.winId)
    if (!win || win.userId !== user._id) {
      throw new Error('Win not found.')
    }

    await ctx.db.delete(args.winId)
    return { deleted: true }
  },
})
