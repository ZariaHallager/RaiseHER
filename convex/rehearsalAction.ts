/**
 * Rehearsal Room: AI actions.
 *
 * generateAITurn: generates the AI partner's next conversational response.
 *   Called from the client after the user submits their turn.
 *   Reads turn history via internalQuery, calls Gemini natively in the
 *   user's language, then persists the AI response via internalMutation.
 *
 * generateScorecard: scores the completed session.
 *   Called from the client after the user ends the session.
 *   Reads the full transcript, calls Gemini to produce five dimension scores
 *   (0-100) with narrative feedback and research-grounded next steps,
 *   then persists the scorecard on the session via internalMutation.
 *
 * Both actions generate content NATIVELY in the user's preferred language.
 * The JSON envelope keys (scores, dimensions) stay in English so the client
 * can parse them reliably; only the human-readable text is localized.
 */
import { action } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { generateNativeContent, languageInstruction } from './lib/gemini'
import { getBuiltInScenario } from './rehearsal'
import type { Id } from './_generated/dataModel'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScorecardDimension {
  score: number // 0-100
  label: string // localized e.g. "Clarity"
  feedback: string // localized 1-2 sentence feedback
}

export interface ScorecardResult {
  dimensions: {
    clarity: ScorecardDimension
    confidence: ScorecardDimension
    evidence: ScorecardDimension
    objections: ScorecardDimension
    overall: ScorecardDimension
  }
  narrative: string // localized 2-3 sentence overall summary
  nextSteps: string[] // 3 localized actionable next steps
  generatedAt: number
}

// ---------------------------------------------------------------------------
// Public action: generateAITurn
// ---------------------------------------------------------------------------

export const generateAITurn = action({
  args: {
    sessionId: v.id('rehearsalSessions'),
  },
  handler: async (ctx, args): Promise<{ content: string }> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const session = await ctx.runQuery(internal.rehearsal.getSessionInternal, {
      sessionId: args.sessionId,
    })
    if (!session) throw new Error('Session not found')

    const userId: Id<'users'> = session.userId

    const turns = await ctx.runQuery(internal.rehearsal.getSessionTurnsInternal, {
      sessionId: args.sessionId,
    })

    const scenario = getBuiltInScenario(session.scenarioKey)
    if (!scenario) throw new Error(`Unknown scenario: ${session.scenarioKey}`)

    const prompt = buildAITurnPrompt({
      scenarioContext: scenario.systemContext,
      aiPersona: scenario.aiPersona,
      turns: turns.map((t) => ({ role: t.role as 'user' | 'ai', content: t.content })),
      targetLanguage: session.language,
    })

    let geminiResult
    try {
      geminiResult = await generateNativeContent(prompt, session.language)
    } catch (error) {
      throw new Error(`AI partner unavailable: ${String(error)}`)
    }

    const aiContent = geminiResult.text.trim()

    await ctx.runMutation(internal.rehearsal.addAITurn, {
      sessionId: args.sessionId,
      userId,
      content: aiContent,
    })

    return { content: aiContent }
  },
})

// ---------------------------------------------------------------------------
// Public action: generateScorecard
// ---------------------------------------------------------------------------

export const generateScorecard = action({
  args: {
    sessionId: v.id('rehearsalSessions'),
  },
  handler: async (ctx, args): Promise<ScorecardResult> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const session = await ctx.runQuery(internal.rehearsal.getSessionInternal, {
      sessionId: args.sessionId,
    })
    if (!session) throw new Error('Session not found')

    const turns = await ctx.runQuery(internal.rehearsal.getSessionTurnsInternal, {
      sessionId: args.sessionId,
    })

    const scenario = getBuiltInScenario(session.scenarioKey)
    const scenarioLabel = scenario?.aiPersona ?? 'manager'

    const prompt = buildScorecardPrompt({
      scenarioKey: session.scenarioKey,
      scenarioLabel,
      turns: turns.map((t) => ({ role: t.role as 'user' | 'ai', content: t.content })),
      targetLanguage: session.language,
    })

    let geminiResult
    try {
      geminiResult = await generateNativeContent(prompt, session.language)
    } catch (error) {
      throw new Error(`Scorecard generation failed: ${String(error)}`)
    }

    const scorecard = parseScorecardResponse(geminiResult.text)

    await ctx.runMutation(internal.rehearsal.storeScorecard, {
      sessionId: args.sessionId,
      scorecard,
    })

    return scorecard
  },
})

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function buildAITurnPrompt(args: {
  scenarioContext: string
  aiPersona: string
  turns: Array<{ role: 'user' | 'ai'; content: string }>
  targetLanguage: string
}): string {
  const { scenarioContext, aiPersona, turns, targetLanguage } = args
  const langInstruction = languageInstruction(targetLanguage)

  const historyText = turns
    .map((t) => {
      const label = t.role === 'user' ? 'Employee' : 'You'
      return `${label}: ${t.content}`
    })
    .join('\n\n')

  const isOpening = turns.length === 0

  return `${langInstruction}

You are playing the role of a ${aiPersona} in a salary negotiation rehearsal. This is a training exercise to help a professional woman practice negotiating her salary.

SCENARIO: ${scenarioContext}

RULES FOR YOUR RESPONSE:
- Stay in character as the ${aiPersona} throughout.
- Be realistic, not a pushover , give genuine pushback, ask clarifying questions, and respond the way a real ${aiPersona} would.
- Keep your response to 2 to 4 sentences. Do not give a speech.
- Do NOT offer coaching or break character.
- Do NOT use em dashes; use commas, colons, or parentheses instead.
- Your response should feel like a real conversation, not a formal statement.
${isOpening ? '- This is the opening of the conversation. Greet them and set the stage.' : ''}

CONVERSATION SO FAR:
${historyText || '(No turns yet , open the conversation.)'}

${isOpening ? 'Begin the conversation now.' : 'Respond to the employee\'s last message.'}`.trim()
}

