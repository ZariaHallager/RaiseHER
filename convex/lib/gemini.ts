/**
 * Gemini API helper for Convex actions.
 *
 * All AI content generation in RaiseHER goes through this module.
 * Content is generated NATIVELY in `targetLanguage` — never post-translated.
 *
 * Satisfies the "at least one Google Cloud product" submission requirement;
 * document this explicitly in app store listing and submission materials.
 *
 * Required Convex env var: GEMINI_API_KEY
 */
import { GoogleGenerativeAI, type GenerateContentResult } from '@google/generative-ai'

export const DEFAULT_MODEL = 'gemini-3.5-flash-lite'

export interface GeminiResponse {
  text: string
  modelUsed: string
  promptTokens?: number
  completionTokens?: number
}

/**
 * Core generation helper. Called from Convex internalAction handlers only —
 * never called directly from the client.
 *
 * @param prompt    Full prompt string (include language instruction if needed).
 * @param modelName Gemini model name. Defaults to `gemini-1.5-flash`.
 * @returns         Generated text plus token-usage metadata for logging.
 */
export async function generateWithGemini(
  prompt: string,
  modelName = DEFAULT_MODEL
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY env var is not set in Convex.')
  }

  const client = new GoogleGenerativeAI(apiKey)
  const model = client.getGenerativeModel({ model: modelName })

  const result: GenerateContentResult = await model.generateContent(prompt)
  const response = result.response
  const text = response.text()

  const usage = response.usageMetadata
  return {
    text,
    modelUsed: modelName,
    promptTokens: usage?.promptTokenCount,
    completionTokens: usage?.candidatesTokenCount,
  }
}

/**
 * Build a language-instruction prefix for prompts so Gemini generates content
 * natively in the user's language rather than defaulting to English.
 *
 * Supported locales: 'en' | 'es' | 'fr' | 'pt'
 */
export function languageInstruction(targetLanguage: string): string {
  const labels: Record<string, string> = {
    en: 'English',
    es: 'Spanish (español)',
    fr: 'French (français)',
    pt: 'Portuguese (português)',
  }
  const label = labels[targetLanguage] ?? 'English'
  return `Respond entirely in ${label}. Do not include any text in another language.`
}

/**
 * Convenience wrapper: prepend the language instruction then call Gemini.
 * Use this for all user-facing AI content in RaiseHER.
 */
export async function generateNativeContent(
  prompt: string,
  targetLanguage: string,
  modelName = DEFAULT_MODEL
): Promise<GeminiResponse> {
  const fullPrompt = `${languageInstruction(targetLanguage)}\n\n${prompt}`
  return generateWithGemini(fullPrompt, modelName)
}
