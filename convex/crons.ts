/**
 * Convex scheduled functions (crons)
 *
 * Business-operating agents (all write to agentActivityLog):
 *   - Growth & Content       — daily 08:00 UTC
 *   - Customer Support        — every 4 hours
 *   - Finance & Reporting     — daily 06:00 UTC
 *   - Acquisition & Outreach  — weekly Monday 09:00 UTC
 *   - Platform stats          — hourly :30
 *
 * EXTERNAL CREDENTIALS required for real side effects (set in Convex env vars):
 *   Growth   : TWITTER_BEARER_TOKEN, LINKEDIN_ACCESS_TOKEN, INSTAGRAM_API_KEY
 *   Support  : SUPPORT_EMAIL_API_KEY, SUPPORT_FROM_EMAIL, HELPDESK_API_KEY, HELPDESK_BASE_URL
 *   Finance  : (reads Convex DB only; Stripe/RevenueCat keys in http.ts)
 *   Outreach : OUTREACH_EMAIL_API_KEY, LINKEDIN_OUTREACH_TOKEN, OUTREACH_FROM_EMAIL
 *
 * Agents run from day one without external keys and accumulate real history;
 * drafts are stored in agentActivityLog until keys are wired up.
 */
import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Growth & Content: draft social posts, blog outlines, engagement content
crons.daily('growth-agent', { hourUTC: 8, minuteUTC: 0 }, internal.agents.growth.run)

// Customer Support: scan open support messages and draft responses
crons.interval('support-agent', { hours: 4 }, internal.agents.support.run)

// Finance & Reporting: reconcile revenue/expense, draft P&L summary
crons.daily('finance-agent', { hourUTC: 6, minuteUTC: 0 }, internal.agents.finance.run)

// Platform stats aggregation: recompute aggregatePlatformStats
crons.hourly('platform-stats', { minuteUTC: 30 }, internal.agents.platformStats.aggregate)

// Customer Acquisition & Outreach: weekly outreach drafts
crons.weekly(
  'acquisition-agent',
  { dayOfWeek: 'monday', hourUTC: 9, minuteUTC: 0 },
  internal.agents.acquisition.run
)

// Wins Ledger: weekly nudge to log wins (push delivery requires operational setup)
crons.weekly(
  'wins-nudge',
  { dayOfWeek: 'monday', hourUTC: 10, minuteUTC: 0 },
  internal.winsAction.weeklyNudge
)

export default crons
