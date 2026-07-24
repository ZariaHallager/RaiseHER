'use client'

/**
 * PayGapResult
 *
 * Reactive display of the user's most recent pay-gap analysis.
 *
 * States:
 *   loading: analysis queued but AI has not responded yet
 *   error: 90 seconds elapsed with no result (user can retry)
 *   success: profile is available, shows count-up numbers and AI analysis
 *
 * Accessibility:
 *   - Loading status announced via aria-live="polite" + aria-busy
 *   - Count-up animation respects prefers-reduced-motion (skips to final value)
 *   - Gap numbers announced as text (screen readers get the final value via
 *     the element's text content, not the animated intermediate values;
 *     aria-label on the number cells carries the final formatted value)
 *   - AI analysis section announced via aria-live="polite" on reveal
 */

import { useEffect, useState, useRef } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { LOCALE_BCP47, type SupportedLocale } from '@/i18n/routing'
import { formatCurrency, formatPercent } from '@/lib/currency'
import { AIMark } from '@/components/ui/AIMark'
import { Button } from '@/components/ui/Button'

// ---------------------------------------------------------------------------
// Count-up hook
// ---------------------------------------------------------------------------

function useCountUp(target: number, durationMs = 1400): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setValue(target)
      return
    }

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (prefersReducedMotion) {
      setValue(target)
      return
    }

    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      // Ease-out quartic
      const eased = 1 - Math.pow(1 - progress, 4)
      setValue(Math.round(target * eased))
      if (progress < 1) {
        requestAnimationFrame(tick)
      }
    }

    const rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [target, durationMs])

  return value
}

// ---------------------------------------------------------------------------
// Stat card with count-up
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string
  rawValue: number
  formattedFinal: string
  currency: string
  locale: string
  delayMs?: number
}

