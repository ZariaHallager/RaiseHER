/**
 * Customer Acquisition & Outreach Agent
 *
 * Runs weekly. Drafts outreach sequences and prospecting content via Gemini.
 * EXTERNAL CREDENTIALS REQUIRED FOR REAL SIDE EFFECTS:
 *   - Email delivery: set  OUTREACH_EMAIL_API_KEY  and  OUTREACH_FROM_EMAIL  in Convex env vars.
 *   - LinkedIn outreach: set  LINKEDIN_OUTREACH_TOKEN  in Convex env vars.
 *
 * Without these keys, drafts are written to agentActivityLog only.
 * Real email/LinkedIn sends require API keys set in Convex env vars.
 */
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'
import { generateNativeContent } from '../lib/gemini'

const OUTREACH_PROMPT = `
You are the Acquisition Agent for RaiseHER, an app helping women close the pay gap.

Draft a short outreach sequence for this week. The target audience is professional women
who have not yet signed up but may be interested in understanding and closing their pay gap.

Output exactly this structure:

EMAIL SUBJECT: [compelling subject line, max 60 characters]

EMAIL BODY:
[3–4 short paragraphs. Warm, direct, data-informed. No spam words. Clear CTA to try RaiseHER free.]

LINKEDIN MESSAGE:
[1–2 sentences. Conversational. Reference a shared context (e.g., women in tech, salary transparency). Max 300 characters.]

FOLLOW-UP NOTE (send 3 days later if no reply):
[1 sentence. Gentle and respectful. Max 200 characters.]
`.trim()

export const run = internalAction({
  handler: async (ctx) => {
    const startedAt = Date.now()
    try {
      const result = await generateNativeContent(OUTREACH_PROMPT, 'en')

      await ctx.runMutation(internal.agentActivityLog.logActivity, {
        agentName: 'acquisition',
        action: 'draft_outreach',
        summary: `Acquisition agent drafted weekly outreach sequence.`,
        metadata: {
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
        agentName: 'acquisition',
        action: 'draft_outreach',
        summary: 'Acquisition agent encountered an error.',
        success: false,
        errorMessage: String(error),
        durationMs: Date.now() - startedAt,
        timestamp: Date.now(),
      })
    }
  },
})
