/**
 * Finance & Reporting Agent
 *
 * Runs daily. Reconciles revenueEntries vs expenseEntries,
 * drafts a P&L summary via Gemini, and logs to agentActivityLog.
 * Export shape matches the submission template.
 */
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'

export const run = internalAction({
  handler: async (ctx) => {
    const startedAt = Date.now()
    try {
      // TODO: query revenue + expense, call Gemini for P&L narrative

      await ctx.runMutation(internal.agentActivityLog.logActivity, {
        agentName: 'finance',
        action: 'pl_summary',
        summary: 'Finance agent ran — P&L summary pending Gemini integration.',
        success: true,
        durationMs: Date.now() - startedAt,
        timestamp: Date.now(),
      })
    } catch (error) {
      await ctx.runMutation(internal.agentActivityLog.logActivity, {
        agentName: 'finance',
        action: 'pl_summary',
        summary: 'Finance agent encountered an error.',
        success: false,
        errorMessage: String(error),
        durationMs: Date.now() - startedAt,
        timestamp: Date.now(),
      })
    }
  },
})
