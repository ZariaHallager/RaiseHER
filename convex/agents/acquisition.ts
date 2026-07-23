/**
 * Customer Acquisition & Outreach Agent
 *
 * Runs weekly. Drafts outreach sequences and prospecting content via Gemini.
 * Real email/LinkedIn sends require API keys set in Convex env vars.
 */
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'

export const run = internalAction({
  handler: async (ctx) => {
    const startedAt = Date.now()
    try {
      // TODO: call Gemini to draft outreach sequences

      await ctx.runMutation(internal.agentActivityLog.logActivity, {
        agentName: 'acquisition',
        action: 'draft_outreach',
        summary: 'Acquisition agent ran — outreach draft pending Gemini integration.',
        success: true,
        durationMs: Date.now() - startedAt,
        timestamp: Date.now(),
      })
    } catch (error) {
      await ctx.runMutation(internal.agentActivityLog.logActivity, {
        agentName: 'acquisition',
        action: 'draft_outreach',
        summary: 'Acquisition agent encountered an error.',
        success: false,
        errorMessage: String(error),
        durationMs: Date.now() - startedAt,
        timestamp: Date.now(),
      })
    }
  },
})
