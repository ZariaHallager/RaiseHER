/**
 * Customer Support Agent
 *
 * Runs every 4 hours. Scans open supportMessages, drafts a response for each
 * via Gemini, and patches the message record with the draft + status
 * 'in_progress'. Logs every run to agentActivityLog.
 *
 * EXTERNAL CREDENTIALS REQUIRED FOR REAL SIDE EFFECTS:
 *   - Email delivery (e.g. SendGrid, Resend, Postmark): set
 *       SUPPORT_EMAIL_API_KEY  and  SUPPORT_FROM_EMAIL  in Convex env vars.
 *     Without these, drafts are written to the DB but NOT sent.
 *   - Intercom / Zendesk / Help-Scout integration: set
 *       HELPDESK_API_KEY  and  HELPDESK_BASE_URL  in Convex env vars.
 *
 * Agent runs from day one and accumulates real draft history.
 */
import { internalAction, internalMutation, internalQuery } from '../_generated/server'
import { internal } from '../_generated/api'
import { generateNativeContent } from '../lib/gemini'
import { v } from 'convex/values'

const BATCH_SIZE = 10

function buildSupportPrompt(subject: string, body: string): string {
  return `
You are the Customer Support Agent for RaiseHER, an app that helps women close the pay gap and advocate for fair compensation.

A user has submitted the following support message. Write a warm, clear, and helpful response.

SUBJECT: ${subject}

MESSAGE:
${body}

Guidelines:
- Acknowledge their concern in the first sentence
- Provide a direct, actionable answer or a clear next step
- Keep the tone empowering and professional, never condescending
- If you need more information to fully resolve the issue, ask one focused question
- Keep the response under 150 words
- Do NOT use em dashes

OUTPUT FORMAT:
RESPONSE:
[Your drafted response here]
`.trim()
}

export const run = internalAction({
  handler: async (ctx) => {
    const startedAt = Date.now()
    try {
      const openMessages = await ctx.runQuery(internal.agents.support.fetchOpenMessages, {
        limit: BATCH_SIZE,
      })

      if (openMessages.length === 0) {
        await ctx.runMutation(internal.agentActivityLog.logActivity, {
          agentName: 'support',
          action: 'scan_messages',
          summary: 'Support agent: no open messages found.',
          metadata: { messagesProcessed: 0 },
          success: true,
          durationMs: Date.now() - startedAt,
          timestamp: Date.now(),
        })
        return
      }

      let processed = 0
      let failed = 0

      for (const msg of openMessages) {
        try {
          const prompt = buildSupportPrompt(msg.subject, msg.body)
          const result = await generateNativeContent(prompt, 'en')

          await ctx.runMutation(internal.agents.support.patchMessageWithDraft, {
            messageId: msg._id,
            draft: result.text,
          })

          processed++
        } catch {
          failed++
        }
      }

      await ctx.runMutation(internal.agentActivityLog.logActivity, {
        agentName: 'support',
        action: 'draft_responses',
        summary: `Support agent drafted responses for ${processed} message(s). ${failed > 0 ? `${failed} failed.` : ''}`.trim(),
        metadata: {
          messagesProcessed: processed,
          messagesFailed: failed,
          batchSize: openMessages.length,
          // NOTE: real email delivery requires SUPPORT_EMAIL_API_KEY + SUPPORT_FROM_EMAIL env vars
          emailDeliveryEnabled: Boolean(process.env.SUPPORT_EMAIL_API_KEY),
          helpdeskEnabled: Boolean(process.env.HELPDESK_API_KEY),
        },
        success: failed === 0,
        durationMs: Date.now() - startedAt,
        timestamp: Date.now(),
      })
    } catch (error) {
      await ctx.runMutation(internal.agentActivityLog.logActivity, {
        agentName: 'support',
        action: 'draft_responses',
        summary: 'Support agent encountered an error.',
        success: false,
        errorMessage: String(error),
        durationMs: Date.now() - startedAt,
        timestamp: Date.now(),
      })
    }
  },
})

export const fetchOpenMessages = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    return await ctx.db
      .query('supportMessages')
      .withIndex('by_status', (q) => q.eq('status', 'open'))
      .order('asc')
      .take(limit)
  },
})

export const patchMessageWithDraft = internalMutation({
  args: {
    messageId: v.id('supportMessages'),
    draft: v.string(),
  },
  handler: async (ctx, { messageId, draft }) => {
    await ctx.db.patch(messageId, {
      agentResponseDraft: draft,
      status: 'in_progress',
      updatedAt: Date.now(),
    })
  },
})
