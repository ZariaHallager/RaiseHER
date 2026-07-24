/**
 * Pay Gap public API: mutations and queries exposed to the Expo client.
 *
 * The actual AI generation lives in payGapAction.ts (internalAction) to avoid
 * circular type-inference between action and scheduler reference in this file.
 *
 * Builder One / Builder Two seam: after a profile is generated, the result
 * screen shows a "Quick Start" CTA that calls `createScenarioFromPayGap`,
 * which writes a minimal scenario record and returns the scenarioId so Builder
 * Two's Rehearsal tab can hydrate its intake from there.
 *
 * HANDOFF PAYLOAD (confirmed schema in schema.ts):
 *   { userId, payGapProfileId, title, context?, createdAt }
 * Builder Two: do not change this shape without confirming with Builder One.
 */
import { mutation, query } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'

/**
 * Client entry point: validates auth then schedules the AI generation action.
 * Returns immediately so the UI can show a loading state.
 */
export const requestPayGapAnalysis = mutation({
  args: {
    industry: v.string(),
    role: v.string(),
    yearsExperience: v.number(),
    location: v.string(),
    currentSalary: v.number(),
    currency: v.string(),
    targetLanguage: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Not authenticated.')
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user) {
      throw new Error('User record not found. Complete onboarding first.')
    }

    await ctx.scheduler.runAfter(0, internal.payGapAction.generatePayGapInternal, {
      userId: user._id,
      ...args,
    })

    return { queued: true }
  },
})

/**
 * Fetch the calling user's pay gap profiles, most recent first.
 */
export const getPayGapProfiles = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user) return []

    return await ctx.db
      .query('payGapProfiles')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(args.limit ?? 10)
  },
})

/**
 * Fetch a single pay gap profile by ID.
 * Returns null if the profile does not belong to the calling user.
 */
export const getPayGapProfile = query({
  args: { profileId: v.id('payGapProfiles') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const profile = await ctx.db.get(args.profileId)
    if (!profile) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user || profile.userId !== user._id) return null

    return profile
  },
})

/**
 * Builder One / Builder Two seam.
 *
 * Called from the Pay Gap result screen "Quick Start" CTA.
 * Creates a minimal scenario record linked to the pay gap profile so Builder
 * Two's Rehearsal feature can pre-populate its intake with the user's context.
 *
 * Returns { scenarioId } so the client can navigate to the Rehearsal tab and
 * pass the id as a route param if Builder Two's tab accepts it.
 *
 * Handoff payload shape (must stay in sync with schema.ts `scenarios` table):
 *   userId            — from auth
 *   payGapProfileId   — the just-generated profile
 *   title             — pre-filled from role + industry for Builder Two
 *   context           — JSON-serialised key stats passed as structured context
 *   createdAt         — Unix ms
 */
export const createScenarioFromPayGap = mutation({
  args: {
    payGapProfileId: v.id('payGapProfiles'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated.')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user) throw new Error('User record not found.')

    const profile = await ctx.db.get(args.payGapProfileId)
    if (!profile || profile.userId !== user._id) {
      throw new Error('Pay gap profile not found.')
    }

    const title = `${profile.role}, ${profile.industry}`

    // Structured context passed to Builder Two so its AI can pre-populate the
    // negotiation scenario with the user's actual numbers.
    const context = JSON.stringify({
      role: profile.role,
      industry: profile.industry,
      location: profile.location,
      yearsExperience: profile.yearsExperience,
      currentSalary: profile.currentSalary,
      benchmarkSalary: profile.benchmarkSalary,
      gapAmount: profile.gapAmount,
      gapPercentage: profile.gapPercentage,
      currency: profile.currency,
      targetLanguage: profile.targetLanguage,
    })

    const scenarioId = await ctx.db.insert('scenarios', {
      userId: user._id,
      payGapProfileId: args.payGapProfileId,
      title,
      context,
      createdAt: Date.now(),
    })

    return { scenarioId }
  },
})
