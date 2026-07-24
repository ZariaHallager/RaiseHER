'use client'

/**
 * CaseFileBriefLoader
 *
 * Client component that subscribes to a single case file via Convex reactive
 * query. Handles loading, generating, error, and ready states before
 * rendering the CaseFileBrief component.
 *
 * Used on the authenticated /[locale]/case-files/[caseFileId] route.
 */

import { useTranslations } from 'next-intl'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { CaseFileBrief } from '@/components/case-files/CaseFileBrief'
import type { CaseFileBrief as CaseFileBriefData } from '@convex/caseFileAction'

interface Props {
  caseFileId: string
}

export function CaseFileBriefLoader({ caseFileId }: Props) {
  const t = useTranslations('casefiles')

  const cf = useQuery(api.caseFiles.getCaseFile, {
    caseFileId: caseFileId as Id<'caseFiles'>,
  })

  // Loading
  if (cf === undefined) {
    return (
      <main id="main-content" className="px-4 py-8 max-w-2xl mx-auto">
        <div aria-live="polite" aria-busy="true" className="py-16 text-center">
          <p className="text-body text-ink-soft">{t('loading')}</p>
        </div>
      </main>
    )
  }

  // Not found / unauthorized
  if (cf === null) {
    return (
      <main id="main-content" className="px-4 py-8 max-w-2xl mx-auto">
        <p role="alert" className="text-body text-error">
          {t('not_found_error')}
        </p>
      </main>
    )
  }

  // Generating
  if (cf.status === 'generating') {
    return (
      <main id="main-content" className="px-4 py-8 max-w-2xl mx-auto">
        <div aria-live="polite" aria-busy="true" className="py-16 text-center">
          <div className="flex justify-center mb-4">
            <span
              aria-hidden="true"
              className="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"
            />
          </div>
          <h1 className="text-subhead font-display font-bold text-ink mb-2">
            {t('generating_title')}
          </h1>
          <p className="text-body text-ink-soft max-w-sm mx-auto">
            {t('generating_body')}
          </p>
        </div>
      </main>
    )
  }

  // Error
  if (cf.status === 'error') {
    return (
      <main id="main-content" className="px-4 py-8 max-w-2xl mx-auto">
        <p role="alert" className="text-body text-error">
          {t('error_generating')}
        </p>
      </main>
    )
  }

  // Ready
  return (
    <main id="main-content" className="px-4 py-8 max-w-2xl mx-auto">
      <CaseFileBrief
        caseFileId={cf._id as Id<'caseFiles'>}
        brief={cf.brief as CaseFileBriefData}
        includedWinIds={
          (cf.includedWinIds as Id<'wins'>[] | undefined) ?? []
        }
        createdAt={cf.createdAt}
      />
    </main>
  )
}
