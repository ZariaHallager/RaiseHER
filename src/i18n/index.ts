/**
 * i18n public API
 *
 * Re-exports the shared locale configuration so the rest of the codebase has
 * a single, stable import path: `import { SUPPORTED_LOCALES } from '@/i18n'`
 *
 * ─── MIGRATION NOTE ───────────────────────────────────────────────────────────
 * The old i18next / expo-localization / expo-secure-store implementation has
 * been replaced by next-intl with App Router locale-prefixed routing.
 *
 * Static UI strings
 *   Server Components  → `getTranslations({ namespace: 'wins' })`  (async)
 *   Client Components  → `useTranslations('wins')`                 (sync hook)
 *
 * Locale cookie persistence
 *   Handled automatically by the next-intl middleware.  On every visit the
 *   middleware writes the RAISEHER_LOCALE cookie, which is read on the next
 *   request in request.ts.  No manual SecureStore calls needed.
 *
 * Changing the locale from a Client Component
 *   Use `useRouter` from next-intl/navigation (re-exported below) or navigate
 *   to the new locale prefix directly.  See useLanguage.ts for the hook.
 *
 * Interpolation
 *   next-intl uses ICU message format.  Named arguments: `{email}` (not `{{email}}`).
 *   Plurals: `{count, plural, one {# win} other {# wins}}`.
 *
 * AI-generated content
 *   Pass `targetLanguage: SupportedLocale` to Convex actions.  Gemini generates
 *   natively; never generate in English and translate.
 *
 * Currency / number formatting
 *   Continue using `src/lib/currency.ts` (pure Intl, locale-aware).  Pass the
 *   BCP 47 tag from LOCALE_BCP47[locale] to the formatting helpers.
 *
 * RTL: deliberate deferred limitation
 *   All four launch locales are LTR.  LOCALE_DIR is wired through html[dir]
 *   so adding Arabic later is a config change in routing.ts, not a refactor.
 * ──────────────────────────────────────────────────────────────────────────────
 */
export {
  routing,
  SUPPORTED_LOCALES,
  LOCALE_BCP47,
  LOCALE_DIR,
  type SupportedLocale,
} from './routing'

// Re-export navigation helpers so consumers import from '@/i18n' rather than
// directly from 'next-intl/navigation'.
export { Link, redirect, usePathname, useRouter } from './navigation'
