'use client'

/**
 * LanguagePicker
 *
 * A styled <select> that switches the active next-intl locale.
 * Uses useRouter / usePathname from the locale-aware navigation helpers
 * so the current path is preserved when the locale changes.
 *
 * Server renders the current locale as the default selected value.
 * Accessible: label is visible (not sr-only) by default; callers can
 * hide it by passing labelClassName="sr-only".
 */

import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n/routing'

const LANGUAGE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
}

interface LanguagePickerProps {
  labelClassName?: string
}

export function LanguagePicker({ labelClassName }: LanguagePickerProps) {
  const t = useTranslations('onboarding')
  const locale = useLocale() as SupportedLocale
  const router = useRouter()
  const pathname = usePathname()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as SupportedLocale
    router.replace(pathname, { locale: next })
  }

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="language-picker"
        className={[
          'text-label font-semibold tracking-wide text-ink-soft',
          labelClassName ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {t('choose_language')}
      </label>
      <select
        id="language-picker"
        value={locale}
        onChange={handleChange}
        className={[
          'text-body bg-surface text-ink',
          'border-[1.5px] border-border rounded-lg px-4 py-3 pr-9',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep',
          'cursor-pointer appearance-none',
          'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%23888\' stroke-width=\'1.5\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E")]',
          'bg-no-repeat bg-[right_12px_center]',
        ].join(' ')}
      >
        {SUPPORTED_LOCALES.map((l) => (
          <option key={l} value={l}>
            {LANGUAGE_LABELS[l]}
          </option>
        ))}
      </select>
    </div>
  )
}
