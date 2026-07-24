/**
 * Case File generation: internal Convex action + supporting internal queries.
 *
 * Pulls together the user's pay gap figure, their strongest wins, and
 * their best rehearsed lines, then calls Gemini to produce a one-page
 * raise brief natively in the user's language.
 *
 * Call path:
 *   caseFiles.requestCaseFileGeneration (mutation)
 *     -> ctx.scheduler.runAfter -> caseFileAction.generateCaseFileInternal (internalAction)
 *     -> Gemini API (natively in targetLanguage)
 *     -> caseFiles.saveBrief (internalMutation) -> caseFiles table
 *     -> agentActivityLog.logActivity (internalMutation) -> agentActivityLog table
 *
 * On failure the action calls caseFiles.markCaseFileError so the UI can
 * show a specific error message rather than hanging on 'generating'.
 *
 * NOTE: This file mixes internalAction and internalQuery intentionally.
 * Both run in the default Convex V8 runtime (no Node.js built-ins needed).
 * Do NOT add "use node" — the Gemini SDK works in the default runtime.
 */
import { internalAction, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { generateNativeContent, languageInstruction } from './lib/gemini'
import type { Id } from './_generated/dataModel'

// ---------------------------------------------------------------------------
// Exported type used by the front-end to render the brief
// ---------------------------------------------------------------------------

export interface CaseFileBrief {
  /** Localized document headline, e.g. "My Case for a Raise" */
  headline: string
  /** 2-sentence summary of who she is and what she is asking for */
  summary: string
  /** Role and industry label from the pay gap profile */
  roleLabel: string
  gapSection: {
    heading: string
    narrative: string
    currentSalary: string
    benchmarkSalary: string
    gapAmount: string
    gapPercentage: string
  }
  winsSection: {
    heading: string
    items: string[]
  }
  /** Present only when the user has at least one completed rehearsal session */
  rehearsalSection?: {
    heading: string
    lines: string[]
  }
  closingSection: {
    heading: string
    ask: string
  }
}

// ---------------------------------------------------------------------------
// Internal queries (called via ctx.runQuery from the action)
// ---------------------------------------------------------------------------

export const getPayGapProfileForBrief = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return ctx.db
      .query('payGapProfiles')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .first()
  },
})

export const getWinsForBrief = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return ctx.db
      .query('wins')
      .withIndex('by_user_date', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(20)
  },
})

export const getBestRehearsalSession = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query('rehearsalSessions')
      .withIndex('by_user_started', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(20)

    const completed = sessions.filter(
      (s) => s.status === 'completed' && s.scorecard != null
    )

    if (completed.length === 0) return null

    // Return the session with the highest overall score.
    return completed.reduce((best, session) => {
      const bestScore = (best.scorecard as any)?.dimensions?.overall?.score ?? 0
      const thisScore = (session.scorecard as any)?.dimensions?.overall?.score ?? 0
      return thisScore > bestScore ? session : best
    })
  },
})

export const getUserTurnsForBrief = internalQuery({
  args: { sessionId: v.id('rehearsalSessions') },
  handler: async (ctx, args) => {
    const turns = await ctx.db
      .query('rehearsalTurns')
      .withIndex('by_session_created', (q) => q.eq('sessionId', args.sessionId))
      .order('asc')
      .take(100)

    return turns
      .filter((t) => t.role === 'user')
      .map((t) => t.content)
  },
})

// ---------------------------------------------------------------------------
// Main internalAction
// ---------------------------------------------------------------------------

