/**
 * Pay gap generation: internal Convex action.
 *
 * Kept in a separate module from payGap.ts (public API) to prevent
 * circular type-inference: payGap.ts -> internal.payGapAction -> payGapAction.ts
 * would cycle if everything lived in one file.
 *
 * Call path:
 *   payGap.requestPayGapAnalysis (mutation)
 *     -> ctx.scheduler.runAfter -> payGapAction.generatePayGapInternal (internalAction)
 *     -> Gemini API (natively in targetLanguage)
 *     -> payGapMutations.insertProfile (internalMutation) -> payGapProfiles table
 *     -> agentActivityLog.logActivity (internalMutation) -> agentActivityLog table
 */
import { internalAction } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { generateNativeContent } from './lib/gemini'
import type { Id } from './_generated/dataModel'

export const generatePayGapInternal = internalAction({
  args: {
    userId: v.id('users'),
    industry: v.string(),
    role: v.string(),
    yearsExperience: v.number(),
    location: v.string(),
    currentSalary: v.number(),
    currency: v.string(),
    targetLanguage: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    profileId: Id<'payGapProfiles'>
    benchmarkSalary: number
    gapAmount: number
    gapPercentage: number
  }> => {
    const startedAt = Date.now()

    const prompt = buildPayGapPrompt(args)

    let geminiResult
    try {
      geminiResult = await generateNativeContent(prompt, args.targetLanguage)
    } catch (error) {
      await ctx.runMutation(internal.agentActivityLog.logActivity, {
        agentName: 'benchmark',
        action: 'generate_paygap',
        summary: `Pay gap generation failed for user ${args.userId}.`,
        success: false,
        errorMessage: String(error),
        durationMs: Date.now() - startedAt,
        userId: args.userId,
        timestamp: Date.now(),
      })
      throw error
    }

    // Parse benchmark salary from the AI response.
    // The prompt instructs Gemini to embed a machine-readable BENCHMARK_SALARY marker.
    // Falls back to current salary * 1.15 if parsing fails.
    const benchmarkSalary = parseBenchmarkSalary(geminiResult.text, args.currentSalary)
    const gapAmount = benchmarkSalary - args.currentSalary
    const gapPercentage =
      args.currentSalary > 0 ? (gapAmount / args.currentSalary) * 100 : 0

    const profileId: Id<'payGapProfiles'> = await ctx.runMutation(
      internal.payGapMutations.insertProfile,
      {
        userId: args.userId,
        industry: args.industry,
        role: args.role,
        yearsExperience: args.yearsExperience,
        location: args.location,
        currentSalary: args.currentSalary,
        currency: args.currency,
        benchmarkSalary,
        gapAmount,
        gapPercentage,
        aiAnalysis: geminiResult.text,
        targetLanguage: args.targetLanguage,
        generatedAt: Date.now(),
        geminiModelUsed: geminiResult.modelUsed,
        promptTokens: geminiResult.promptTokens,
        completionTokens: geminiResult.completionTokens,
      }
    )

    await ctx.runMutation(internal.agentActivityLog.logActivity, {
      agentName: 'benchmark',
      action: 'generate_paygap',
      summary: `Pay gap profile generated. Gap: ${gapPercentage.toFixed(1)}% (${args.currency} ${gapAmount.toLocaleString()}). Language: ${args.targetLanguage}.`,
      metadata: {
        profileId,
        gapPercentage,
        gapAmount,
        currency: args.currency,
        industry: args.industry,
        role: args.role,
        modelUsed: geminiResult.modelUsed,
        promptTokens: geminiResult.promptTokens,
        completionTokens: geminiResult.completionTokens,
      },
      success: true,
      durationMs: Date.now() - startedAt,
      userId: args.userId,
      timestamp: Date.now(),
    })

    return { profileId, benchmarkSalary, gapAmount, gapPercentage }
  },
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPayGapPrompt(args: {
  industry: string
  role: string
  yearsExperience: number
  location: string
  currentSalary: number
  currency: string
}): string {
  return `
You are a compensation benchmarking expert helping a professional woman understand and close her pay gap.

Analyze the following profile and provide a comprehensive pay gap assessment:

- Industry: ${args.industry}
- Role / Job Title: ${args.role}
- Years of Experience: ${args.yearsExperience}
- Location: ${args.location}
- Current Salary: ${args.currency} ${args.currentSalary.toLocaleString()}

Your response MUST include (in this order):

1. **BENCHMARK_SALARY: [number]** on its own line in this exact format (the key "BENCHMARK_SALARY" must remain in English regardless of the response language), representing the estimated market median salary in ${args.currency} for this role, industry, experience level, and location. Example: BENCHMARK_SALARY: 95000
   Framing: state clearly that this is an estimate based on aggregated public labor-market statistics and that actual rates vary. Cite the category of source (e.g. "aggregated public labor-market data from government statistical agencies and industry surveys") without naming a specific proprietary dataset.

2. A clear, factual explanation of the pay gap (if any), grounded in public labor-market statistics for the role and location. Use estimate language: "data suggests", "public statistics indicate", rather than absolute claims.

3. 3 to 5 specific, actionable negotiation strategies the user can use to close the gap. Make them concrete and role-specific where possible.

4. A motivating, empowering closing paragraph that acknowledges this person's value and encourages them to advocate for fair pay.

Use clear, direct language. Avoid jargon. Write for someone who may be reading this for the first time. Do not use em dashes; use commas, colons, or parentheses instead.
`.trim()
}

/**
 * Extract BENCHMARK_SALARY from Gemini response.
 * If not parseable, fall back to current salary * 1.15 as a rough estimate.
 */
function parseBenchmarkSalary(text: string, currentSalary: number): number {
  const match = text.match(/BENCHMARK_SALARY:\s*(\d[\d,]*)/i)
  if (match) {
    const parsed = parseInt(match[1].replace(/,/g, ''), 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return Math.round(currentSalary * 1.15)
}
