/**
 * Platform Stats Aggregation
 *
 * Runs hourly. Recomputes aggregatePlatformStats from live data.
 */
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'

export const aggregate = internalAction({
  handler: async (ctx) => {
    const startedAt = Date.now()
    try {
      // TODO: query users, wins, payGapProfiles to compute aggregates

      await ctx.runMutation(internal.agentActivityLog.logActivity, {
        agentName: 'platform-stats',
        action: 'aggregate',
        summary: 'Platform stats aggregation ran.',
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
