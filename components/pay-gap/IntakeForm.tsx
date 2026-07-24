'use client'

/**
 * PayGap IntakeForm
 *
 * Collects the six inputs needed for the AI pay-gap analysis and calls the
 * requestPayGapAnalysis Convex mutation. On success, redirects to the result
 * page with ?new=1 so the result screen knows an analysis is in flight.
 *
 * Accessibility:
 *   - Error summary appears at the top of the form on failed submit and
 *     receives programmatic focus so screen readers announce it immediately.
 *   - Each field has aria-invalid + aria-describedby wired to its inline error.
 *   - Error messages use role="alert" (live region, announced on change).
 *   - No error is communicated by color alone.
 */

import { useId, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useRouter } from '@/i18n/navigation'
import { LOCALE_BCP47, type SupportedLocale } from '@/i18n/routing'
import { TextField } from '@/components/ui/TextField'
import { Button } from '@/components/ui/Button'

// ---------------------------------------------------------------------------
// Currency list
// ---------------------------------------------------------------------------

const CURRENCIES = [
  { code: 'USD', label: 'USD: US Dollar' },
  { code: 'EUR', label: 'EUR: Euro' },
  { code: 'GBP', label: 'GBP: British Pound' },
  { code: 'CAD', label: 'CAD: Canadian Dollar' },
  { code: 'AUD', label: 'AUD: Australian Dollar' },
  { code: 'NZD', label: 'NZD: New Zealand Dollar' },
  { code: 'CHF', label: 'CHF: Swiss Franc' },
  { code: 'JPY', label: 'JPY: Japanese Yen' },
  { code: 'INR', label: 'INR: Indian Rupee' },
  { code: 'BRL', label: 'BRL: Brazilian Real' },
  { code: 'MXN', label: 'MXN: Mexican Peso' },
  { code: 'ZAR', label: 'ZAR: South African Rand' },
  { code: 'NGN', label: 'NGN: Nigerian Naira' },
  { code: 'KES', label: 'KES: Kenyan Shilling' },
  { code: 'GHS', label: 'GHS: Ghanaian Cedi' },
  { code: 'DKK', label: 'DKK: Danish Krone' },
  { code: 'SEK', label: 'SEK: Swedish Krona' },
  { code: 'NOK', label: 'NOK: Norwegian Krone' },
  { code: 'SGD', label: 'SGD: Singapore Dollar' },
  { code: 'HKD', label: 'HKD: Hong Kong Dollar' },
  { code: 'CNY', label: 'CNY: Chinese Yuan' },
  { code: 'KRW', label: 'KRW: South Korean Won' },
  { code: 'AED', label: 'AED: UAE Dirham' },
  { code: 'SAR', label: 'SAR: Saudi Riyal' },
  { code: 'PKR', label: 'PKR: Pakistani Rupee' },
] as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormValues {
  industry: string
  role: string
  yearsExperience: string
  location: string
  currentSalary: string
  currency: string
}

