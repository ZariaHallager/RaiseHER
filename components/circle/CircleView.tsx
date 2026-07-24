'use client'

/**
 * CircleView
 *
 * The full reactive view for The Circle page.
 *
 * Sections:
 *  1. Total Raised odometer (animated, shown only when minimum cohort met).
 *  2. Aggregate stats row (outcome count, average raise). Same threshold.
 *  3. Outcome reporting form (always available, updates the aggregates live).
 *
 * All data is anonymized at the query layer. Individual user records are
 * never returned to the client from the circle queries.
 *
 * Loading / error / empty states are handled explicitly; no bare spinners.
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { TotalRaisedOdometer } from '@/components/circle/TotalRaisedOdometer'
import { OutcomeForm } from '@/components/circle/OutcomeForm'

export function CircleView() {
  const t = useTranslations('circle')
  const stats = useQuery(api.circle.getCircleStats)
  const userOutcome = useQuery(api.circle.getUserOutcome)

  // Track whether the form just succeeded so we can show a confirmation.
  const [submitted, setSubmitted] = useState(false)

  function handleSuccess() {
    setSubmitted(true)
  }

  function handleEdit() {
    setSubmitted(false)
  }

  const loading = stats === undefined || userOutcome === undefined

  if (loading) {
    return (
      <div aria-live="polite" aria-busy="true" className="py-16 text-center">
        <p className="text-body text-ink-soft">{t('loading')}</p>
      </div>
    )
  }

  const hasReported = userOutcome !== null

  return (
    <div className="flex flex-col gap-10">
      {/* ── Community stats ─────────────────────────────────────────────── */}
      {stats ? (
        <section aria-labelledby="circle-stats-heading">
          <h2
            id="circle-stats-heading"
            className="text-label font-semibold text-ink-soft uppercase tracking-wide mb-4"
          >
            {t('stats_heading')}
          </h2>

          {/* Total Raised hero */}
          <div className="rounded-lg bg-surface border border-border px-6 py-8 text-center mb-4">
            <p className="text-caption text-ink-soft mb-2">{t('total_raised_label')}</p>
            <TotalRaisedOdometer
              targetUsd={stats.totalRaisedUsd}
              label={t('total_raised_label')}
            />
            <p className="text-caption text-ink-muted mt-3">
              {t('total_raised_disclaimer')}
            </p>
          </div>

          {/* Supporting stat: outcome count */}
          <div className="rounded-lg bg-surface border border-border px-6 py-5 flex items-center justify-between">
            <p className="text-body text-ink-soft">{t('women_reported_label')}</p>
            <p className="text-subhead font-bold text-ink tabular-nums">
              {stats.outcomeCount.toLocaleString()}
            </p>
          </div>
        </section>
      ) : (
        /* Below-threshold state */
        <section
          aria-labelledby="circle-building-heading"
          className="rounded-lg border-2 border-dashed border-border px-6 py-10 text-center"
        >
          <h2
            id="circle-building-heading"
            className="text-subhead font-display font-bold text-ink mb-2"
          >
            {t('building_title')}
          </h2>
          <p className="text-body text-ink-soft max-w-sm mx-auto">
            {t('building_body')}
          </p>
        </section>
      )}

      {/* ── Outcome reporting ────────────────────────────────────────────── */}
      <section aria-labelledby="outcome-form-heading">
        <h2
          id="outcome-form-heading"
          className="text-subhead font-display font-bold text-ink mb-1"
        >
          {hasReported ? t('update_heading') : t('report_heading')}
        </h2>
        <p className="text-body text-ink-soft mb-6">
          {hasReported ? t('update_subheading') : t('report_subheading')}
        </p>

        {submitted ? (
          /* Confirmation state after submit */
          <div className="rounded-lg bg-surface border border-border px-6 py-8 text-center">
            <p className="text-subhead font-display font-bold text-ink mb-2">
              {t('confirm_title')}
            </p>
            <p className="text-body text-ink-soft mb-6">{t('confirm_body')}</p>
            <button
              type="button"
              onClick={handleEdit}
              className="text-body text-accent-deep underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep rounded-sm"
            >
              {t('edit_outcome')}
            </button>
          </div>
        ) : (
          <OutcomeForm existing={userOutcome} onSuccess={handleSuccess} />
        )}
      </section>

      {/* ── Privacy note ────────────────────────────────────────────────── */}
      <p className="text-caption text-ink-muted border-t border-border pt-4">
        {t('privacy_note')}
      </p>
    </div>
  )
}