function StatCard({ label, rawValue, formattedFinal, currency, locale, delayMs = 0 }: StatCardProps) {
  const [ready, setReady] = useState(delayMs === 0)
  const animated = useCountUp(ready ? rawValue : 0)

  useEffect(() => {
    if (delayMs === 0) return
    const t = setTimeout(() => setReady(true), delayMs)
    return () => clearTimeout(t)
  }, [delayMs])

  const formatted = ready
    ? formatCurrency(animated, currency, locale)
    : formatCurrency(0, currency, locale)

  return (
    <div className="flex flex-col gap-1 p-4 bg-surface rounded-lg border border-border text-center">
      <p className="text-caption text-ink-muted">{label}</p>
      <p
        aria-label={formattedFinal}
        className="text-headline font-display font-bold text-ink tabular-nums"
      >
        {formatted}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Gap percentage with count-up
// ---------------------------------------------------------------------------

function GapPercent({ value, locale }: { value: number; locale: string }) {
  const animated = useCountUp(value, 1200)
  const final = formatPercent(value, locale)

  return (
    <span aria-label={final} className="tabular-nums">
      {formatPercent(animated, locale)}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 90_000

interface PayGapResultProps {
  isNew: boolean
}

export function PayGapResult({ isNew }: PayGapResultProps) {
  const tp = useTranslations('paygap')
  const locale = useLocale() as SupportedLocale
  const bcp47 = LOCALE_BCP47[locale]
  const router = useRouter()

  const profiles = useQuery(api.payGap.getPayGapProfiles, { limit: 1 })
  const createScenario = useMutation(api.payGap.createScenarioFromPayGap)

  const [timedOut, setTimedOut] = useState(false)
  const [isCreatingScenario, setIsCreatingScenario] = useState(false)
  const submittedAtRef = useRef<number>(Date.now())

  // Timeout: if analysis hasn't appeared within TIMEOUT_MS, show error state
  useEffect(() => {
    if (!isNew) return
    if (profiles && profiles.length > 0) return
    const t = setTimeout(() => setTimedOut(true), TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [isNew, profiles])

  const profile = profiles?.[0] ?? null

  const isLoading = isNew && !profile && !timedOut
  const isError = timedOut && !profile

  async function handleBuildPlan() {
    if (!profile) return
    setIsCreatingScenario(true)
    try {
      await createScenario({ payGapProfileId: profile._id })
      router.push('/rehearsal')
    } catch {
      setIsCreatingScenario(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="flex flex-col items-center gap-6 py-16 text-center px-4"
      >
        {/* Spinner */}
        <span
          aria-hidden="true"
          className="inline-block w-10 h-10 border-4 border-border border-t-accent rounded-full animate-spin"
        />
        <div>
          <p className="text-subhead font-semibold text-ink mb-2">
            {tp('loading_analysis')}
          </p>
          <p className="text-body text-ink-soft max-w-sm">
            {tp('loading_detail')}
          </p>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Error / timeout state
  // ---------------------------------------------------------------------------

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center px-4" role="alert">
        <p className="text-subhead font-semibold text-ink">
          {tp('result_error_title')}
        </p>
        <p className="text-body text-ink-soft max-w-sm">
          {tp('result_error_body')}
        </p>
        <div className="flex gap-3 mt-2">
          <Button
            label={tp('result_error_retry')}
            onClick={() => {
              setTimedOut(false)
              submittedAtRef.current = Date.now()
            }}
            variant="primary"
          />
          <Button
            label={tp('result_go_back')}
            onClick={() => router.push('/pay-gap')}
            variant="secondary"
          />
        </div>
      </div>
    )
  }

  // No profile and not in "new" mode: prompt user to fill the form.

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center px-4">
        <p className="text-subhead font-semibold text-ink">
          {tp('recalculate')}
        </p>
        <Button
          label={tp('submit')}
          onClick={() => router.push('/pay-gap')}
          variant="primary"
        />
      </div>
    )
  }

  // Success: show the result.

  const gapAmount = Math.max(0, profile.gapAmount)
  const hasGap = gapAmount > 0

  return (
    <article aria-live="polite" className="flex flex-col gap-8 max-w-lg mx-auto">
      {/* Title */}
      <header>
        <h1 className="text-headline font-display font-bold text-ink mb-1">
          {tp('result_title')}
        </h1>
        <p className="text-caption text-ink-muted">
          {tp('result_subtitle')}
        </p>
      </header>

      {/* Key numbers */}
      <section aria-label={tp('benchmark_label')} className="grid grid-cols-2 gap-3">
        <StatCard
          label={tp('current_salary_label')}
          rawValue={profile.currentSalary}
          formattedFinal={formatCurrency(profile.currentSalary, profile.currency, bcp47)}
          currency={profile.currency}
          locale={bcp47}
          delayMs={0}
        />
        <StatCard
          label={tp('benchmark_label')}
          rawValue={profile.benchmarkSalary}
          formattedFinal={formatCurrency(profile.benchmarkSalary, profile.currency, bcp47)}
          currency={profile.currency}
          locale={bcp47}
          delayMs={200}
        />
        {hasGap && (
          <StatCard
            label={tp('gap_label')}
            rawValue={gapAmount}
            formattedFinal={formatCurrency(gapAmount, profile.currency, bcp47)}
            currency={profile.currency}
            locale={bcp47}
            delayMs={400}
          />
        )}
        {hasGap && (
          <div className="flex flex-col gap-1 p-4 bg-accent-light rounded-lg border border-accent-deep text-center">
            <p className="text-caption text-ink-muted">{tp('gap_pct_label')}</p>
            <p className="text-headline font-display font-bold text-ink">
              <GapPercent value={profile.gapPercentage} locale={bcp47} />
            </p>
          </div>
        )}
      </section>

      {/* Estimate framing */}
      <p className="text-caption text-ink-muted">
        {tp('estimate_framing')}
      </p>

      {/* AI analysis */}
      <section
        aria-labelledby="ai-analysis-heading"
        className="rounded-lg border border-border bg-surface p-5 flex flex-col gap-3"
      >
        <div className="flex items-center gap-2">
          <h2 id="ai-analysis-heading" className="text-subhead font-semibold text-ink">
            {tp('ai_analysis_label')}
          </h2>
          <AIMark />
        </div>
        <div className="text-body text-ink-soft whitespace-pre-wrap">
          {/* Strip the machine-readable BENCHMARK_SALARY line before display */}
          {profile.aiAnalysis.replace(/BENCHMARK_SALARY:\s*\d[\d,]*/gi, '').trim()}
        </div>
      </section>

      {/* Source citation */}
      <p className="text-caption text-ink-muted">
        {tp('gap_source')}
      </p>

      {/* Disclosure */}
      <p className="text-caption text-ink-muted border-t border-border pt-4">
        {tp('disclosure')}
      </p>

      {/* CTA */}
      <div className="flex flex-col gap-3">
        <Button
          label={isCreatingScenario ? tp('quick_start_creating') : tp('quick_start_cta')}
          loading={isCreatingScenario}
          onClick={handleBuildPlan}
          variant="primary"
          className="w-full"
        />
        <Button
          label={tp('recalculate')}
          onClick={() => router.push('/pay-gap')}
          variant="secondary"
          className="w-full"
        />
      </div>
    </article>
  )
}
