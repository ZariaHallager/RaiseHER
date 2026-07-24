'use client'

/**
 * BriefDocument
 *
 * Pure presentational component that renders a CaseFileBrief data structure.
 * No Convex hooks. Used by both:
 *   - CaseFileBrief (authenticated view with print + share)
 *   - ShareBriefClient (public share view, no provider needed)
 *
 * Accessibility:
 *   - Landmark article with aria-label
 *   - Section headings at h2 level
 *   - Win bullet dots are aria-hidden
 *   - Number cells have accessible labels
 */

import { useTranslations } from 'next-intl'
import type { CaseFileBrief as CaseFileBriefData } from '@convex/caseFileAction'

interface BriefDocumentProps {
  brief: CaseFileBriefData
  createdAt: number
  locale?: string
  /** Optional footer caption, e.g. "Shared via RaiseHER" */
  footerCaption?: string
  generatedOnLabel?: string
}

export function BriefDocument({
  brief,
  createdAt,
  locale = 'en',
  footerCaption,
  generatedOnLabel = 'Generated',
}: BriefDocumentProps) {
  const t = useTranslations('casefiles')
  const generatedDate = new Date(createdAt).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <article
      aria-label={brief.headline}
      className="bg-surface rounded-lg border border-border p-8 max-w-2xl print:border-none print:rounded-none print:p-0 print:bg-transparent"
    >
      {/* Document header */}
      <header className="mb-8 border-b border-border pb-6 print:pb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-headline font-display font-bold text-ink mb-1">
              {brief.headline}
            </h1>
            {brief.roleLabel && (
              <p className="text-body text-ink-soft">{brief.roleLabel}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-caption text-ink-soft">
              {generatedOnLabel} {generatedDate}
            </p>
            {footerCaption && (
              <p className="text-caption text-ink-muted mt-0.5">{footerCaption}</p>
            )}
          </div>
        </div>

        {brief.summary && (
          <p className="text-body text-ink mt-4 leading-relaxed">{brief.summary}</p>
        )}
      </header>

      {/* Gap section */}
      <section aria-labelledby="brief-gap-heading" className="mb-8">
        <h2
          id="brief-gap-heading"
          className="text-subhead font-display font-bold text-ink mb-4"
        >
          {brief.gapSection.heading}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <NumberCell label="Current" value={brief.gapSection.currentSalary} />
          <NumberCell label="Market" value={brief.gapSection.benchmarkSalary} />
          <NumberCell label="Gap" value={brief.gapSection.gapAmount} highlight />
          <NumberCell label="%" value={brief.gapSection.gapPercentage} highlight />
        </div>

        {brief.gapSection.narrative && (
          <p className="text-body text-ink leading-relaxed">
            {brief.gapSection.narrative}
          </p>
        )}
      </section>

      {/* Wins section */}
      <section aria-labelledby="brief-wins-heading" className="mb-8">
        <h2
          id="brief-wins-heading"
          className="text-subhead font-display font-bold text-ink mb-4"
        >
          {brief.winsSection.heading}
        </h2>

        {brief.winsSection.items.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {brief.winsSection.items.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 w-2 h-2 rounded-full bg-accent shrink-0"
                />
                <span className="text-body text-ink leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body text-ink-soft italic">{t('no_wins_label')}</p>
        )}
      </section>

      {/* Rehearsal section */}
      {brief.rehearsalSection && brief.rehearsalSection.lines.length > 0 && (
        <section aria-labelledby="brief-rehearsal-heading" className="mb-8">
          <h2
            id="brief-rehearsal-heading"
            className="text-subhead font-display font-bold text-ink mb-4"
          >
            {brief.rehearsalSection.heading}
          </h2>

          <ul className="flex flex-col gap-3">
            {brief.rehearsalSection.lines.map((line, i) => (
              <li
                key={i}
                className="border-l-4 border-accent pl-4 text-body text-ink italic leading-relaxed"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Closing / The Ask */}
      <section
        aria-labelledby="brief-closing-heading"
        className="bg-accent-light rounded-lg p-5 print:bg-transparent print:border print:border-border"
      >
        <h2
          id="brief-closing-heading"
          className="text-subhead font-display font-bold text-on-accent mb-3"
        >
          {brief.closingSection.heading}
        </h2>
        <p className="text-body text-on-accent leading-relaxed">
          {brief.closingSection.ask}
        </p>
      </section>
    </article>
  )
}

// ---------------------------------------------------------------------------
// NumberCell
// ---------------------------------------------------------------------------

function NumberCell({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg p-3 ${highlight ? 'bg-accent-light' : 'bg-surface-subtle'}`}
    >
      <p className="text-label font-semibold text-ink-soft uppercase tracking-wide mb-1">
        {label}
      </p>
      <p
        className={`text-subhead font-bold ${highlight ? 'text-accent-deep' : 'text-ink'}`}
      >
        {value}
      </p>
    </div>
  )
}
