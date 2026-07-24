/**
 * Users: public queries and mutations for profile management.
 *
 * Note: user records are first created by the Clerk webhook (http.ts) on
 * `user.created`. These mutations update existing records only; they do not
 * create new ones.
 */
import { internalMutation, mutation, query } from './_generated/server'
import { v } from 'convex/values'

// ---------------------------------------------------------------------------
// Internal mutations (called only by Convex functions, never exposed publicly)
// ---------------------------------------------------------------------------

/**
 * Create or update a user row from a Clerk webhook event.
 * Called by the HTTP action in http.ts on user.created / user.updated.
 * Idempotent: if the row exists it is patched; otherwise a new row is inserted.
 */
export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    const now = Date.now()

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert('users', {
        clerkId: args.clerkId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        preferredLanguage: 'en',
        isFounder: false,
        createdAt: now,
        updatedAt: now,
      })
    }
  },
})

// ---------------------------------------------------------------------------
// Helper
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
 * Returns the currently authenticated user's record, or null if not found.
 * Used by Settings to display email, preferred language, etc.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
  },
})

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Persist the user's chosen language to the `users` table so Convex AI
 * actions can read `targetLanguage` without re-sending it in every call.
 * The i18next in-process language is always the source of truth; this is
 * just a durable sync.
 */
export const updatePreferredLanguage = mutation({
  args: { language: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    await ctx.db.patch(user._id, {
      preferredLanguage: args.language,
      updatedAt: Date.now(),
    })
    return { ok: true }
  },
})

/**
 * Delete all user-owned data from every Builder One table.
 * Called from the Privacy & Data "Request Data Deletion" flow.
 * After this returns, the client should call Clerk's user.delete() to remove
 * the Clerk record and sign the session out.
 *
 * Builder Two tables (scenarios, rehearsalSessions, caseFiles, outcomes,
 * testimonialConsent) are NOT touched here; Builder Two owns their cleanup.
 */
export const deleteUserData = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const userId = user._id

    // Delete pay gap profiles
    const profiles = await ctx.db
      .query('payGapProfiles')
      .withIndex('by_user', (q: any) => q.eq('userId', userId))
      .collect()
    await Promise.all(profiles.map((p: any) => ctx.db.delete(p._id)))

    // Delete wins
    const wins = await ctx.db
      .query('wins')
      .withIndex('by_user', (q: any) => q.eq('userId', userId))
      .collect()
    await Promise.all(wins.map((w: any) => ctx.db.delete(w._id)))

    // Delete the user record last
    await ctx.db.delete(userId)

    return { ok: true }
  },
})