interface FormErrors {
  industry?: string
  role?: string
  yearsExperience?: string
  location?: string
  currentSalary?: string
  currency?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IntakeForm() {
  const t = useTranslations('onboarding')
  const tp = useTranslations('paygap')
  const tc = useTranslations('common')
  const locale = useLocale() as SupportedLocale
  const router = useRouter()
  const summaryRef = useRef<HTMLDivElement>(null)
  const currencySelectId = useId()

  const requestAnalysis = useMutation(api.payGap.requestPayGapAnalysis)

  const [values, setValues] = useState<FormValues>({
    industry: '',
    role: '',
    yearsExperience: '',
    location: '',
    currentSalary: '',
    currency: 'USD',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  function validate(vals: FormValues): FormErrors {
    const errs: FormErrors = {}

    if (!vals.industry.trim()) errs.industry = tc('field_required')
    if (!vals.role.trim()) errs.role = tc('field_required')

    if (!vals.yearsExperience.trim()) {
      errs.yearsExperience = tc('field_required')
    } else {
      const years = Number(vals.yearsExperience)
      if (!Number.isFinite(years) || years < 0 || years > 60) {
        errs.yearsExperience = tp('years_invalid')
      }
    }

    if (!vals.location.trim()) errs.location = tc('field_required')

    if (!vals.currentSalary.trim()) {
      errs.currentSalary = tc('field_required')
    } else {
      const salary = Number(vals.currentSalary.replace(/,/g, ''))
      if (!Number.isFinite(salary) || salary <= 0) {
        errs.currentSalary = tp('salary_invalid')
      }
    }

    if (!vals.currency) errs.currency = tc('field_required')

    return errs
  }

  function getInlineError(field: keyof FormValues): string | undefined {
    return touched[field] ? errors[field] : undefined
  }

  function handleBlur(field: keyof FormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const errs = validate(values)
    setErrors(errs)
  }

  function handleChange(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
    // Clear the inline error for this field as the user types
    if (touched[field]) {
      const next = { ...values, [field]: value }
      const errs = validate(next)
      setErrors(errs)
    }
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    // Mark all fields touched so inline errors appear
    setTouched({ industry: true, role: true, yearsExperience: true, location: true, currentSalary: true, currency: true })

    const errs = validate(values)
    setErrors(errs)

    if (Object.keys(errs).length > 0) {
      // Focus the error summary for screen-reader announcement
      setTimeout(() => summaryRef.current?.focus(), 50)
      return
    }

    setIsSubmitting(true)
    try {
      const salary = Number(values.currentSalary.replace(/,/g, ''))
      const years = Number(values.yearsExperience)
      const targetLanguage = LOCALE_BCP47[locale]

      await requestAnalysis({
        industry: values.industry.trim(),
        role: values.role.trim(),
        yearsExperience: years,
        location: values.location.trim(),
        currentSalary: salary,
        currency: values.currency,
        targetLanguage,
      })

      router.push('/pay-gap/result?new=1')
    } catch {
      setSubmitError(tc('error_generic'))
      setIsSubmitting(false)
    }
  }

  const errorList = Object.entries(errors)
    .filter(([, msg]) => msg)
    .map(([, msg]) => msg as string)

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5 w-full max-w-md mx-auto"
    >
      {/* Error summary: only shown after a failed submit attempt */}
      {Object.keys(touched).length > 0 && errorList.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-error bg-error-light px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep"
        >
          <p className="text-caption font-semibold text-error mb-2">
            {tp('error_summary_title')}
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {errorList.map((msg, i) => (
              <li key={i} className="text-caption text-error">
                {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Generic server error */}
      {submitError && (
        <div role="alert" className="rounded-lg border border-error bg-error-light px-4 py-3">
          <p className="text-caption text-error">{submitError}</p>
        </div>
      )}

      {/* Industry */}
      <TextField
        label={t('paygap_industry')}
        placeholder="e.g. Technology, Healthcare, Finance"
        value={values.industry}
        onChange={(e) => handleChange('industry', e.target.value)}
        onBlur={() => handleBlur('industry')}
        error={getInlineError('industry')}
        autoComplete="off"
        required
      />

      {/* Role */}
      <TextField
        label={t('paygap_role')}
        placeholder="e.g. Software Engineer, Product Manager"
        value={values.role}
        onChange={(e) => handleChange('role', e.target.value)}
        onBlur={() => handleBlur('role')}
        error={getInlineError('role')}
        autoComplete="organization-title"
        required
      />

      {/* Years of experience */}
      <TextField
        label={t('paygap_years')}
        type="number"
        inputMode="numeric"
        min="0"
        max="60"
        placeholder="e.g. 5"
        value={values.yearsExperience}
        onChange={(e) => handleChange('yearsExperience', e.target.value)}
        onBlur={() => handleBlur('yearsExperience')}
        error={getInlineError('yearsExperience')}
        required
      />

      {/* Location */}
      <TextField
        label={t('paygap_location')}
        placeholder="e.g. New York, London, Lagos"
        value={values.location}
        onChange={(e) => handleChange('location', e.target.value)}
        onBlur={() => handleBlur('location')}
        error={getInlineError('location')}
        autoComplete="address-level2"
        required
      />

      {/* Current salary */}
      <TextField
        label={t('paygap_salary')}
        type="text"
        inputMode="decimal"
        placeholder="e.g. 75000"
        value={values.currentSalary}
        onChange={(e) => handleChange('currentSalary', e.target.value)}
        onBlur={() => handleBlur('currentSalary')}
        error={getInlineError('currentSalary')}
        required
      />

      {/* Currency */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor={currencySelectId}
          className="text-label font-semibold tracking-wide text-ink-soft"
        >
          {t('paygap_currency')}
        </label>
        <select
          id={currencySelectId}
          value={values.currency}
          onChange={(e) => handleChange('currency', e.target.value)}
          onBlur={() => handleBlur('currency')}
          aria-invalid={getInlineError('currency') ? 'true' : undefined}
          aria-describedby={getInlineError('currency') ? `${currencySelectId}-error` : undefined}
          className={[
            'text-body bg-surface text-ink',
            'border-[1.5px] rounded-lg px-4 py-3',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep',
            getInlineError('currency') ? 'border-error' : 'border-border',
          ].join(' ')}
          required
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        {getInlineError('currency') && (
          <p id={`${currencySelectId}-error`} role="alert" className="text-caption text-error">
            {getInlineError('currency')}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        label={isSubmitting ? tp('submitting') : tp('submit')}
        loading={isSubmitting}
        className="w-full mt-2"
      />
    </form>
  )
}
