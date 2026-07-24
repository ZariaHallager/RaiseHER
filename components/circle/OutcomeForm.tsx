'use client'

/**
 * OutcomeForm
 *
 * Lets a user report (or update) their raise / promotion outcome.
 * No free-text narrative: structured fields only, keeping the aggregate
 * data clean and protecting user anonymity.
 *
 * Accessibility:
 *   - Error summary receives focus on failed submit.
 *   - All fields have visible labels.
 *   - aria-invalid + aria-describedby wire inline errors.
 */

import { useState, useId, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Button } from '@/components/ui/Button'

const OUTCOME_TYPES = ['raise', 'promotion', 'new_job', 'other'] as const
type OutcomeType = (typeof OUTCOME_TYPES)[number]

const COMMON_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'BRL', 'MXN',
  'COP', 'CLP', 'PEN', 'CHF', 'ZAR', 'INR', 'SGD',
]

interface Props {
  /** Existing outcome, pre-fills the form for editing. */
  existing?: {
    outcomeType: string
    raiseAmount?: number | null
    currency?: string | null
  } | null
  onSuccess?: () => void
}

export function OutcomeForm({ existing, onSuccess }: Props) {
  const t = useTranslations('circle')
  const reportOutcome = useMutation(api.circle.reportOutcome)
  const deleteOutcome = useMutation(api.circle.deleteOutcome)

  const [outcomeType, setOutcomeType] = useState<OutcomeType>(
    (existing?.outcomeType as OutcomeType) ?? 'raise',
  )
  const [raiseAmount, setRaiseAmount] = useState(
    existing?.raiseAmount != null ? String(existing.raiseAmount) : '',
  )
  const [currency, setCurrency] = useState(existing?.currency ?? 'USD')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [amountError, setAmountError] = useState<string | null>(null)

  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const amountId = useId()
  const currencyId = useId()
  const amountErrorId = useId()

  const amountRequired = outcomeType === 'raise' || outcomeType === 'new_job'

  function validate(): boolean {
    setAmountError(null)
    if (amountRequired && raiseAmount.trim() === '') {
      setAmountError(t('amount_required'))
      return false
    }
    if (raiseAmount.trim() !== '') {
      const parsed = parseFloat(raiseAmount)
      if (isNaN(parsed) || parsed <= 0) {
        setAmountError(t('amount_invalid'))
        return false
      }
    }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) {
      errorSummaryRef.current?.focus()
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const parsedAmount =
        raiseAmount.trim() !== '' ? parseFloat(raiseAmount) : undefined
      await reportOutcome({
        outcomeType,
        raiseAmount: parsedAmount,
        currency: parsedAmount != null ? currency : undefined,
      })
      onSuccess?.()
    } catch {
      setError(t('submit_error'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await deleteOutcome({})
      onSuccess?.()
    } catch {
      setError(t('delete_error'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Error summary */}
      {(error || amountError) && (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-lg border border-error bg-error/10 px-4 py-3 text-body text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
        >
          {error ?? amountError}
        </div>
      )}

      {/* Outcome type */}
      <fieldset>
        <legend className="text-label font-semibold text-ink-soft mb-2">
          {t('outcome_type_label')}
        </legend>
        <div className="flex flex-wrap gap-2">
          {OUTCOME_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="outcomeType"
                value={type}
                checked={outcomeType === type}
                onChange={() => setOutcomeType(type)}
                className="accent-accent-deep"
              />
              <span className="text-body text-ink">{t(`outcome_type_${type}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Amount */}
      <div className="flex flex-col gap-1">
        <label htmlFor={amountId} className="text-label font-semibold text-ink-soft">
          {t('amount_label')}
          {!amountRequired && (
            <span className="ml-1 font-normal text-ink-muted">({t('optional')})</span>
          )}
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              id={amountId}
              type="number"
              min="0"
              step="1"
              placeholder={t('amount_placeholder')}
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(e.target.value)}
              required={amountRequired}
              aria-describedby={amountError ? amountErrorId : undefined}
              className={[
                'w-full text-body bg-surface text-ink border-[1.5px] rounded-lg px-4 py-3',
                'placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep',
                amountError ? 'border-error' : 'border-border',
              ].join(' ')}
            />
            {amountError && (
              <p id={amountErrorId} className="mt-1 text-caption text-error">
                {amountError}
              </p>
            )}
          </div>
          <div>
            <label htmlFor={currencyId} className="sr-only">
              {t('currency_label')}
            </label>
            <select
              id={currencyId}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-full text-body bg-surface text-ink border-[1.5px] border-border rounded-lg px-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep"
            >
              {COMMON_CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-caption text-ink-muted">{t('amount_hint')}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          label={submitting ? t('submitting') : existing ? t('update_cta') : t('submit_cta')}
          loading={submitting}
          className="w-full"
        />
        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-caption text-ink-muted underline hover:text-ink self-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep rounded-sm disabled:opacity-50"
          >
            {deleting ? t('deleting') : t('remove_outcome')}
          </button>
        )}
      </div>
    </form>
  )
}
