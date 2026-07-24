'use client'

/**
 * WinForm
 *
 * Add or edit a win. Rendered inside a Dialog.
 *
 * AI Polish flow:
 *   1. User writes a raw description and clicks "Polish with AI".
 *   2. The rewriteWin action runs against Gemini.
 *   3. If the description has enough detail, Gemini returns a polished rewrite
 *      with impact and suggested tags. The user can "Use This" or "Keep Mine".
 *   4. If the description is too vague, Gemini returns follow-up questions.
 *      The user answers in a textarea and clicks "Try Again" to retry.
 *
 * Accessibility:
 *   - Error summary at the top of the form, focused on failed submit.
 *   - All fields have aria-invalid + aria-describedby wired to inline errors.
 *   - Live region announces AI polish status.
 */

import { useState, useRef, useId } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useMutation, useAction } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { TextField } from '@/components/ui/TextField'
import { Button } from '@/components/ui/Button'
import { LOCALE_BCP47, type SupportedLocale } from '@/i18n/routing'
import type { WinRewriteResult } from '@convex/winsAction'

// ---------------------------------------------------------------------------
// Currency list (reused from IntakeForm)
// ---------------------------------------------------------------------------
const CURRENCIES = [
  { code: 'USD', label: 'USD' },
  { code: 'EUR', label: 'EUR' },
  { code: 'GBP', label: 'GBP' },
  { code: 'CAD', label: 'CAD' },
  { code: 'AUD', label: 'AUD' },
  { code: 'BRL', label: 'BRL' },
  { code: 'MXN', label: 'MXN' },
  { code: 'ZAR', label: 'ZAR' },
  { code: 'NGN', label: 'NGN' },
  { code: 'KES', label: 'KES' },
  { code: 'GHS', label: 'GHS' },
  { code: 'CHF', label: 'CHF' },
  { code: 'JPY', label: 'JPY' },
  { code: 'SGD', label: 'SGD' },
] as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Win = {
  _id: Id<'wins'>
  description: string
  impact?: string
  estimatedValue?: number
  currency?: string
  date: number
  tags?: string[]
}

