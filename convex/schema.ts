/**
 * Convex schema — RaiseHER, Part One (Builder One)
 *
 * Builder One owns: users, payGapProfiles, wins, agentActivityLog,
 *   aggregatePlatformStats, localizationStrings, supportMessages,
 *   revenueEntries, expenseEntries, submissionContacts
 *
 * Builder Two placeholders (shapes to be confirmed with Builder Two):
 *   scenarios, rehearsalSessions, caseFiles, outcomes, testimonialConsent
 *
 * DO NOT edit Builder Two tables without confirming payload shapes first.
 */
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // -------------------------------------------------------------------------
  // Builder One tables
  // -------------------------------------------------------------------------

  /**
   * Mirrors Clerk user record. Synced via Clerk webhook on user.created/updated.
   */
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    preferredLanguage: v.string(), // SupportedLocale: 'en' | 'es' | 'fr' | 'pt'
    isFounder: v.boolean(), // gates Agent Ops Dashboard
    createdAt: v.number(), // Unix ms
    updatedAt: v.number(),
  }).index('by_clerk_id', ['clerkId']),

  /**
   * AI-generated pay gap analysis for a user.
   * Generated natively in the user's preferredLanguage by Gemini.
   */
  payGapProfiles: defineTable({
    userId: v.id('users'),
    industry: v.string(),
    role: v.string(),
    yearsExperience: v.number(),
    location: v.string(),
    currentSalary: v.number(),
    currency: v.string(), // ISO 4217 e.g. 'USD'
    benchmarkSalary: v.number(), // From AI analysis
    gapAmount: v.number(), // benchmarkSalary - currentSalary
    gapPercentage: v.number(),
    aiAnalysis: v.string(), // Full AI-generated narrative in targetLanguage
    targetLanguage: v.string(),
    generatedAt: v.number(),
    // Metadata for Agent Ops Dashboard benchmarking
    geminiModelUsed: v.string(),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
  }).index('by_user', ['userId']),

  /**
   * User-recorded wins / accomplishments for the Wins Ledger.
   */
  wins: defineTable({
    userId: v.id('users'),
    description: v.string(),
    impact: v.optional(v.string()),
    estimatedValue: v.optional(v.number()),
    currency: v.optional(v.string()),
    date: v.number(), // Unix ms (day precision)
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_date', ['userId', 'date']),

  /**
   * Audit log for every business-operating agent action.
   * The Agent Ops Dashboard reads from this table.
   */
  agentActivityLog: defineTable({
    agentName: v.string(), // e.g. 'growth', 'support', 'finance', 'benchmark'
    action: v.string(), // e.g. 'generate_paygap', 'draft_social_post'
    summary: v.string(), // Human-readable summary (AI-generated in English)
    metadata: v.optional(v.any()), // Agent-specific structured data
    durationMs: v.optional(v.number()),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    userId: v.optional(v.id('users')), // null for platform-level agent actions
    timestamp: v.number(),
  })
    .index('by_agent', ['agentName'])
    .index('by_timestamp', ['timestamp'])
    .index('by_agent_timestamp', ['agentName', 'timestamp']),

  /**
   * Rolling platform-wide aggregate stats (updated by crons).
   * Single-row table; keyed by a stable document ID stored in env or
   * queried by `statKey`.
   */
  aggregatePlatformStats: defineTable({
    statKey: v.string(), // e.g. 'platform_v1'
    totalUsers: v.number(),
    totalWins: v.number(),
    avgGapPercentage: v.number(),
    totalGapClosedUsd: v.number(),
    computedAt: v.number(),
  }).index('by_key', ['statKey']),

  /**
   * AI-generated localization strings that differ from the static JSON files.
   * `isAiPromptTemplate: true` means the string is used as a Gemini prompt
   * template and must NOT be treated as a final UI string.
   */
  localizationStrings: defineTable({
    namespace: v.string(),
    key: v.string(),
    locale: v.string(),
    value: v.string(),
    isAiPromptTemplate: v.boolean(),
    updatedAt: v.number(),
  }).index('by_namespace_key_locale', ['namespace', 'key', 'locale']),

  /**
   * Inbound customer support messages (routed to the Support agent).
   */
  supportMessages: defineTable({
    userId: v.optional(v.id('users')),
    email: v.optional(v.string()),
    subject: v.string(),
    body: v.string(),
    status: v.string(), // 'open' | 'in_progress' | 'resolved'
    agentResponseDraft: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_status', ['status']),

  /**
   * Revenue entries — from Stripe webhook (web checkout) and RevenueCat IAP.
   * Feeds the Finance agent and the P&L tracker in the Agent Ops Dashboard.
   */
  revenueEntries: defineTable({
    source: v.string(), // 'stripe' | 'revenuecat_ios' | 'revenuecat_android'
    amountUsdCents: v.number(),
    currency: v.string(),
    amountLocalCents: v.number(),
    description: v.string(),
    externalId: v.optional(v.string()), // Stripe charge ID or RC transaction ID
    userId: v.optional(v.id('users')),
    recordedAt: v.number(),
  }).index('by_recorded_at', ['recordedAt']),

  /**
   * Expense entries — manually entered or agent-drafted.
   * Feeds the Finance agent P&L tracker.
   */
  expenseEntries: defineTable({
    category: v.string(), // e.g. 'hosting', 'marketing', 'tools'
    amountUsdCents: v.number(),
    description: v.string(),
    vendor: v.optional(v.string()),
    invoiceUrl: v.optional(v.string()),
    recordedAt: v.number(),
  }).index('by_recorded_at', ['recordedAt']),

  /**
   * Consented customer contacts captured for testimonials / outreach evidence.
   * Kept FULLY SEPARATE from anonymized app data per the plan.
   * Only collected with explicit in-app consent flow.
   */
  submissionContacts: defineTable({
    userId: v.optional(v.id('users')),
    fullName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    consentGrantedAt: v.number(),
    consentText: v.string(), // exact text shown to user at consent time
    testimonialDraft: v.optional(v.string()),
    useCase: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_email', ['email']),

  // -------------------------------------------------------------------------
  // Builder Two placeholder tables
  // DO NOT edit shapes without confirming payload with Builder Two first.
  // -------------------------------------------------------------------------

  scenarios: defineTable({
    userId: v.id('users'),
    payGapProfileId: v.optional(v.id('payGapProfiles')), // handoff from Builder One
    title: v.string(),
    context: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  rehearsalSessions: defineTable({
    userId: v.id('users'),
    scenarioId: v.id('scenarios'),
    status: v.string(), // 'in_progress' | 'completed'
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index('by_user', ['userId']),

  caseFiles: defineTable({
    userId: v.id('users'),
    title: v.string(),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  outcomes: defineTable({
    userId: v.id('users'),
    rehearsalSessionId: v.optional(v.id('rehearsalSessions')),
    raiseAmount: v.optional(v.number()),
    currency: v.optional(v.string()),
    recordedAt: v.number(),
  }).index('by_user', ['userId']),

  testimonialConsent: defineTable({
    userId: v.id('users'),
    consentGrantedAt: v.number(),
    platform: v.string(),
  }).index('by_user', ['userId']),
})
