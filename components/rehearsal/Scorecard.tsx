'use client'

/**
 * Scorecard
 *
 * Displays the five negotiation dimension scores as animated fill bars.
 * Bars animate from 0 to their final score on mount using CSS transitions
 * with `prefers-reduced-motion` respected.
 *
 * Research-grounded feedback is displayed per dimension.
 * Supports all four locales (text is pre-localized from the AI).
 *
 * Accessibility:
 *   - Each bar has a role="meter" with aria-valuenow, aria-valuemin, aria-valuemax
 *   - Score values are also readable as text alongside the bar
 *   - Section is labelled by the scorecard title heading
 */

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import type { ScorecardResult } from '@convex/rehearsalAction'

interface ScorecardProps {
  scorecard: ScorecardResult
  onTryAgain: () => void
  onChooseDifferent: () => void
}

const DIMENSION_ORDER = [
  'overall',
  'clarity',
  'confidence',
  'evidence',
  'objections',
] as const

type DimensionKey = typeof DIMENSION_ORDER[number]

// Score color thresholds
function scoreColor(score: number): string {
  if (score >= 80) return 'bg-ink'
  if (score >= 60) return 'bg-accent-deep'
  return 'bg-ink-soft'
}

export function Scorecard({ scorecard, onTryAgain, onChooseDifferent }: ScorecardProps) {
  const t = useTranslations('rehearsal')
  const [animated, setAnimated] = useState(false)
  const prefersReducedMotion = useRef(false)

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Trigger bar animation after a short delay so it's visible
    const id = setTimeout(() => setAnimated(true), prefersReducedMotion.current ? 0 : 120)
    return () => clearTimeout(id)
  }, [])

  const titleId = 'scorecard-title'

  return (
    <section aria-labelledby={titleId} className="space-y-8">
      {/* Header */}
      <div>
        <h2
          id={titleId}
          className="text-headline font-display font-bold text-ink mb-2"
          tabIndex={-1}
        >
          {t('scorecard_title')}
        </h2>
        <p className="text-body text-ink-soft">{t('scorecard_subtitle')}</p>
      </div>

      {/* Overall score prominent display */}
      <div className="rounded-lg border-2 border-accent bg-accent/10 px-6 py-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-subhead font-bold text-ink">
            {scorecard.dimensions.overall.label}
          </span>
          <span
            className="text-display font-display font-bold text-ink"
            aria-label={`${scorecard.dimensions.overall.score} out of 100`}
          >
            {scorecard.dimensions.overall.score}
            <span className="text-subhead font-sans font-normal text-ink-soft">/100</span>
          </span>
        </div>
        <ScoreBar
          score={scorecard.dimensions.overall.score}
          animated={animated}
          reducedMotion={prefersReducedMotion.current}
          label={scorecard.dimensions.overall.label}
          prominent
        />
        {scorecard.dimensions.overall.feedback && (
          <p className="text-body text-ink mt-3">{scorecard.dimensions.overall.feedback}</p>
        )}
      </div>

      {/* Individual dimension bars */}
      <div className="space-y-5">
        {(DIMENSION_ORDER.slice(1) as DimensionKey[]).map((key) => {
          const dim = scorecard.dimensions[key]
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-body font-semibold text-ink">{dim.label}</span>
                <span className="text-caption text-ink-soft tabular-nums">
                  {dim.score}/100
                </span>
              </div>
              <ScoreBar
                score={dim.score}
                animated={animated}
                reducedMotion={prefersReducedMotion.current}
                label={dim.label}
              />
              {dim.feedback && (
                <p className="text-caption text-ink-soft mt-1.5">{dim.feedback}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Narrative summary */}
      {scorecard.narrative && (
        <div className="rounded-lg bg-surface border border-border px-5 py-4">
          <h3 className="text-body font-bold text-ink mb-2">
            {t('scorecard_feedback_heading')}
          </h3>
          <p className="text-body text-ink-soft leading-relaxed">{scorecard.narrative}</p>
        </div>
      )}

      {/* Next steps */}
      {scorecard.nextSteps.length > 0 && (
        <div>
          <h3 className="text-body font-bold text-ink mb-3">
            {t('scorecard_next_steps_heading')}
          </h3>
          <ol className="space-y-3">
            {scorecard.nextSteps.map((step, i) => (
              <li key={i} className="flex gap-3 text-body text-ink-soft">
                <span
                  className="shrink-0 w-6 h-6 rounded-full bg-ink text-ink-inverse text-label font-bold flex items-center justify-center"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button label={t('try_again')} onClick={onTryAgain} />
        <Button
          label={t('choose_different')}
          variant="secondary"
          onClick={onChooseDifferent}
        />
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// ScoreBar sub-component
// ---------------------------------------------------------------------------

interface ScoreBarProps {
  score: number
  animated: boolean
  reducedMotion: boolean
  label: string
  prominent?: boolean
}

function ScoreBar({ score, animated, reducedMotion, label, prominent }: ScoreBarProps) {
  const width = animated ? score : 0
  const colorClass = scoreColor(score)
  const barId = `score-bar-${label.replace(/\s+/g, '-').toLowerCase()}`
  const height = prominent ? 'h-3' : 'h-2'

  return (
    <div
      className={`w-full bg-border rounded-full overflow-hidden ${height}`}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${score} out of 100`}
      id={barId}
    >
      <div
        className={`${height} ${colorClass} rounded-full`}
        style={{
          width: `${width}%`,
          transition: reducedMotion ? 'none' : 'width 0.9s cubic-bezier(0.34, 1.06, 0.64, 1)',
        }}
        aria-hidden="true"
      />
    </div>
  )
}
