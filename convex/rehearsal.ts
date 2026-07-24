/**
 * Rehearsal Room: queries and mutations.
 *
 * Built-in scenarios are hard-coded constants (no DB seeding needed).
 * User-created custom scenarios use the `scenarios` table.
 *
 * Data flow:
 *   createSession  → rehearsalSessions (in_progress)
 *   addUserTurn    → rehearsalTurns (role: 'user')
 *   [rehearsalAction.generateAITurn schedules → addAITurn]
 *   addAITurn      → rehearsalTurns (role: 'ai')
 *   completeSession → rehearsalSessions (completed) + scorecard stored
 */
import { query, mutation, internalMutation, internalQuery } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'

// ---------------------------------------------------------------------------
// Built-in scenarios
// ---------------------------------------------------------------------------

export type ScenarioKey =
  | 'ask_raise'
  | 'negotiate_offer'
  | 'handle_deflection'
  | 'negotiate_promotion'

export interface BuiltInScenario {
  key: ScenarioKey
  aiPersona: string
  systemContext: string
}

export const BUILT_IN_SCENARIOS: BuiltInScenario[] = [
  {
    key: 'ask_raise',
    aiPersona: 'direct_manager',
    systemContext:
      'You are a realistic manager. The employee has requested a salary review meeting. You respect their work but have budget pressures. Start the meeting by welcoming them and asking what they wanted to discuss.',
  },
  {
    key: 'negotiate_offer',
    aiPersona: 'recruiter',
    systemContext:
      'You are a recruiter who has just extended a job offer. The candidate has asked to discuss compensation. You have some flexibility but want to stay close to the initial offer. Start by asking what they would like to talk about.',
  },
  {
    key: 'handle_deflection',
    aiPersona: 'direct_manager',
    systemContext:
      'You are a manager who has just told the employee that "now is not the right time" for a salary discussion due to company budget review. The employee is pushing back. Respond realistically, with honest but not unkind pushback.',
  },
  {
    key: 'negotiate_promotion',
    aiPersona: 'direct_manager',
    systemContext:
      'You are a manager meeting with an employee who wants to discuss both a promotion and a salary increase. You value this employee but need a strong business case before taking it to HR. Start the conversation by opening the floor to them.',
  },
]

export function getBuiltInScenario(key: string): BuiltInScenario | undefined {
  return BUILT_IN_SCENARIOS.find((s) => s.key === key)
}

// ---------------------------------------------------------------------------
// Public queries
// ---------------------------------------------------------------------------

/** Returns the static list of built-in scenario keys. */
export const listBuiltInScenarios = query({
  args: {},
  handler: async () => {
    return BUILT_IN_SCENARIOS.map((s) => ({ key: s.key, aiPersona: s.aiPersona }))
  },
})

/** Returns recent sessions for the authenticated user. */
export const listSessions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) return []

    return ctx.db
      .query('rehearsalSessions')
      .withIndex('by_user_started', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(args.limit ?? 20)
  },
})

/** Returns a single session by ID (auth-gated). */
export const getSession = query({
  args: { sessionId: v.id('rehearsalSessions') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const session = await ctx.db.get(args.sessionId)
    if (!session) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user || session.userId !== user._id) return null

    return session
  },
})

/** Returns all turns for a session, ordered ascending by createdAt. */
export const listTurns = query({
  args: { sessionId: v.id('rehearsalSessions') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const session = await ctx.db.get(args.sessionId)
    if (!session) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user || session.userId !== user._id) return []

    return ctx.db
      .query('rehearsalTurns')
      .withIndex('by_session_created', (q) => q.eq('sessionId', args.sessionId))
      .order('asc')
      .take(200)
  },
})

// ---------------------------------------------------------------------------
// Public mutations
// ---------------------------------------------------------------------------

/** Creates a new rehearsal session and returns its ID. */
export const createSession = mutation({
  args: {
    scenarioKey: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args): Promise<Id<'rehearsalSessions'>> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) throw new Error('User not found')

    return ctx.db.insert('rehearsalSessions', {
      userId: user._id,
      scenarioKey: args.scenarioKey,
      status: 'in_progress',
      language: args.language,
      turnCount: 0,
      startedAt: Date.now(),
    })
  },
})

/** Appends a user turn and bumps turnCount. Returns the turn ID. */
export const addUserTurn = mutation({
  args: {
    sessionId: v.id('rehearsalSessions'),
    content: v.string(),
    inputMode: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<'rehearsalTurns'>> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const session = await ctx.db.get(args.sessionId)
    if (!session) throw new Error('Session not found')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user || session.userId !== user._id) throw new Error('Unauthorized')
    if (session.status !== 'in_progress') throw new Error('Session is not active')

    const turnId = await ctx.db.insert('rehearsalTurns', {
      sessionId: args.sessionId,
      userId: user._id,
      role: 'user',
      content: args.content,
      inputMode: args.inputMode,
      createdAt: Date.now(),
    })

    await ctx.db.patch(args.sessionId, { turnCount: session.turnCount + 1 })

    return turnId
  },
})

/** Marks a session as completed and stores the scorecard. */
export const completeSession = mutation({
  args: {
    sessionId: v.id('rehearsalSessions'),
    scorecard: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const session = await ctx.db.get(args.sessionId)
    if (!session) throw new Error('Session not found')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user || session.userId !== user._id) throw new Error('Unauthorized')

    await ctx.db.patch(args.sessionId, {
      status: 'completed',
      completedAt: Date.now(),
      scorecard: args.scorecard ?? null,
    })
  },
})

// ---------------------------------------------------------------------------
// Internal queries (called from rehearsalAction)
// ---------------------------------------------------------------------------

/** Returns turns for a session for use in action context. */
export const getSessionTurnsInternal = internalQuery({
  args: { sessionId: v.id('rehearsalSessions') },
  handler: async (ctx, args) => {
    return ctx.db
      .query('rehearsalTurns')
      .withIndex('by_session_created', (q) => q.eq('sessionId', args.sessionId))
      .order('asc')
      .take(200)
  },
})

/** Returns a session for use in action context (no auth check , internal). */
export const getSessionInternal = internalQuery({
  args: { sessionId: v.id('rehearsalSessions') },
  handler: async (ctx, args) => {
    return ctx.db.get(args.sessionId)
  },
})

// ---------------------------------------------------------------------------
// Internal mutations (called from rehearsalAction)
// ---------------------------------------------------------------------------

/** Appends an AI turn. Called from rehearsalAction after Gemini responds. */
export const addAITurn = internalMutation({
  args: {
    sessionId: v.id('rehearsalSessions'),
    userId: v.id('users'),
    content: v.string(),
  },
  handler: async (ctx, args): Promise<Id<'rehearsalTurns'>> => {
    const session = await ctx.db.get(args.sessionId)
    if (!session) throw new Error('Session not found')

    const turnId = await ctx.db.insert('rehearsalTurns', {
      sessionId: args.sessionId,
      userId: args.userId,
      role: 'ai',
      content: args.content,
      createdAt: Date.now(),
    })

    await ctx.db.patch(args.sessionId, { turnCount: session.turnCount + 1 })

    return turnId
  },
})

/** Stores a completed scorecard on the session. Called from rehearsalAction. */
export const storeScorecard = internalMutation({
  args: {
    sessionId: v.id('rehearsalSessions'),
    scorecard: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      status: 'completed',
      completedAt: Date.now(),
      scorecard: args.scorecard,
    })
  },
})