export const generateCaseFileInternal = internalAction({
  args: {
    caseFileId: v.id('caseFiles'),
    userId: v.id('users'),
    language: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const startedAt = Date.now()

    try {
      const payGapProfile = await ctx.runQuery(
        internal.caseFileAction.getPayGapProfileForBrief,
        { userId: args.userId }
      )

      const wins = await ctx.runQuery(internal.caseFileAction.getWinsForBrief, {
        userId: args.userId,
      })

      const bestSession = await ctx.runQuery(
        internal.caseFileAction.getBestRehearsalSession,
        { userId: args.userId }
      )

      let rehearsalTurns: string[] = []
      if (bestSession) {
        rehearsalTurns = await ctx.runQuery(
          internal.caseFileAction.getUserTurnsForBrief,
          { sessionId: bestSession._id as Id<'rehearsalSessions'> }
        )
      }

      const prompt = buildCaseFilePrompt({
        payGapProfile: payGapProfile as PayGapData | null,
        wins: wins as WinData[],
        rehearsalTurns,
        language: args.language,
      })

      const geminiResult = await generateNativeContent(prompt, args.language)

      const brief = parseBriefResponse(geminiResult.text)

      // Track which wins were incorporated (up to 10 most recent).
      const includedWinIds = (wins as WinData[])
        .slice(0, 10)
        .map((w) => w._id as Id<'wins'>)

      await ctx.runMutation(internal.caseFiles.saveBrief, {
        caseFileId: args.caseFileId,
        title: brief.headline,
        brief,
        includedWinIds,
        geminiModelUsed: geminiResult.modelUsed,
        promptTokens: geminiResult.promptTokens,
        completionTokens: geminiResult.completionTokens,
      })

      await ctx.runMutation(internal.agentActivityLog.logActivity, {
        agentName: 'case_file',
        action: 'generate_case_file',
        summary: `Case file generated in ${args.language}. Wins: ${includedWinIds.length}. Rehearsal lines: ${rehearsalTurns.length > 0 ? 'yes' : 'no'}.`,
        metadata: {
          caseFileId: args.caseFileId,
          language: args.language,
          winsCount: includedWinIds.length,
          hasRehearsalLines: rehearsalTurns.length > 0,
          modelUsed: geminiResult.modelUsed,
          promptTokens: geminiResult.promptTokens,
          completionTokens: geminiResult.completionTokens,
        },
        success: true,
        durationMs: Date.now() - startedAt,
        userId: args.userId,
        timestamp: Date.now(),
      })
    } catch (error) {
      const message = String(error)

      await ctx.runMutation(internal.caseFiles.markCaseFileError, {
        caseFileId: args.caseFileId,
        errorMessage: message,
      })

      await ctx.runMutation(internal.agentActivityLog.logActivity, {
        agentName: 'case_file',
        action: 'generate_case_file',
        summary: `Case file generation failed: ${message}`,
        success: false,
        errorMessage: message,
        durationMs: Date.now() - startedAt,
        userId: args.userId,
        timestamp: Date.now(),
      })
    }
  },
})

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

interface WinData {
  _id: string
  description: string
  impact?: string
  estimatedValue?: number
  currency?: string
  date: number
  tags?: string[]
}

interface PayGapData {
  role: string
  industry: string
  currentSalary: number
  benchmarkSalary: number
  gapAmount: number
  gapPercentage: number
  currency: string
}

function buildCaseFilePrompt(args: {
  payGapProfile: PayGapData | null
  wins: WinData[]
  rehearsalTurns: string[]
  language: string
}): string {
  const { payGapProfile, wins, rehearsalTurns, language } = args
  const langInstruction = languageInstruction(language)

  const gapBlock = payGapProfile
    ? `PAY GAP DATA:
- Role: ${payGapProfile.role}
- Industry: ${payGapProfile.industry}
- Current salary: ${payGapProfile.currency} ${payGapProfile.currentSalary.toLocaleString()}
- Market benchmark: ${payGapProfile.currency} ${payGapProfile.benchmarkSalary.toLocaleString()}
- Gap amount: ${payGapProfile.currency} ${payGapProfile.gapAmount.toLocaleString()}
- Gap percentage: ${payGapProfile.gapPercentage.toFixed(1)}%`
    : `PAY GAP DATA: Not available yet. Use placeholder values ("--") in the numbers fields and encourage running the Pay Gap Reality Check in the narrative.`

  const winsBlock =
    wins.length > 0
      ? `WINS (select the 3 to 5 strongest for the winsSection bullets):
${wins
        .slice(0, 10)
        .map((w, i) => {
          const date = new Date(w.date).toLocaleDateString('en', {
            year: 'numeric',
            month: 'short',
          })
          const value =
            w.estimatedValue
              ? ` (est. value: ${w.currency ?? ''} ${w.estimatedValue.toLocaleString()})`
              : ''
          const impact = w.impact ? `\n   Impact: ${w.impact}` : ''
          const tags = w.tags?.length ? `\n   Tags: ${w.tags.join(', ')}` : ''
          return `${i + 1}. [${date}] ${w.description}${value}${impact}${tags}`
        })
        .join('\n')}`
      : `WINS: None logged yet. In the winsSection, encourage logging wins and show one example placeholder bullet in the document's language.`

  const rehearsalBlock =
    rehearsalTurns.length > 0
      ? `REHEARSAL LINES (user's own words from their best salary negotiation session):
${rehearsalTurns.map((t, i) => `${i + 1}. "${t}"`).join('\n')}

For rehearsalSection.lines: pick the 2 to 3 statements that are most compelling: specific, confident, value-anchored, or objection-handling. Use the user's exact words or a very light edit for grammar only.`
      : ''

  const rehearsalJsonBlock =
    rehearsalTurns.length > 0
      ? `"rehearsalSection": {
    "heading": "<section heading, localized>",
    "lines": ["<line 1>", "<line 2>", "<line 3 optional>"]
  },`
      : ''

  return `${langInstruction}

You are writing a one-page "raise case brief" for a professional woman preparing to negotiate her salary. This is her personal evidence document, not a formal memo.

Voice: direct, confident, warm. No hedging. No em dashes (use commas, colons, or parentheses). First-person where it reads naturally.

${gapBlock}

${winsBlock}

${rehearsalBlock}

Respond with ONLY a JSON object in this EXACT shape. JSON keys MUST stay in English. All text values MUST be in the target language.

{
  "headline": "<Document headline, e.g. 'My Case for a Raise', localized>",
  "summary": "<2 sentences: who she is, what she is asking for, and why the case is strong>",
  "roleLabel": "<role and industry from the pay gap data, or leave blank if unavailable>",
  "gapSection": {
    "heading": "<section heading, localized>",
    "narrative": "<2-3 sentences synthesizing the pay gap data into a confident statement>",
    "currentSalary": "<formatted salary string or '--'>",
    "benchmarkSalary": "<formatted benchmark string or '--'>",
    "gapAmount": "<formatted gap string or '--'>",
    "gapPercentage": "<formatted percentage, e.g. '18.4%', or '--'>"
  },
  "winsSection": {
    "heading": "<section heading, localized>",
    "items": ["<win bullet 1>", "<win bullet 2>", "<win bullet 3>"]
  },
  ${rehearsalJsonBlock}
  "closingSection": {
    "heading": "<section heading, e.g. 'The Ask', localized>",
    "ask": "<2-3 sentences: specific, confident ask anchored in the evidence above>"
  }
}

Return ONLY the JSON. No preamble, no markdown fences, no text outside the JSON.`.trim()
}

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

