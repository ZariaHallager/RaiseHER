/**
 * Locale-aware root layout.
 *
 * Every route under /[locale]/** renders inside this layout.
 * Responsibilities:
 *   Set html[lang] from the active locale (BCP 47 tag).
 *   Set html[dir] from LOCALE_DIR; wired for future RTL without a refactor.
 *   Provide NextIntlClientProvider so Client Components can call useTranslations.
 *   Mount ClerkProvider with the locale-matched localization bundle.
 *   Render a skip-to-content link as the first focusable element (WCAG 2.4.1).
 *   Emit hreflang link alternates in head for SEO.
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Inter, Playfair_Display } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { ClerkProvider } from '@clerk/nextjs'
import {
  enUS,
  esES,
  frFR,
  ptBR,
} from '@clerk/localizations'
import '../globals.css'
import { routing, SUPPORTED_LOCALES, LOCALE_BCP47, LOCALE_DIR, type SupportedLocale } from '@/i18n/routing'
import { ConvexClerkProvider } from '@/components/providers/ConvexClerkProvider'
import { RouteAnnouncer } from '@/components/shell/RouteAnnouncer'
import { TopNav } from '@/components/shell/TopNav'
import { BottomTabBar } from '@/components/shell/BottomTabBar'

/**
 * Inter: variable font, Latin + Latin Extended.
 * Covers all accented characters in es/fr/pt.
 * Downloaded at build time; no browser-to-Google Fonts request.
 */
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

/**
 * Playfair Display: variable font, Latin + Latin Extended.
 * Used for display and headline type steps.
 */
const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-playfair',
  display: 'swap',
})

const CLERK_LOCALIZATIONS = {
  en: enUS,
  es: esES,
  fr: frFR,
  pt: ptBR,
} as const

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) return {}

  const t = await getTranslations({ locale, namespace: 'onboarding' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://raiseher.app'

  return {
    title: {
      default: 'RaiseHER',
      template: '%s | RaiseHER',
    },
    description: t('welcome_subtitle'),
    metadataBase: new URL(appUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [LOCALE_BCP47[l as SupportedLocale], `/${l}`])
      ) as Record<string, string>,
    },
  }
}

// Skip-link copy is infrastructure text, not translatable product copy.
const SKIP_TO_MAIN = 'Skip to main content'

/**
 * Returns true when Clerk can be safely initialised in the current runtime.
 *
 * Development-mode publishable keys (pk_test_*) are restricted to localhost by
 * Clerk's backend and will cause ClerkProvider to throw on any other domain.
 * We allow them in development (NODE_ENV !== 'production') so local dev still
 * works, and skip ClerkProvider in production until real keys are configured.
 */
function isClerkConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  if (!key) return false
  if (key.startsWith('pk_live_')) return true
  if (key.startsWith('pk_test_') && process.env.NODE_ENV !== 'production') return true
  return false
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  // Reject unknown locales; triggers the nearest not-found boundary.
  if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    notFound()
  }

  const messages = await getMessages()
  const bcp47 = LOCALE_BCP47[locale as SupportedLocale]
  const dir = LOCALE_DIR[locale as SupportedLocale]
  const clerkLocalization = CLERK_LOCALIZATIONS[locale as SupportedLocale]
  const clerkReady = isClerkConfigured()

  const innerContent = (
    <NextIntlClientProvider messages={messages}>
      {/*
        RouteAnnouncer inside the provider so its usePathname call has access
        to the locale context. It renders before all nav landmarks so screen
        readers don't include it in nav regions.
      */}
      <RouteAnnouncer />

      {/* Sticky top nav: tablet and wider only. */}
      <TopNav clerkReady={clerkReady} />

      {/*
        Page content area. On mobile the fixed BottomTabBar (56 px +
        safe-area inset) sits on top of the viewport, so we add
        equivalent bottom padding to keep content clear of it.
        On md+ the TopNav is sticky and there is no bottom bar.
      */}
      <div className="pb-20 md:pb-0">
        {children}
      </div>

      {/* Mobile bottom tab bar: hidden on md+. */}
      <BottomTabBar />
    </NextIntlClientProvider>
  )

  return (
    <html
      lang={bcp47}
      dir={dir}
      className={`${inter.variable} ${playfair.variable}`}
    >
      <body>

        {/* First focusable element on every page; resolves to #main-content. */}
        <a href="#main-content" className="skip-link">
          {SKIP_TO_MAIN}
        </a>

        {clerkReady ? (
          <ClerkProvider
            localization={clerkLocalization}
            signInUrl={`/${locale}/sign-in`}
            signUpUrl={`/${locale}/sign-up`}
            signInFallbackRedirectUrl={`/${locale}/pay-gap`}
            signUpFallbackRedirectUrl={`/${locale}/pay-gap`}
          >
            <ConvexClerkProvider>
              {innerContent}
            </ConvexClerkProvider>
          </ClerkProvider>
        ) : (
          innerContent
        )}
      </body>
    </html>
  )
}
