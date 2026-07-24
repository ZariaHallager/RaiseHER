/**
 * next-intl routing configuration.
 *
 * Defines the four supported locales, the default locale, and the locale
 * cookie name used for persistence.  All other next-intl APIs (middleware,
 * navigation helpers, request config) import from this single source of truth.
 *
 * Locale detection priority (middleware, prefix-based):
 *   1. Locale prefix already in pathname  (e.g. /es/wins)
 *   2. Cookie  (LOCALE_COOKIE set by the middleware on first visit)
 *   3. Accept-Language header  (best-fit via @formatjs/intl-localematcher)
 *   4. defaultLocale fallback  ('en')
 *
 * RTL deferred: dir is wired through the layout so adding Arabic later is a
 * config change, not a refactor.  All four launch locales are LTR.
 */
import { defineRouting } from 'next-intl/routing'

export const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'pt'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

/** BCP 47 locale tags used for html[lang] and Web Speech API. */
export const LOCALE_BCP47: Record<SupportedLocale, string> = {
  en: 'en',
  es: 'es',
  fr: 'fr',
  pt: 'pt-BR',
}

/** Text direction for all supported locales. RTL added here when needed. */
export const LOCALE_DIR: Record<SupportedLocale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  es: 'ltr',
  fr: 'ltr',
  pt: 'ltr',
}

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: 'en',
  localePrefix: 'always',
  localeCookie: {
    name: 'RAISEHER_LOCALE',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  },
  localeDetection: true,
})
