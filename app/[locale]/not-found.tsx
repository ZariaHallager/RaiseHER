'use client'

/**
 * LocaleNotFound: 404 page for routes under /[locale]/.
 *
 * Rendered when a page under the active locale segment is not found (e.g.
 * /en/nonexistent).  Renders inside the locale layout, so ClerkProvider and
 * NextIntlClientProvider are available and useTranslations works.
 *
 * The page provides its own <main> so the skip-to-content link resolves and
 * keyboard users land at the right heading.
 */

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function LocaleNotFound() {
  const t = useTranslations('common')

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center"
    >
      <h1 className="text-headline font-display text-ink">
        {t('not_found_title')}
      </h1>
      <p className="text-body text-ink-soft max-w-md">
        {t('not_found_body')}
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-accent text-on-accent font-semibold rounded-lg text-body"
      >
        {t('not_found_home')}
      </Link>
    </main>
  )
}
