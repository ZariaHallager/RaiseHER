/**
 * Wins Ledger: AI rewrite action + weekly nudge.
 *
 * `rewriteWin` (public action): called directly from the client.
 *   Sends the raw win description to Gemini and returns either a polished
 *   rewrite with impact and suggested tags, or follow-up questions if the
 *   description is too vague to polish well.
 *
 * `weeklyNudge` (internalAction): fired by the weekly cron. Logs a
 *   platform-level nudge event to agentActivityLog. Real push-notification
 *   delivery requires Expo push tokens, which is flagged as operational setup
 *   (not code) per the build plan. Agents run from day one and accumulate history.
 */
import { action, internalAction } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { generateWithGemini, languageInstruction } from './lib/gemini'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WinRewriteResult =
  | {
    type: 'rewrite'
    polished: string
    impact: string
    suggestedTags: string[]
  }
  | {
    type: 'followup'
    questions: string[]
  }

// ---------------------------------------------------------------------------
// Public action: rewriteWin
// ---------------------------------------------------------------------------

export const rewriteWin = action({
  args: {
    rawDescription: v.string(),
    targetLanguage: v.string(),
  },
  handler: async (_ctx, args): Promise<WinRewriteResult> => {
    const startedAt = Date.now()

    const prompt = buildRewritePrompt(args.rawDescription, args.targetLanguage)

    let geminiResult
    try {
      geminiResult = await generateWithGemini(prompt)
    } catch (error) {
      throw new Error(`Gemini unavailable: ${String(error)}`)
    }

    const parsed = parseRewriteResponse(geminiResult.text, startedAt)
    return parsed
  },
})

// ---------------------------------------------------------------------------
// Internal action: weeklyNudge (called by cron)
// ---------------------------------------------------------------------------

export const weeklyNudge = internalAction({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.agentActivityLog.logActivity, {
      agentName: 'wins_nudge',
      action: 'weekly_nudge',
      summary:
        'Weekly wins nudge scheduled for all active users. Push-notification delivery requires Expo push tokens (operational setup flagged).',
      success: true,
      durationMs: 0,
      timestamp: Date.now(),
    })
  },
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildRewritePrompt(rawDescription: string, targetLanguage: string): string {
  const langInstruction = languageInstruction(targetLanguage)

  return `${langInstruction}

You are helping a professional woman polish an entry in her career wins ledger.
The wins ledger is used to build a case for salary negotiations and promotions.

Evaluate the following raw win description and do one of two things:

OPTION A: If the description has specific enough detail to polish (mentions a role, outcome, project, metric, team, time period, or concrete achievement), respond with a JSON object like this:
{
  "type": "rewrite",
  "polished": "A clear, professional, first-person description of the win with specific details and strong action verbs. 1 to 3 sentences.",
  "impact": "A concise, quantified-where-possible statement of the business or career impact. 1 sentence.",
  "suggestedTags": ["tag1", "tag2", "tag3"]
}

OPTION B: If the description is too vague to polish effectively (for example: only says 'did a good job' or 'helped with a project' with no specific context), respond with a JSON object like this:
{
  "type": "followup",
  "questions": ["Question 1?", "Question 2?", "Question 3?"]
}

Rules:
- JSON keys (type, polished, impact, suggestedTags, questions) must remain in English.
- All values (descriptions, questions, tags) must be written in the target language.
- Do NOT use em dashes anywhere; use commas, colons, or parentheses instead.
- suggestedTags should be lowercase single words or short phrases.
- Return ONLY the JSON object. No preamble, no markdown code fences, no explanation outside the JSON.

Raw win description:
"${rawDescription.replace(/"/g, '\\"')}"
`.trim()
}

function parseRewriteResponse(text: string, _startedAt: number): WinRewriteResult {
  // Strip markdown code fences if Gemini wrapped in ```json ... ```
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    // If JSON parsing fails, treat as a rewrite with the raw text as polished
    return {
      type: 'rewrite',
      polished: text.trim(),
      impact: '',
      suggestedTags: [],
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { type: 'rewrite', polished: text.trim(), impact: '', suggestedTags: [] }
  }

  const obj = parsed as Record<string, unknown>

  if (obj.type === 'followup') {
    const questions = Array.isArray(obj.questions)
      ? (obj.questions as unknown[]).filter((q): q is string => typeof q === 'string')
      : []
    return { type: 'followup', questions }
  }

  if (obj.type === 'rewrite') {
    return {
      type: 'rewrite',
      polished: typeof obj.polished === 'string' ? obj.polished : '',
      impact: typeof obj.impact === 'string' ? obj.impact : '',
      suggestedTags: Array.isArray(obj.suggestedTags)
        ? (obj.suggestedTags as unknown[]).filter((t): t is string => typeof t === 'string')
        : [],
    }
  }

  // Unknown shape, treat as rewrite
  return { type: 'rewrite', polished: text.trim(), impact: '', suggestedTags: [] }
}
