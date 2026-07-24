'use client'

/**
 * ShareBriefClient
 *
 * Public share view of a case file brief. No auth, no Convex provider needed.
 * Uses BriefDocument (pure presentational, no Convex hooks) for the content.
 * Adds a print button and a CTA to sign up for RaiseHER.
 */

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { BriefDocument } from '@/components/case-files/BriefDocument'
import type { CaseFileBrief as CaseFileBriefData } from '@convex/caseFileAction'

interface Props {
  caseFile: {
    _id: string
    brief?: unknown
    createdAt: number
  } | null
}

export function ShareBriefClient({ caseFile }: Props) {
  const t = useTranslations('casefiles')

  if (!caseFile || !caseFile.brief) {
    return (
      <main
        id="main-content"
        className="min-h-screen bg-canvas px-4 py-12 flex items-center justify-center"
      >
        <div className="text-center max-w-sm">
          <h1 className="text-subhead font-display font-bold text-ink mb-2">
            {t('share_not_found_title')}
          </h1>
          <p className="text-body text-ink-soft mb-6">
            {t('share_not_found_body')}
          </p>
          <Link
            href="/"
            className="text-body font-bold text-accent-deep underline hover:no-underline"
          >
            {t('share_cta_link')}
          </Link>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-canvas case-file-print-area">
      {/* Top bar with print + CTA (hidden on print) */}
      <div className="no-print border-b border-border bg-surface px-4 py-3 flex items-center justify-between gap-4">
        <span className="text-label font-semibold text-ink-soft">
          {t('share_page_subtitle')}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="text-body font-bold text-ink border-[1.5px] border-ink rounded-lg px-4 py-2 hover:bg-surface-subtle transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep"
          >
            {t('share_print')}
          </button>
          <Link
            href="/"
            className="text-body font-bold bg-ink text-ink-inverse rounded-lg px-4 py-2 hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep"
          >
            {t('share_build_cta')}
          </Link>
        </div>
      </div>

      <main id="main-content" className="px-4 py-8 max-w-2xl mx-auto">
        <BriefDocument
          brief={caseFile.brief as CaseFileBriefData}
          createdAt={caseFile.createdAt}
          footerCaption="Shared via RaiseHER"
        />
      </main>
    </div>
  )
}