interface WinFormProps {
  editingWin: Win | null
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toDateInput(ms: number): string {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayInput(): string {
  return toDateInput(Date.now())
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function WinForm({ editingWin, onClose }: WinFormProps) {
  const t = useTranslations('wins')
  const tc = useTranslations('common')
  const locale = useLocale() as SupportedLocale

  const addWin = useMutation(api.wins.addWin)
  const updateWin = useMutation(api.wins.updateWin)
  const rewriteWin = useAction(api.winsAction.rewriteWin)

  const summaryRef = useRef<HTMLDivElement>(null)
  const currencySelectId = useId()

  // ── Form field state ──────────────────────────────────────────────────────
  const [description, setDescription] = useState(editingWin?.description ?? '')
  const [impact, setImpact] = useState(editingWin?.impact ?? '')
  const [dateInput, setDateInput] = useState(
    editingWin ? toDateInput(editingWin.date) : todayInput()
  )
  const [estimatedValue, setEstimatedValue] = useState(
    editingWin?.estimatedValue ? String(editingWin.estimatedValue) : ''
  )
  const [currency, setCurrency] = useState(editingWin?.currency ?? 'USD')
  const [tags, setTags] = useState<string[]>(editingWin?.tags ?? [])
  const [tagInput, setTagInput] = useState('')

  // ── Validation state ──────────────────────────────────────────────────────
  const [descError, setDescError] = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── AI Polish state ───────────────────────────────────────────────────────
  type PolishState =
    | { phase: 'idle' }
    | { phase: 'loading' }
    | { phase: 'rewrite'; result: Extract<WinRewriteResult, { type: 'rewrite' }> }
    | { phase: 'followup'; questions: string[] }
    | { phase: 'error' }

  const [polish, setPolish] = useState<PolishState>({ phase: 'idle' })
  const [followupAnswer, setFollowupAnswer] = useState('')

  // ── Tag helpers ───────────────────────────────────────────────────────────
  function addTag() {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag])
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validate(): boolean {
    let valid = true
    if (!description.trim()) {
      setDescError(tc('field_required'))
      valid = false
    } else {
      setDescError(null)
    }
    if (!dateInput) {
      setDateError(tc('field_required'))
      valid = false
    } else {
      setDateError(null)
    }
    return valid
  }

  // ── AI Polish ─────────────────────────────────────────────────────────────
  async function handlePolish() {
    if (!description.trim()) {
      setDescError(tc('field_required'))
      return
    }

    const rawText =
      polish.phase === 'followup' && followupAnswer.trim()
        ? `${description.trim()}\n\nAdditional context: ${followupAnswer.trim()}`
        : description.trim()

    setPolish({ phase: 'loading' })
    try {
      const result = await rewriteWin({
        rawDescription: rawText,
        targetLanguage: LOCALE_BCP47[locale],
      })

      if (result.type === 'followup') {
        setPolish({ phase: 'followup', questions: result.questions })
      } else {
        setPolish({ phase: 'rewrite', result })
      }
    } catch {
      setPolish({ phase: 'error' })
    }
  }

  function applyPolish() {
    if (polish.phase !== 'rewrite') return
    setDescription(polish.result.polished)
    if (polish.result.impact) setImpact(polish.result.impact)
    if (polish.result.suggestedTags.length > 0) {
      setTags((prev) => {
        const merged = [...prev]
        polish.result.suggestedTags.forEach((tag) => {
          if (!merged.includes(tag)) merged.push(tag)
        })
        return merged
      })
    }
    setPolish({ phase: 'idle' })
  }

  function discardPolish() {
    setPolish({ phase: 'idle' })
    setFollowupAnswer('')
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setShowSummary(true)
    setSubmitError(null)

    if (!validate()) {
      setTimeout(() => summaryRef.current?.focus(), 50)
      return
    }

    setIsSubmitting(true)
    try {
      const dateMs = new Date(dateInput).getTime()
      const valueNum = estimatedValue ? Number(estimatedValue) : undefined

      if (editingWin) {
        await updateWin({
          winId: editingWin._id,
          description: description.trim(),
          impact: impact.trim() || undefined,
          estimatedValue: valueNum,
          currency: valueNum ? currency : undefined,
          date: dateMs,
          tags: tags.length ? tags : undefined,
        })
      } else {
        await addWin({
          description: description.trim(),
          impact: impact.trim() || undefined,
          estimatedValue: valueNum,
          currency: valueNum ? currency : undefined,
          date: dateMs,
          tags: tags.length ? tags : undefined,
        })
      }
      onClose()
    } catch {
      setSubmitError(tc('error_generic'))
      setIsSubmitting(false)
    }
  }

  const errors = [descError, dateError].filter(Boolean) as string[]

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Title */}
      <h2
        id="win-form-title"
        className="text-subhead font-display font-bold text-ink"
      >
        {editingWin ? t('edit_win') : t('add_win')}
      </h2>

      {/* Error summary */}
      {showSummary && errors.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-error bg-error-light px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep"
        >
          <ul className="list-disc list-inside space-y-0.5">
            {errors.map((msg, i) => (
              <li key={i} className="text-caption text-error">
                {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Description */}
      <div className="flex flex-col gap-1">
        <label className="text-label font-semibold tracking-wide text-ink-soft">
          {t('win_description_label')}
        </label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            if (e.target.value.trim()) setDescError(null)
          }}
          placeholder={t('win_description_placeholder')}
          rows={3}
          aria-invalid={descError ? 'true' : undefined}
          aria-describedby={descError ? 'desc-error' : undefined}
          required
          className={[
            'text-body bg-surface text-ink',
            'border-[1.5px] rounded-lg px-4 py-3',
            'placeholder:text-ink-muted resize-y',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep',
            descError ? 'border-error' : 'border-border',
          ].join(' ')}
        />
        {descError && (
          <p id="desc-error" role="alert" className="text-caption text-error">
            {descError}
          </p>
        )}
      </div>

      {/* AI Polish controls */}
      <div className="bg-surface-subtle rounded-lg p-4 flex flex-col gap-3">
        {/* Idle: just the button */}
        {polish.phase === 'idle' && (
          <Button
            label={t('ai_polish_btn')}
            variant="secondary"
            onClick={handlePolish}
            type="button"
            className="self-start text-caption py-2 px-4"
          />
        )}

        {/* Loading */}
        {polish.phase === 'loading' && (
          <p
            aria-live="polite"
            aria-busy="true"
            className="text-caption text-ink-soft"
          >
            {t('ai_polish_loading')}
          </p>
        )}

        {/* Error */}
        {polish.phase === 'error' && (
          <div className="flex items-center gap-3">
            <p role="alert" className="text-caption text-error flex-1">
              {t('ai_polish_error')}
            </p>
            <Button
              label={t('followup_retry')}
              variant="secondary"
              onClick={handlePolish}
              type="button"
              className="text-caption py-2 px-3"
            />
          </div>
        )}

        {/* Follow-up questions */}
        {polish.phase === 'followup' && (
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-caption font-semibold text-ink mb-1">
                {t('followup_title')}
              </p>
              <p className="text-caption text-ink-soft mb-2">
                {t('followup_subtitle')}
              </p>
              <ul className="list-disc list-inside space-y-1 mb-3">
                {polish.questions.map((q, i) => (
                  <li key={i} className="text-caption text-ink">
                    {q}
                  </li>
                ))}
              </ul>
            </div>
            <textarea
              value={followupAnswer}
              onChange={(e) => setFollowupAnswer(e.target.value)}
              placeholder={t('followup_input_placeholder')}
              rows={3}
              className="text-body bg-surface text-ink border-[1.5px] border-border rounded-lg px-4 py-3 placeholder:text-ink-muted resize-y focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep"
            />
            <div className="flex gap-2">
              <Button
                label={t('followup_retry')}
                onClick={handlePolish}
                type="button"
                className="text-caption py-2 px-4"
              />
              <Button
                label={t('ai_polish_keep_mine')}
                variant="ghost"
                onClick={discardPolish}
                type="button"
                className="text-caption py-2 px-3"
              />
            </div>
          </div>
        )}

        {/* Rewrite result */}
        {polish.phase === 'rewrite' && (
          <div className="flex flex-col gap-3">
            <p className="text-caption font-semibold text-ink">
              {t('ai_polish_title')}
            </p>
            <p className="text-caption text-ink-soft mb-1">
              {t('ai_polish_subtitle')}
            </p>

            <div className="flex flex-col gap-1">
              <p className="text-label font-semibold text-ink-soft">
                {t('ai_polish_polished_label')}
              </p>
              <p className="text-body text-ink bg-surface rounded-lg px-3 py-2">
                {polish.result.polished}
              </p>
            </div>

            {polish.result.impact && (
              <div className="flex flex-col gap-1">
                <p className="text-label font-semibold text-ink-soft">
                  {t('ai_polish_impact_label')}
                </p>
                <p className="text-body text-ink bg-surface rounded-lg px-3 py-2">
                  {polish.result.impact}
                </p>
              </div>
            )}

            {polish.result.suggestedTags.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-label font-semibold text-ink-soft">
                  {t('ai_polish_tags_label')}
                </p>
                <div className="flex flex-wrap gap-1">
                  {polish.result.suggestedTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-label px-2 py-0.5 rounded-sm bg-surface text-ink-soft border border-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                label={t('ai_polish_use_this')}
                onClick={applyPolish}
                type="button"
                className="text-caption py-2 px-4"
              />
              <Button
                label={t('ai_polish_keep_mine')}
                variant="secondary"
                onClick={discardPolish}
                type="button"
                className="text-caption py-2 px-3"
              />
            </div>
          </div>
        )}
      </div>

      {/* Impact */}
      <TextField
        label={t('win_impact_label')}
        placeholder={t('win_impact_placeholder')}
        value={impact}
        onChange={(e) => setImpact(e.target.value)}
      />

      {/* Date */}
      <div className="flex flex-col gap-1">
        <label className="text-label font-semibold tracking-wide text-ink-soft">
          {t('win_date_label')}
        </label>
        <input
          type="date"
          value={dateInput}
          onChange={(e) => {
            setDateInput(e.target.value)
            if (e.target.value) setDateError(null)
          }}
          aria-invalid={dateError ? 'true' : undefined}
          aria-describedby={dateError ? 'date-error' : undefined}
          required
          className={[
            'text-body bg-surface text-ink',
            'border-[1.5px] rounded-lg px-4 py-3',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep',
            dateError ? 'border-error' : 'border-border',
          ].join(' ')}
        />
        {dateError && (
          <p id="date-error" role="alert" className="text-caption text-error">
            {dateError}
          </p>
        )}
      </div>

      {/* Estimated value + currency */}
      <div className="flex gap-3">
        <div className="flex-1">
          <TextField
            label={t('win_value_label')}
            type="number"
            inputMode="decimal"
            min="0"
            placeholder={t('win_value_placeholder')}
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1 w-28">
          <label
            htmlFor={currencySelectId}
            className="text-label font-semibold tracking-wide text-ink-soft"
          >
            {t('win_currency_label')}
          </label>
          <select
            id={currencySelectId}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="text-body bg-surface text-ink border-[1.5px] border-border rounded-lg px-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-2">
        <label className="text-label font-semibold tracking-wide text-ink-soft">
          {t('win_tags_label')}
        </label>
        {/* Existing tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1" role="list" aria-label="Tags">
            {tags.map((tag) => (
              <span
                key={tag}
                role="listitem"
                className="inline-flex items-center gap-1 text-label px-2 py-0.5 rounded-sm bg-surface-subtle text-ink-soft border border-border"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag: ${tag}`}
                  className="text-ink-muted hover:text-error focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-deep rounded-sm leading-none"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
        {/* Tag input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
            placeholder={t('win_tags_placeholder')}
            className="flex-1 text-body bg-surface text-ink border-[1.5px] border-border rounded-lg px-4 py-2 placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep text-caption"
          />
          <button
            type="button"
            onClick={addTag}
            className="text-caption font-semibold px-3 py-2 rounded-lg border-[1.5px] border-ink text-ink hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep transition-colors"
          >
            {t('win_tags_add')}
          </button>
        </div>
      </div>

      {/* Submit error */}
      {submitError && (
        <p role="alert" className="text-caption text-error">
          {submitError}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        <Button
          label={tc('cancel')}
          variant="secondary"
          onClick={onClose}
          type="button"
          disabled={isSubmitting}
          className="py-3"
        />
        <Button
          label={isSubmitting ? tc('loading') : t('save')}
          type="submit"
          loading={isSubmitting}
          className="py-3"
        />
      </div>
    </form>
  )
}
