/**
 * Internal mutations for pay gap profiles.
 * Kept in a separate module from payGap.ts to avoid circular type-inference
 * issues when internalAction and internalMutation are in the same file
 * and reference each other via `internal`.
 */
import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

export const insertProfile = internalMutation({
  args: {
    userId: v.id('users'),
    industry: v.string(),
    role: v.string(),
    yearsExperience: v.number(),
    location: v.string(),
    currentSalary: v.number(),
    currency: v.string(),
    benchmarkSalary: v.number(),
    gapAmount: v.number(),
    gapPercentage: v.number(),
    aiAnalysis: v.string(),
    targetLanguage: v.string(),
    generatedAt: v.number(),
    geminiModelUsed: v.string(),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('payGapProfiles', args)
  },
})