function parseBriefResponse(text: string): CaseFileBrief {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    return fallbackBrief()
  }

  if (typeof parsed !== 'object' || parsed === null) return fallbackBrief()
  const obj = parsed as Record<string, unknown>

  function str(val: unknown, fallback: string): string {
    return typeof val === 'string' && val.trim() ? val : fallback
  }

  function strArr(val: unknown): string[] {
    if (!Array.isArray(val)) return []
    return val.filter((x): x is string => typeof x === 'string')
  }

  function sec(val: unknown): Record<string, unknown> {
    return typeof val === 'object' && val !== null
      ? (val as Record<string, unknown>)
      : {}
  }

  const gapRaw = sec(obj.gapSection)
  const winsRaw = sec(obj.winsSection)
  const rehearsalRaw = sec(obj.rehearsalSection)
  const closingRaw = sec(obj.closingSection)

  const brief: CaseFileBrief = {
    headline: str(obj.headline, 'My Case for a Raise'),
    summary: str(obj.summary, ''),
    roleLabel: str(obj.roleLabel, ''),
    gapSection: {
      heading: str(gapRaw.heading, 'The Pay Gap'),
      narrative: str(gapRaw.narrative, ''),
      currentSalary: str(gapRaw.currentSalary, '--'),
      benchmarkSalary: str(gapRaw.benchmarkSalary, '--'),
      gapAmount: str(gapRaw.gapAmount, '--'),
      gapPercentage: str(gapRaw.gapPercentage, '--'),
    },
    winsSection: {
      heading: str(winsRaw.heading, 'Proven Wins'),
      items: strArr(winsRaw.items),
    },
    closingSection: {
      heading: str(closingRaw.heading, 'The Ask'),
      ask: str(closingRaw.ask, ''),
    },
  }

  if (typeof obj.rehearsalSection === 'object' && obj.rehearsalSection !== null) {
    brief.rehearsalSection = {
      heading: str(rehearsalRaw.heading, 'Lines That Land'),
      lines: strArr(rehearsalRaw.lines),
    }
  }

  return brief
}

function fallbackBrief(): CaseFileBrief {
  return {
    headline: 'My Case for a Raise',
    summary: 'Brief could not be generated. Please try again.',
    roleLabel: '',
    gapSection: {
      heading: 'The Pay Gap',
      narrative: '',
      currentSalary: '--',
      benchmarkSalary: '--',
      gapAmount: '--',
      gapPercentage: '--',
    },
    winsSection: {
      heading: 'Proven Wins',
      items: [],
    },
    closingSection: {
      heading: 'The Ask',
      ask: '',
    },
  }
}
