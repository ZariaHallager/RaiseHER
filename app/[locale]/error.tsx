'use client'

/**
 * LocaleError: global error boundary for all routes under /[locale]/.
 *
 * Next.js requires this to be a Client Component (the `error` and `reset`
 * props are serialized across the server/client boundary).
 *
 * This boundary catches unhandled errors thrown during render or in Server
 * Actions for any route nested under the active locale.  Caught errors are
 * logged to the console (and would go to a monitoring service in production).
 *
 * The page owns its <main> so the skip-to-content link still resolves.
 */

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function LocaleError({ error, reset }: ErrorProps) {
  const t = useTranslations('common')

  useEffect(() => {
    // Replace with a real error-reporting call in production.
    console.error('[LocaleError]', error)
  }, [error])

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center"
    >
      <h1 className="text-headline font-display text-ink">
        {t('error_title')}
      </h1>
      <p className="text-body text-ink-soft max-w-md">
        {t('error_generic')}
      </p>
      <button
        type="button"
        onClick={reset}
        className="px-6 py-3 bg-accent text-on-accent font-semibold rounded-lg text-body"
      >
        {t('error_try_again')}
      </button>
    </main>
  )
}
