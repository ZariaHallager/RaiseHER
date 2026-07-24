/**
 * Growth & Content Agent
 *
 * Runs daily. Uses Gemini to draft social posts, blog outlines, and
 * engagement content. Writes output to agentActivityLog.
 *
 * EXTERNAL CREDENTIALS REQUIRED FOR REAL SIDE EFFECTS:
 *   - Twitter/X posting: set  TWITTER_BEARER_TOKEN  in Convex env vars.
 *   - LinkedIn posting:  set  LINKEDIN_ACCESS_TOKEN  in Convex env vars.
 *   - Instagram posting: set  INSTAGRAM_API_KEY      in Convex env vars.
 *
 * Without these keys, drafts are written to agentActivityLog only.
 * Agent runs from day one and accumulates real history.
 */
import { internalAction } from '../_generated/server'
import { internal } from '../_generated/api'
import { generateNativeContent } from '../lib/gemini'

const CONTENT_PROMPT = `
You are a content strategist for RaiseHER, an app that helps women close the pay gap and advocate for fair compensation.

Draft one piece of content for today. Choose one of the following formats:
- A short, punchy social media post (LinkedIn or Instagram, 150–280 characters)
- A blog post outline (title + 5 section headings)
- An engagement question to post in a community

The content must be:
- Empowering and grounded in data
- Free of clichés and motivational fluff
- Relevant to women navigating salary negotiations, promotions, or workplace equity

Output format:
FORMAT: [Social Post | Blog Outline | Community Question]
CONTENT:
[Your drafted content here]
`.trim()

export const run = internalAction({
  handler: async (ctx) => {
    const startedAt = Date.now()
    try {
      const result = await generateNativeContent(CONTENT_PROMPT, 'en')

      await ctx.runMutation(internal.agentActivityLog.logActivity, {
        agentName: 'growth',
        action: 'draft_content',
        summary: `Growth agent drafted content. Tokens: ${(result.promptTokens ?? 0) + (result.completionTokens ?? 0)}.`,
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
        agentName: 'growth',
        action: 'draft_content',
        summary: 'Growth agent encountered an error.',
        success: false,
        errorMessage: String(error),
        durationMs: Date.now() - startedAt,
        timestamp: Date.now(),
      })
    }
  },
})
