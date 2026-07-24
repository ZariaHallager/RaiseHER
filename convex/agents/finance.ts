/**
 * Finance & Reporting Agent
 *
 * Runs daily. Reconciles revenueEntries vs expenseEntries,
 * drafts a P&L summary via Gemini, and logs to agentActivityLog.
 * Export shape matches the submission template.
 */
import { internalAction, internalQuery } from '../_generated/server'
import { internal } from '../_generated/api'
import { generateNativeContent } from '../lib/gemini'

export const run = internalAction({
  handler: async (ctx) => {
    const startedAt = Date.now()
    try {
      const { totalRevenueCents, totalExpenseCents, recentRevenue, recentExpenses } =
        await ctx.runQuery(internal.agents.finance.fetchLedgerData)

      const netCents = totalRevenueCents - totalExpenseCents
      const revenueUsd = (totalRevenueCents / 100).toFixed(2)
      const expenseUsd = (totalExpenseCents / 100).toFixed(2)
      const netUsd = (netCents / 100).toFixed(2)

      const prompt = buildFinancePrompt(revenueUsd, expenseUsd, netUsd, recentRevenue, recentExpenses)
      const result = await generateNativeContent(prompt, 'en')

      await ctx.runMutation(internal.agentActivityLog.logActivity, {
        agentName: 'finance',
        action: 'pl_summary',
        summary: `Finance agent: Revenue $${revenueUsd} | Expenses $${expenseUsd} | Net $${netUsd}.`,
        metadata: {
          totalRevenueCents,
          totalExpenseCents,
          netCents,
          draft: result.text.slice(0, 500),
          modelUsed: result.modelUsed,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
        },
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

export const fetchLedgerData = internalQuery({
  handler: async (ctx) => {
    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

    const allRevenue = await ctx.db.query('revenueEntries').collect()
    const allExpenses = await ctx.db.query('expenseEntries').collect()

    const totalRevenueCents = allRevenue.reduce((sum, r) => sum + r.amountUsdCents, 0)
    const totalExpenseCents = allExpenses.reduce((sum, e) => sum + e.amountUsdCents, 0)

    const recentRevenue = allRevenue
      .filter((r) => r.recordedAt >= thirtyDaysAgo)
      .map((r) => ({ source: r.source, amountUsdCents: r.amountUsdCents, description: r.description }))

    const recentExpenses = allExpenses
      .filter((e) => e.recordedAt >= thirtyDaysAgo)
      .map((e) => ({ category: e.category, amountUsdCents: e.amountUsdCents, description: e.description }))

    return { totalRevenueCents, totalExpenseCents, recentRevenue, recentExpenses }
  },
})

function buildFinancePrompt(
  revenueUsd: string,
  expenseUsd: string,
  netUsd: string,
  recentRevenue: { source: string; amountUsdCents: number; description: string }[],
  recentExpenses: { category: string; amountUsdCents: number; description: string }[]
): string {
  const revenueLines =
    recentRevenue.length > 0
      ? recentRevenue.map((r) => `  - ${r.source}: $${(r.amountUsdCents / 100).toFixed(2)} — ${r.description}`).join('\n')
      : '  - None recorded in the last 30 days.'

  const expenseLines =
    recentExpenses.length > 0
      ? recentExpenses.map((e) => `  - ${e.category}: $${(e.amountUsdCents / 100).toFixed(2)} — ${e.description}`).join('\n')
      : '  - None recorded in the last 30 days.'

  return `
You are the Finance Agent for RaiseHER, a platform helping women close the pay gap.

Prepare a concise daily P&L summary for the founding team:

TOTAL REVENUE (all time): $${revenueUsd}
TOTAL EXPENSES (all time): $${expenseUsd}
NET (all time): $${netUsd}

RECENT REVENUE (last 30 days):
${revenueLines}

RECENT EXPENSES (last 30 days):
${expenseLines}

Write a 3–5 sentence narrative summary covering:
1. Current financial health and runway context
2. Revenue trends or notable entries
3. One recommendation to improve the P&L

Be direct and factual. No fluff. This is an internal operations document.
`.trim()
}
