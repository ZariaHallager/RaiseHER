'use client'

/**
 * WinsLedger
 *
 * Owns the full wins list experience:
 *   - Reverse-chronological list loaded from Convex
 *   - Keyword search (client-side, searches description, impact, and tags)
 *   - Date-range filter (client-side, from/to date inputs)
 *   - Add win button → opens WinForm dialog
 *   - Edit / delete actions on each win card
 *   - Empty, loading, and error states
 *
 * Accessibility:
 *   - Live region announces result count when filters change
 *   - All interactive controls are real buttons or inputs with labels
 *   - Delete confirmation uses the Dialog primitive (focus trapping + Escape)
 */

import { useState, useMemo, useId } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { WinForm } from '@/components/wins/WinForm'
import { WinCard } from '@/components/wins/WinCard'
import type { SupportedLocale } from '@/i18n/routing'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Win = {
  _id: Id<'wins'>
  description: string
  impact?: string
  estimatedValue?: number
  currency?: string
  date: number
  tags?: string[]
  createdAt: number
  updatedAt: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WinsLedger() {
  const t = useTranslations('wins')
  const locale = useLocale() as SupportedLocale

  const wins = useQuery(api.wins.listWins, { limit: 200 })
  const deleteWin = useMutation(api.wins.deleteWin)

  // ── UI state ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingWin, setEditingWin] = useState<Win | null>(null)
  const [deletingId, setDeletingId] = useState<Id<'wins'> | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const searchId = useId()
  const dateFromId = useId()
  const dateToId = useId()

  // ── Filtered wins ─────────────────────────────────────────────────────────
  const filtered = useMemo<Win[]>(() => {
    if (!wins) return []

    const q = search.trim().toLowerCase()
    const fromMs = dateFrom ? new Date(dateFrom).getTime() : null
    const toMs = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : null

    return (wins as Win[]).filter((w) => {
      if (q) {
        const haystack = [
          w.description,
          w.impact ?? '',
          ...(w.tags ?? []),
        ].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (fromMs !== null && w.date < fromMs) return false
      if (toMs !== null && w.date > toMs) return false
      return true
    })
  }, [wins, search, dateFrom, dateTo])

  // ── Handlers ──────────────────────────────────────────────────────────────
  function openAdd() {
    setEditingWin(null)
    setFormOpen(true)
  }

  function openEdit(win: Win) {
    setEditingWin(win)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingWin(null)
  }

  function openDelete(id: Id<'wins'>) {
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
      await deleteWin({ winId: deletingId })
      closeDelete()
    } catch {
      setDeleteError('Something went wrong. Please try again.')
      setIsDeleting(false)
    }
  }

  // ── Loading / error states ────────────────────────────────────────────────
  if (wins === undefined) {
    return (
      <div aria-live="polite" aria-busy="true" className="py-16 text-center">
        <p className="text-body text-ink-soft">{t('loading' as never) ?? 'Loading...'}</p>
      </div>
    )
  }

  const hasWins = wins.length > 0
  const hasFilters = search.trim() !== '' || dateFrom !== '' || dateTo !== ''

  return (
    <>
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Top row: search + add button */}
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <label htmlFor={searchId} className="sr-only">
              {t('search_placeholder')}
            </label>
            <input
              id={searchId}
              type="search"
              placeholder={t('search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-body bg-surface text-ink border-[1.5px] border-border rounded-lg px-4 py-3 placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep"
            />
          </div>
          <Button
            label={t('add_win')}
            onClick={openAdd}
            className="shrink-0 py-3"
          />
        </div>

        {/* Date range filter */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label htmlFor={dateFromId} className="text-label font-semibold text-ink-soft">
              {t('date_from')}
            </label>
            <input
              id={dateFromId}
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-body bg-surface text-ink border-[1.5px] border-border rounded-lg px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep"
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label htmlFor={dateToId} className="text-label font-semibold text-ink-soft">
              {t('date_to')}
            </label>
            <input
              id={dateToId}
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-body bg-surface text-ink border-[1.5px] border-border rounded-lg px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep"
            />
          </div>
          {(dateFrom || dateTo) && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => { setDateFrom(''); setDateTo('') }}
                className="text-caption text-ink-soft underline hover:text-ink pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep rounded-sm"
              >
                {t('clear_dates')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Results count live region ────────────────────────────────────── */}
      {hasFilters && (
        <p aria-live="polite" className="text-caption text-ink-soft mb-4">
          {filtered.length === 0
            ? t('no_results')
            : `${filtered.length} ${filtered.length === 1 ? t('wins_count_one', { count: filtered.length }) : t('wins_count_other', { count: filtered.length })}`}
        </p>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!hasWins && !hasFilters && (
        <div className="py-16 text-center border-2 border-dashed border-border rounded-lg">
          <h2 className="text-subhead font-display font-bold text-ink mb-2">
            {t('empty_state_title')}
          </h2>
          <p className="text-body text-ink-soft mb-6 max-w-sm mx-auto">
            {t('empty_state_body')}
          </p>
          <Button label={t('empty_state_cta')} onClick={openAdd} />
        </div>
      )}

      {/* ── No results from filter ───────────────────────────────────────── */}
      {hasWins && hasFilters && filtered.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-body text-ink-soft">{t('no_results')}</p>
        </div>
      )}

      {/* ── Win list ─────────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <ul className="flex flex-col gap-3" aria-label={t('title')}>
          {filtered.map((win) => (
            <li key={win._id}>
              <WinCard
                win={win}
                locale={locale}
                onEdit={() => openEdit(win)}
                onDelete={() => openDelete(win._id)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* ── Add / edit form dialog ───────────────────────────────────────── */}
      <Dialog
        open={formOpen}
        onClose={closeForm}
        aria-labelledby="win-form-title"
        className="max-h-[90vh] overflow-y-auto"
      >
        <WinForm
          editingWin={editingWin}
          onClose={closeForm}
        />
      </Dialog>

      {/* ── Delete confirmation dialog ───────────────────────────────────── */}
      <Dialog
        open={deletingId !== null}
        onClose={closeDelete}
        aria-labelledby="delete-confirm-title"
      >
        <h2
          id="delete-confirm-title"
          className="text-subhead font-display font-bold text-ink mb-2"
        >
          {t('delete_confirm_title')}
        </h2>
        <p className="text-body text-ink-soft mb-6">
          {t('delete_confirm_message')}
        </p>
        {deleteError && (
          <p role="alert" className="text-caption text-error mb-4">
            {deleteError}
          </p>
        )}
        <div className="flex gap-3 justify-end">
          <Button
            label="Cancel"
            variant="secondary"
            onClick={closeDelete}
            disabled={isDeleting}
          />
          <Button
            label={isDeleting ? 'Deleting...' : t('delete_win')}
            loading={isDeleting}
            onClick={confirmDelete}
            className="bg-error text-white border-error"
          />
        </div>
      </Dialog>
    </>
  )
}
