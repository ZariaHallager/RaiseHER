/**
 * Agent Activity Log: shared mutation called by every agent.
 * The Agent Ops Dashboard reads from agentActivityLog via queries here.
 */
import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'

/**
 * Internal mutation, called by agents only (not exposed to client).
 */
export const logActivity = internalMutation({
  args: {
    agentName: v.string(),
    action: v.string(),
    summary: v.string(),
    metadata: v.optional(v.any()),
    durationMs: v.optional(v.number()),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    userId: v.optional(v.id('users')),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('agentActivityLog', args)
  },
})

/**
 * Query: recent activity feed for Agent Ops Dashboard.
 * Only accessible to founders (client must verify isFounder before calling).
 */
export const recentActivity = query({
  args: {
    agentName: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50
    if (args.agentName) {
      return await ctx.db
        .query('agentActivityLog')
        .withIndex('by_agent_timestamp', (q) => q.eq('agentName', args.agentName!))
        .order('desc')
        .take(limit)
    }
    return await ctx.db
      .query('agentActivityLog')
      .withIndex('by_timestamp')
      .order('desc')
      .take(limit)
  },
})

/**
 * Query: per-agent counts for the dashboard trend view.
 */
export const agentCounts = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query('agentActivityLog').collect()
    const counts: Record<string, { total: number; success: number; failed: number }> = {}
    for (const log of logs) {
      if (!counts[log.agentName]) {
        counts[log.agentName] = { total: 0, success: 0, failed: 0 }
      }
      counts[log.agentName].total++
      if (log.success) {
        counts[log.agentName].success++
      } else {
        counts[log.agentName].failed++
      }
    }
    return counts
  },
})
