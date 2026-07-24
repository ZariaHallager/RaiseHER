/**
 * Locale-aware sitemap.
 *
 * Emits one entry per route × locale, each with the full set of hreflang
 * alternates so search engines can discover every language variant.
 *
 * Add new routes to ROUTES as the app grows; the locale × route matrix is
 * computed automatically.
 */
import type { MetadataRoute } from 'next'
import { routing, LOCALE_BCP47, type SupportedLocale } from '@/i18n/routing'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://raiseher.app').replace(/\/$/, '')

/** Public marketing routes (no auth required). */
const PUBLIC_ROUTES = ['', '/pricing', '/privacy', '/terms'] as const

/** Authenticated app routes. */
const APP_ROUTES = ['/wins', '/pay-gap', '/rehearsal', '/case-files', '/circle'] as const

/** All routes to include in the sitemap (without locale prefix). */
const ROUTES = [...PUBLIC_ROUTES, ...APP_ROUTES] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const route of ROUTES) {
    for (const locale of routing.locales) {
      const url = `${APP_URL}/${locale}${route}`

      // Build alternates: one entry per locale + x-default pointing at /en.
      const alternates: Record<string, string> = { 'x-default': `${APP_URL}/en${route}` }
      for (const alt of routing.locales) {
        const bcp47 = LOCALE_BCP47[alt as SupportedLocale]
        alternates[bcp47] = `${APP_URL}/${alt}${route}`
      }

      const isRoot = route === ''
      const isPricingOrLegal = route === '/pricing' || route === '/privacy' || route === '/terms'

      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: isRoot ? 'weekly' : isPricingOrLegal ? 'monthly' : 'monthly',
        priority: isRoot ? 1.0 : isPricingOrLegal ? 0.9 : 0.7,
        alternates: {
          languages: alternates,
        },
      })
    }
  }

  return entries
}
