'use client'

/**
 * CaseFileBrief
 *
 * Authenticated view of a generated raise brief.
 * Adds print and share-link actions on top of the BriefDocument presenter.
 *
 * - Print: calls window.print(). The @media print block in globals.css hides
 *   navigation and action buttons, leaving only the .case-file-print-area.
 * - Share link: calls the Convex generateShareToken mutation then copies the
 *   /share/[token] URL to the clipboard. The share page is fully public.
 * - Win back-links: each included win ID becomes a link to the Wins Ledger
 *   so the user can jump back to the source entry.
 *
 * Accessibility:
 *   - Print/share buttons are real <button> elements with descriptive labels
 *   - The link-copied confirmation uses aria-live="polite"
 */

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { Button } from '@/components/ui/Button'
import { Link } from '@/i18n/navigation'
import { BriefDocument } from '@/components/case-files/BriefDocument'
import type { CaseFileBrief as CaseFileBriefData } from '@convex/caseFileAction'

interface CaseFileBriefProps {
  caseFileId: Id<'caseFiles'>
  brief: CaseFileBriefData
  includedWinIds?: Id<'wins'>[]
  createdAt: number
}

export function CaseFileBrief({
  caseFileId,
  brief,
  includedWinIds,
  createdAt,
}: CaseFileBriefProps) {
  const t = useTranslations('casefiles')
  const locale = useLocale()

  const generateShareToken = useMutation(api.caseFiles.generateShareToken)

  const [isCopying, setIsCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  // ── Print ────────────────────────────────────────────────────────────────
  function handlePrint() {
    window.print()
  }

  // ── Share link ───────────────────────────────────────────────────────────
  async function handleShare() {
    setIsCopying(true)
    setShareError(null)
    try {
      const token = await generateShareToken({ caseFileId })
      const url = `${window.location.origin}/share/${token}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      setShareError('Could not copy link. Try again.')
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <div className="case-file-print-area">
      {/* ── Action bar (hidden on print via .no-print in globals.css) ───── */}
      <div className="no-print flex items-center gap-3 mb-6 flex-wrap">
        <Link
          href="/case-files"
          className="text-body text-accent-deep underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep rounded-sm"
        >
          {t('back_to_case_files')}
        </Link>

        <div className="ml-auto flex gap-2 flex-wrap">
          <Button
            label={t('print_btn')}
            variant="secondary"
            onClick={handlePrint}
            className="py-2 px-4"
          />
          <Button
            label={
              isCopying ? '...' : copied ? t('link_copied') : t('copy_link_btn')
            }
            loading={isCopying}
            onClick={handleShare}
            className="py-2 px-4"
          />
        </div>
      </div>

      {/* Link-copied / error feedback */}
      {shareError && (
        <p role="alert" className="no-print text-caption text-error mb-4">
          {shareError}
        </p>
      )}
      {copied && (
        <p aria-live="polite" className="no-print text-caption text-success mb-4">
          {t('link_copied')}
        </p>
      )}

      {/* ── Brief document ─────────────────────────────────────────────── */}
      <BriefDocument
        brief={brief}
        createdAt={createdAt}
        locale={locale}
        generatedOnLabel={t('generated_on')}
      />

      {/* ── Win back-links (authenticated only, hidden on print) ─────── */}
      {includedWinIds && includedWinIds.length > 0 && (
        <div className="no-print mt-4 flex flex-wrap gap-2">
          {includedWinIds.slice(0, 10).map((winId, i) => (
            <Link
              key={winId}
              href="/wins"
              className="text-caption text-accent-deep underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep rounded-sm"
              aria-label={`${t('wins_ledger_link')} ${i + 1}`}
            >
              {t('wins_ledger_link')} {i + 1}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
