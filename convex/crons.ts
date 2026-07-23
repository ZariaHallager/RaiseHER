/**
 * Convex scheduled functions (crons)
 *
 * Schedules for business-operating agents:
 *   - Growth & Content agent (daily)
 *   - Customer Acquisition & Outreach agent (weekly)
 *   - Finance & Reporting agent (daily)
 *   - Platform stats aggregation (hourly)
 *
 * Each cron drafts/decides via Gemini and writes to agentActivityLog.
 * External side effects (real posting, email sends) require API keys
 * set as Convex env vars — agents run from day one and accumulate history.
 */
import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Growth & Content — draft social posts, blog outlines, engagement content
crons.daily('growth-agent', { hourUTC: 8, minuteUTC: 0 }, internal.agents.growth.run)

// Finance & Reporting — reconcile revenue/expense, draft P&L summary
crons.daily('finance-agent', { hourUTC: 6, minuteUTC: 0 }, internal.agents.finance.run)

// Platform stats aggregation — recompute aggregatePlatformStats
crons.hourly('platform-stats', { minuteUTC: 30 }, internal.agents.platformStats.aggregate)

// Customer Acquisition & Outreach — weekly outreach drafts
crons.weekly(
  'acquisition-agent',
  { dayOfWeek: 'monday', hourUTC: 9, minuteUTC: 0 },
  internal.agents.acquisition.run
)

export default crons