function buildScorecardPrompt(args: {
  scenarioKey: string
  scenarioLabel: string
  turns: Array<{ role: 'user' | 'ai'; content: string }>
  targetLanguage: string
}): string {
  const { scenarioKey, scenarioLabel, turns, targetLanguage } = args
  const langInstruction = languageInstruction(targetLanguage)

  const transcript = turns
    .map((t) => {
      const label = t.role === 'user' ? 'Negotiator' : 'AI Partner'
      return `${label}: ${t.content}`
    })
    .join('\n\n')

  const scenarioLabels: Record<string, string> = {
    ask_raise: 'asking for a raise',
    negotiate_offer: 'negotiating a job offer',
    handle_deflection: 'handling manager deflection',
    negotiate_promotion: 'negotiating a promotion',
  }
  const context = scenarioLabels[scenarioKey] ?? 'salary negotiation'

  return `${langInstruction}

You are a salary negotiation coach reviewing a rehearsal transcript. The user was practicing ${context} with an AI partner playing the role of their ${scenarioLabel}.

Score the negotiator on FIVE dimensions, each from 0 to 100 (integers only):
1. clarity , How clearly and directly did they state their ask? Did they get to the point?
2. confidence , Did they sound confident and self-assured, or hesitant and apologetic?
3. evidence , Did they use data, market research, specific accomplishments, or concrete examples?
4. objections , How effectively did they handle pushback, redirection, or difficult questions?
5. overall , A holistic score reflecting negotiation readiness overall.

Research context (incorporate into your feedback where relevant):
- Women who cite specific market data get 15-20% better outcomes than those who don't (McKinsey, 2023).
- Collaborative framing ("I want to find something that works for both of us") outperforms adversarial framing.
- Silence after a counterproposal is a skill; filling it with concessions is the most common mistake.
- Anchoring high is statistically beneficial: the first number stated tends to anchor the range.

Respond with ONLY a JSON object in this exact shape. JSON keys MUST be in English. All text values (labels, feedback, narrative, nextSteps) MUST be in the target language.

{
  "dimensions": {
    "clarity": {
      "score": <integer 0-100>,
      "label": "<localized label>",
      "feedback": "<1-2 sentences of specific feedback>"
    },
    "confidence": {
      "score": <integer 0-100>,
      "label": "<localized label>",
      "feedback": "<1-2 sentences of specific feedback>"
    },
    "evidence": {
      "score": <integer 0-100>,
      "label": "<localized label>",
      "feedback": "<1-2 sentences of specific feedback>"
    },
    "objections": {
      "score": <integer 0-100>,
      "label": "<localized label>",
      "feedback": "<1-2 sentences of specific feedback>"
    },
    "overall": {
      "score": <integer 0-100>,
      "label": "<localized label>",
      "feedback": "<1-2 sentences of specific feedback>"
    }
  },
  "narrative": "<2-3 sentence overall summary of the rehearsal, encouraging but honest>",
  "nextSteps": [
    "<specific actionable step 1>",
    "<specific actionable step 2>",
    "<specific actionable step 3>"
  ]
}

Return ONLY the JSON. No preamble, no markdown fences, no explanation outside the JSON.

REHEARSAL TRANSCRIPT:
${transcript}`.trim()
}

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

function parseScorecardResponse(text: string): ScorecardResult {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    return fallbackScorecard()
  }

  if (typeof parsed !== 'object' || parsed === null) return fallbackScorecard()

  const obj = parsed as Record<string, unknown>
  const dims = obj.dimensions as Record<string, unknown> | undefined
  if (!dims || typeof dims !== 'object') return fallbackScorecard()

  function parseDim(key: string, defaultLabel: string): ScorecardDimension {
    const d = (dims as Record<string, unknown>)[key]
    if (!d || typeof d !== 'object') {
      return { score: 50, label: defaultLabel, feedback: '' }
    }
    const dim = d as Record<string, unknown>
    return {
      score: typeof dim.score === 'number' ? Math.min(100, Math.max(0, Math.round(dim.score))) : 50,
      label: typeof dim.label === 'string' ? dim.label : defaultLabel,
      feedback: typeof dim.feedback === 'string' ? dim.feedback : '',
    }
  }

  return {
    dimensions: {
      clarity: parseDim('clarity', 'Clarity'),
      confidence: parseDim('confidence', 'Confidence'),
      evidence: parseDim('evidence', 'Evidence'),
      objections: parseDim('objections', 'Handling pushback'),
      overall: parseDim('overall', 'Overall readiness'),
    },
    narrative: typeof obj.narrative === 'string' ? obj.narrative : '',
    nextSteps: Array.isArray(obj.nextSteps)
      ? (obj.nextSteps as unknown[]).filter((s): s is string => typeof s === 'string').slice(0, 3)
      : [],
    generatedAt: Date.now(),
  }
}

function fallbackScorecard(): ScorecardResult {
  return {
    dimensions: {
      clarity: { score: 50, label: 'Clarity', feedback: '' },
      confidence: { score: 50, label: 'Confidence', feedback: '' },
      evidence: { score: 50, label: 'Evidence', feedback: '' },
      objections: { score: 50, label: 'Handling pushback', feedback: '' },
      overall: { score: 50, label: 'Overall readiness', feedback: '' },
    },
    narrative: 'Scorecard could not be generated. Please try again.',
    nextSteps: [],
    generatedAt: Date.now(),
  }
}
