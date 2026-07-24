'use client'

/**
 * CaseFileList
 *
 * Shows the user's case files with status badges, a generate button,
 * and delete confirmation. Polling is handled by Convex reactive queries,
 * so 'generating' status updates live without a manual refresh.
 *
 * Accessibility:
 *   - Status badges have sr-only text ("status: ready" etc.)
 *   - Delete confirmation uses the Dialog primitive for focus trapping
 *   - Generating state has aria-busy
 *   - Live region announces status changes
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Link } from '@/i18n/navigation'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CaseFile = {
  _id: Id<'caseFiles'>
  title: string
  status: string
  language: string
  createdAt: number
  errorMessage?: string
  brief?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CaseFileList() {
  const t = useTranslations('casefiles')

  const caseFiles = useQuery(api.caseFiles.listCaseFiles, { limit: 20 })
  const requestGeneration = useMutation(api.caseFiles.requestCaseFileGeneration)
  const deleteCaseFile = useMutation(api.caseFiles.deleteCaseFile)

  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<Id<'caseFiles'> | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // ── Generate handler ───────────────────────────────────────────────────────
  async function handleGenerate() {
    setIsGenerating(true)
    setGenerateError(null)
    try {
      await requestGeneration({})
    } catch (err) {
      setGenerateError(t('error_generating'))
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Delete handlers ────────────────────────────────────────────────────────
  function openDelete(id: Id<'caseFiles'>) {
    setDeletingId(id)
    setDeleteError(null)
  }

  function closeDelete() {
    setDeletingId(null)
    setDeleteError(null)
    setIsDeleting(false)
  }

  async function confirmDelete() {
    if (!deletingId) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteCaseFile({ caseFileId: deletingId })
      closeDelete()
    } catch {
      setDeleteError('Something went wrong. Please try again.')
      setIsDeleting(false)
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (caseFiles === undefined) {
    return (
      <div aria-live="polite" aria-busy="true" className="py-16 text-center">
        <p className="text-body text-ink-soft">{t('loading')}</p>
      </div>
    )
  }

  const anyGenerating = (caseFiles as CaseFile[]).some(
    (cf) => cf.status === 'generating'
  )

  return (
    <>
      {/* ── Generate button ────────────────────────────────────────────── */}
      <div className="mb-6">
        <Button
          label={
            isGenerating || anyGenerating
              ? t('generating_label')
              : t('generate_cta')
          }
          loading={isGenerating}
          disabled={anyGenerating}
          onClick={handleGenerate}
        />
        {generateError && (
          <p role="alert" className="text-caption text-error mt-3">
            {generateError}
          </p>
        )}
      </div>

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {caseFiles.length === 0 && (
        <div className="py-16 text-center border-2 border-dashed border-border rounded-lg">
          <h2 className="text-subhead font-display font-bold text-ink mb-2">
            {t('empty_state_title')}
          </h2>
          <p className="text-body text-ink-soft mb-6 max-w-sm mx-auto">
            {t('empty_state_body')}
          </p>
        </div>
      )}

      {/* ── Case file list ─────────────────────────────────────────────── */}
      {caseFiles.length > 0 && (
        <ul className="flex flex-col gap-3" aria-label={t('title')}>
          {(caseFiles as CaseFile[]).map((cf) => (
            <li key={cf._id}>
              <CaseFileCard
                cf={cf}
                onDelete={() => openDelete(cf._id)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* ── Delete confirmation dialog ─────────────────────────────────── */}
      <Dialog
        open={deletingId !== null}
        onClose={closeDelete}
        aria-labelledby="cf-delete-title"
      >
        <h2
          id="cf-delete-title"
          className="text-subhead font-display font-bold text-ink mb-2"
        >
          {t('delete_confirm_title')}
        </h2>
        <p className="text-body text-ink-soft mb-6">
          {t('delete_confirm_body')}
        </p>
        {deleteError && (
          <p role="alert" className="text-caption text-error mb-4">
            {deleteError}
          </p>
        )}
        <div className="flex gap-3 justify-end">
          <Button
            label={t('cancel')}
            variant="secondary"
            onClick={closeDelete}
            disabled={isDeleting}
          />
          <Button
            label={isDeleting ? '...' : t('delete_btn')}
            loading={isDeleting}
            onClick={confirmDelete}
            className="bg-error text-white border-error"
          />
        </div>
      </Dialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// CaseFileCard
// ---------------------------------------------------------------------------

function CaseFileCard({
  cf,
  onDelete,
}: {
  cf: CaseFile
  onDelete: () => void
}) {
  const t = useTranslations('casefiles')

  const date = new Date(cf.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const isGenerating = cf.status === 'generating'
  const isReady = cf.status === 'ready'
  const isError = cf.status === 'error'

  const statusLabel = isReady
    ? t('ready_label')
    : isGenerating
      ? t('generating_label')
      : t('error_label')

  const statusColors = isReady
    ? 'bg-success-light text-success'
    : isGenerating
      ? 'bg-accent-light text-accent-deep'
      : 'bg-error-light text-error'

  return (
    <article className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        {/* Title + meta */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              aria-label={`status: ${statusLabel}`}
              className={`inline-flex items-center gap-1.5 text-label font-semibold px-2 py-0.5 rounded-sm ${statusColors}`}
            >
              {isGenerating && (
                <span
                  aria-hidden="true"
                  className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                />
              )}
              {statusLabel}
            </span>
            <time className="text-caption text-ink-soft">{date}</time>
          </div>
          <p className="text-body font-semibold text-ink truncate">
            {isGenerating
              ? t('generating_title')
              : isError
                ? t('error_label')
                : cf.title || t('title')}
          </p>
          {isGenerating && (
            <p
              aria-live="polite"
              aria-busy="true"
              className="text-caption text-ink-soft mt-1"
            >
              {t('generating_body')}
            </p>
          )}
          {isError && cf.errorMessage && (
            <p role="alert" className="text-caption text-error mt-1">
              {t('error_generating')}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isReady && (
            <Link
              href={`/case-files/${cf._id}`}
              className="inline-flex items-center justify-center font-bold text-body rounded-lg px-4 py-2 bg-ink text-ink-inverse transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep"
            >
              {t('view_btn')}
            </Link>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="text-caption text-ink-soft underline hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep rounded-sm px-1"
          >
            {t('delete_btn')}
          </button>
        </div>
      </div>
    </article>
  )
}
