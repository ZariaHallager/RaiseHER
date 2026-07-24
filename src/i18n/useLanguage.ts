/**
 * useLanguage hook
 *
 * Returns the current UI locale and a `changeLanguage` callback that
 * navigates to the same pathname under the new locale prefix, which the
 * next-intl middleware then persists in the RAISEHER_LOCALE cookie.
 *
 * This replaces the old i18next / SecureStore implementation.
 *
 * Usage:
 *   const { locale, changeLanguage } = useLanguage()
 *   await changeLanguage('es')   // navigates to /es/current-path
 *
 * After account creation, also write `users.preferredLanguage` to Convex
 * using the returned `locale` value.
 */
'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from './navigation'
import { useTransition } from 'react'
import { SUPPORTED_LOCALES, type SupportedLocale } from './routing'

export function useLanguage() {
  const locale = useLocale() as SupportedLocale
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function changeLanguage(nextLocale: SupportedLocale) {
    startTransition(() => {
      // next-intl's useRouter.replace patches the locale prefix in-place and
      // the middleware writes the updated RAISEHER_LOCALE cookie.
      router.replace(pathname, { locale: nextLocale })
    })
  }

  return {
    locale,
    changeLanguage,
    isPending,
    supportedLocales: SUPPORTED_LOCALES,
  } as const
}
