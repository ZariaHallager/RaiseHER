/**
 * Platform Stats Aggregation
 *
 * Runs hourly. Recomputes aggregatePlatformStats from live data.
 */
import { internalAction, internalMutation, internalQuery } from '../_generated/server'
import { internal } from '../_generated/api'
import { v } from 'convex/values'

export const aggregate = internalAction({
  handler: async (ctx) => {
    const startedAt = Date.now()
    try {
      const stats = await ctx.runQuery(internal.agents.platformStats.computeStats)

      await ctx.runMutation(internal.agents.platformStats.upsertStats, {
        statKey: 'platform_v1',
        totalUsers: stats.totalUsers,
        totalWins: stats.totalWins,
        avgGapPercentage: stats.avgGapPercentage,
        totalGapClosedUsd: stats.totalGapClosedUsd,
        computedAt: Date.now(),
      })

      await ctx.runMutation(internal.agentActivityLog.logActivity, {
        agentName: 'platform-stats',
        action: 'aggregate',
        summary: `Platform stats: ${stats.totalUsers} users, ${stats.totalWins} wins, avg gap ${stats.avgGapPercentage.toFixed(1)}%.`,
        metadata: stats,
        success: true,
        durationMs: Date.now() - startedAt,
        timestamp: Date.now(),
      })
    } catch (error) {
      await ctx.runMutation(internal.agentActivityLog.logActivity, {
        agentName: 'platform-stats',
        action: 'aggregate',
        summary: 'Platform stats aggregation encountered an error.',
        success: false,
        errorMessage: String(error),
        durationMs: Date.now() - startedAt,
        timestamp: Date.now(),
      })
    }
  },
})

export const computeStats = internalQuery({
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect()
    const wins = await ctx.db.query('wins').collect()
    const profiles = await ctx.db.query('payGapProfiles').collect()

    const totalUsers = users.length
    const totalWins = wins.length

    const avgGapPercentage =
      profiles.length > 0
        ? profiles.reduce((sum, p) => sum + p.gapPercentage, 0) / profiles.length
        : 0

    // Sum of positive gap amounts (in USD equivalent) from outcomes table as a proxy.
    // Real gap-closed tracking comes from Builder Two outcomes; use 0 until that is live.
    const totalGapClosedUsd = 0

    return { totalUsers, totalWins, avgGapPercentage, totalGapClosedUsd }
  },
})

export const upsertStats = internalMutation({
  args: {
    statKey: v.string(),
    totalUsers: v.number(),
    totalWins: v.number(),
    avgGapPercentage: v.number(),
    totalGapClosedUsd: v.number(),
    computedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('aggregatePlatformStats')
      .withIndex('by_key', (q) => q.eq('statKey', args.statKey))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, args)
    } else {
      await ctx.db.insert('aggregatePlatformStats', args)
    }
  },
})
