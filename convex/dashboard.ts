/**
 * Agent Ops Dashboard: founder-specific queries and mutations.
 *
 * Covers:
 *   - P&L summary in the submission-template export shape
 *   - Submission contacts (consented customer evidence)
 *   - Add submission contact mutation
 *   - Agent trend data (last 7 days, per-agent per-day counts)
 */
import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

// ---------------------------------------------------------------------------
// P&L Summary
// ---------------------------------------------------------------------------

/**
 * Returns the full P&L snapshot in the submission-template shape.
 * The Finance agent uses this shape; the dashboard exports it verbatim.
 */
export const getPnlSummary = query({
  args: {},
  handler: async (ctx) => {
    const [allRevenue, allExpenses] = await Promise.all([
      ctx.db.query('revenueEntries').collect(),
      ctx.db.query('expenseEntries').collect(),
    ])

    const totalRevenueCents = allRevenue.reduce((s, r) => s + r.amountUsdCents, 0)
    const totalExpenseCents = allExpenses.reduce((s, e) => s + e.amountUsdCents, 0)
    const netCents = totalRevenueCents - totalExpenseCents

    // Revenue breakdown by source
    const revenueBySource: Record<string, number> = {}
    for (const r of allRevenue) {
      revenueBySource[r.source] = (revenueBySource[r.source] ?? 0) + r.amountUsdCents
    }

    // Expense breakdown by category
    const expenseByCategory: Record<string, number> = {}
    for (const e of allExpenses) {
      expenseByCategory[e.category] = (expenseByCategory[e.category] ?? 0) + e.amountUsdCents
    }

    // Monthly breakdown (last 6 calendar months)
    const now = Date.now()
    const monthlyData: {
      month: string // 'YYYY-MM'
      revenueCents: number
      expenseCents: number
    }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const key = `${year}-${month}`
      const start = new Date(year, d.getMonth(), 1).getTime()
      const end = new Date(year, d.getMonth() + 1, 1).getTime()
      monthlyData.push({
        month: key,
        revenueCents: allRevenue.filter((r) => r.recordedAt >= start && r.recordedAt < end).reduce((s, r) => s + r.amountUsdCents, 0),
        expenseCents: allExpenses.filter((e) => e.recordedAt >= start && e.recordedAt < end).reduce((s, e) => s + e.amountUsdCents, 0),
      })
    }

    // Recent 10 entries for each
    const recentRevenue = [...allRevenue]
      .sort((a, b) => b.recordedAt - a.recordedAt)
      .slice(0, 10)
      .map((r) => ({
        id: r._id,
        source: r.source,
        amountUsdCents: r.amountUsdCents,
        description: r.description,
        recordedAt: r.recordedAt,
      }))

    const recentExpenses = [...allExpenses]
      .sort((a, b) => b.recordedAt - a.recordedAt)
      .slice(0, 10)
      .map((e) => ({
        id: e._id,
        category: e.category,
        amountUsdCents: e.amountUsdCents,
        description: e.description,
        recordedAt: e.recordedAt,
      }))

    // Submission-template export shape
    return {
      generatedAt: now,
      totalRevenueCents,
      totalExpenseCents,
      netCents,
      totalRevenueUsd: totalRevenueCents / 100,
      totalExpensesUsd: totalExpenseCents / 100,
      netUsd: netCents / 100,
      revenueBySource,
      expenseByCategory,
      monthlyBreakdown: monthlyData,
      recentRevenue,
      recentExpenses,
    }
  },
})

// ---------------------------------------------------------------------------
// Agent trend: per-agent counts in the last 7 days
// ---------------------------------------------------------------------------

export const getAgentTrends = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

    const logs = await ctx.db
      .query('agentActivityLog')
      .withIndex('by_timestamp')
      .order('desc')
      .filter((q) => q.gte(q.field('timestamp'), sevenDaysAgo))
      .collect()

    // Per-agent counts (7-day window)
    const perAgent: Record<
      string,
      { total: number; success: number; failed: number; avgDurationMs: number; lastAction: string; lastTimestamp: number }
    > = {}
    for (const log of logs) {
      if (!perAgent[log.agentName]) {
        perAgent[log.agentName] = {
          total: 0,
          success: 0,
          failed: 0,
          avgDurationMs: 0,
          lastAction: '',
          lastTimestamp: 0,
        }
      }
      const entry = perAgent[log.agentName]
      entry.total++
      if (log.success) entry.success++; else entry.failed++
      if (log.durationMs) entry.avgDurationMs = (entry.avgDurationMs * (entry.total - 1) + log.durationMs) / entry.total
      if (log.timestamp > entry.lastTimestamp) {
        entry.lastTimestamp = log.timestamp
        entry.lastAction = log.action
      }
    }

    // Daily breakdown (last 7 days), date key = 'YYYY-MM-DD'
    const dailyBreakdown: Record<string, Record<string, number>> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      dailyBreakdown[key] = {}
    }
    for (const log of logs) {
      const d = new Date(log.timestamp)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (key in dailyBreakdown) {
        dailyBreakdown[key][log.agentName] = (dailyBreakdown[key][log.agentName] ?? 0) + 1
      }
    }

    return { perAgent, dailyBreakdown }
  },
})

// ---------------------------------------------------------------------------
// Submission Contacts (consented customer evidence)
// ---------------------------------------------------------------------------

export const listSubmissionContacts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('submissionContacts').order('desc').collect()
  },
})

/**
 * Capture a consented customer contact with explicit consent text.
 * The `consentText` field stores the exact copy shown to the user.
 */
export const addSubmissionContact = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    consentText: v.string(),
    testimonialDraft: v.optional(v.string()),
    useCase: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    let userId: any = undefined
    if (identity) {
      const user = await ctx.db
        .query('users')
        .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
        .unique()
      if (user) userId = user._id
    }

    const existing = await ctx.db
      .query('submissionContacts')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique()

    if (existing) {
      // Update testimonial draft and use case if re-submitted
      await ctx.db.patch(existing._id, {
        testimonialDraft: args.testimonialDraft ?? existing.testimonialDraft,
        useCase: args.useCase ?? existing.useCase,
      })
      return existing._id
    }

    return await ctx.db.insert('submissionContacts', {
      userId,
      fullName: args.fullName,
      email: args.email,
      phone: args.phone,
      consentGrantedAt: Date.now(),
      consentText: args.consentText,
      testimonialDraft: args.testimonialDraft,
      useCase: args.useCase,
      createdAt: Date.now(),
    })
  },
})
