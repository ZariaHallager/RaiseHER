'use client'

/**
 * WinCard
 *
 * Displays a single win in the list view.
 * Shows date, description, impact (if present), tags, and estimated value.
 * Edit and delete buttons trigger callbacks to the parent WinsLedger.
 *
 * Accessibility:
 *   - Semantic structure: the description is a heading, details are in a <dl>
 *   - Edit and delete buttons have accessible labels including win context
 */

import { useTranslations } from 'next-intl'
import type { Id } from '@convex/_generated/dataModel'
import type { SupportedLocale } from '@/i18n/routing'

type Win = {
  _id: Id<'wins'>
  description: string
  impact?: string
  estimatedValue?: number
  currency?: string
  date: number
  tags?: string[]
}

interface WinCardProps {
  win: Win
  locale: SupportedLocale
  onEdit: () => void
  onDelete: () => void
}

export function WinCard({ win, locale, onEdit, onDelete }: WinCardProps) {
  const t = useTranslations('wins')

  const dateStr = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(win.date))

  const valueStr =
    win.estimatedValue && win.currency
      ? new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : locale, {
        style: 'currency',
        currency: win.currency,
        maximumFractionDigits: 0,
      }).format(win.estimatedValue)
      : null

  return (
    <div className="bg-surface border border-border rounded-lg p-4 hover:border-ink-muted transition-colors">
      {/* Date */}
      <p className="text-caption text-ink-soft mb-2">{dateStr}</p>

      {/* Description */}
      <p className="text-body font-semibold text-ink mb-2 leading-snug">
        {win.description}
      </p>

      {/* Impact */}
      {win.impact && (
        <p className="text-caption text-ink-soft mb-3">
          <span className="font-semibold text-ink-soft">{t('win_impact_label')}:</span>{' '}
          {win.impact}
        </p>
      )}

      {/* Bottom row: tags + value + actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Tags */}
        {win.tags && win.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1 list-none" aria-label="Tags">
            {win.tags.map((tag) => (
              <li
                key={tag}
                className="text-label px-2 py-0.5 rounded-sm bg-surface-subtle text-ink-soft"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        {/* Estimated value */}
        {valueStr && (
          <span className="text-caption font-semibold text-accent-deep ml-auto">
            {valueStr}
          </span>
        )}

        {/* Actions */}
        <div className="flex gap-1 ml-auto">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`${t('edit_win')}: ${win.description.slice(0, 40)}`}
            className="text-caption text-ink-soft px-2 py-1 rounded-sm hover:text-ink hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep transition-colors"
          >
            {t('edit_win')}
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`${t('delete_win')}: ${win.description.slice(0, 40)}`}
            className="text-caption text-error px-2 py-1 rounded-sm hover:bg-error-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep transition-colors"
          >
            {t('delete_win')}
          </button>
        </div>
      </div>
    </div>
  )
}
