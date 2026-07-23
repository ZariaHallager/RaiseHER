/**
 * Growth & Content Agent
 *
 * Runs daily. Uses Gemini to draft social posts, blog outlines, and
 * engagement content. Writes output to agentActivityLog.
 *
 * External posting (social APIs) requires API keys set in Convex env vars.
 * Agent runs from day one and accumulates real history.
 */
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'

export const run = internalAction({
  handler: async (ctx) => {
    const startedAt = Date.now()
    try {
      // TODO: call Gemini to draft content
      // const content = await generateContent(...)

      await ctx.runMutation(internal.agentActivityLog.logActivity, {
        agentName: 'growth',
        action: 'draft_content',
        summary: 'Growth agent ran — content draft pending Gemini integration.',
        success: true,
        durationMs: Date.now() - startedAt,
        timestamp: Date.now(),
      })
    } catch (error) {
      await ctx.runMutation(internal.agentActivityLog.logActivity, {
        agentName: 'growth',
        action: 'draft_content',
        summary: 'Growth agent encountered an error.',
        success: false,
        errorMessage: String(error),
        durationMs: Date.now() - startedAt,
        timestamp: Date.now(),
      })
    }
  },
})
