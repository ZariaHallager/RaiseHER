/**
 * Public marketing landing page.
 *
 * Shown to all visitors at /{locale}.
 * Server component: locale and translations resolved on the server for SEO.
 *
 * Sections:
 *   TopNav (injected by layout)
 *   Hero: headline, subheadline, auth CTAs
 *   Features: four tool cards in a 2x2 grid
 *   Community: Circle proof section
 *   Pricing CTA: nudge toward the pricing page
 *   Footer: legal links + language + tagline
 */
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { LanguagePicker } from '@/components/onboarding/LanguagePicker'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://raiseher.app'

  return {
    title: 'RaiseHER',
    description: t('hero_subheadline'),
    openGraph: {
      title: 'RaiseHER',
      description: t('hero_subheadline'),
      url: `${appUrl}/${locale}`,
      siteName: 'RaiseHER',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'RaiseHER',
      description: t('hero_subheadline'),
    },
  }
}

const FEATURE_ICONS = [
  /* Pay Gap */ (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" key="paygap">
      <rect x="3" y="14" width="4" height="7" rx="1" fill="currentColor" />
      <rect x="10" y="9" width="4" height="12" rx="1" fill="currentColor" />
      <rect x="17" y="4" width="4" height="17" rx="1" fill="currentColor" opacity="0.35" />
      <path d="M5 12L12 7L19 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  /* Wins */ (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" key="wins">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  /* Rehearsal */ (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" key="rehearsal">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" />
      <path d="M8.5 15C9.5 16.5 14.5 16.5 15.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  /* Case File */ (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" key="casefile">
      <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 8H15M9 12H15M9 16H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
]

export default async function LandingPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketing' })
  const to = await getTranslations({ locale, namespace: 'onboarding' })
  const tc = await getTranslations({ locale, namespace: 'common' })

  const features = [
    {
      label: t('feature1_label'),
      title: t('feature1_title'),
      body: t('feature1_body'),
      icon: FEATURE_ICONS[0],
    },
    {
      label: t('feature2_label'),
      title: t('feature2_title'),
      body: t('feature2_body'),
      icon: FEATURE_ICONS[1],
    },
    {
      label: t('feature3_label'),
      title: t('feature3_title'),
      body: t('feature3_body'),
      icon: FEATURE_ICONS[2],
    },
    {
      label: t('feature4_label'),
      title: t('feature4_title'),
      body: t('feature4_body'),
      icon: FEATURE_ICONS[3],
    },
  ]

  return (
    <main id="main-content">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="hero-heading"
        className="min-h-[calc(100svh-56px)] flex flex-col items-center justify-center px-4 py-16 text-center"
      >
        <p className="text-label font-bold tracking-[0.15em] text-accent-deep uppercase mb-6">
          {tc('app_name')}
        </p>

        <h1
          id="hero-heading"
          className="font-display text-display text-ink max-w-2xl leading-tight mb-4"
        >
          {t('hero_headline')}
        </h1>

        <p className="text-subhead text-ink-soft max-w-lg mb-10">
          {t('hero_subheadline')}
        </p>

        {/* Auth CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto mb-10">
          <Link
            href="/sign-up"
            className={[
              'inline-flex items-center justify-center',
              'font-bold text-body rounded-lg px-8 py-4',
              'bg-ink text-ink-inverse',
              'transition-transform active:scale-[0.97]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep',
            ].join(' ')}
          >
            {t('hero_cta_primary')}
          </Link>

          <Link
            href="/pricing"
            className={[
              'inline-flex items-center justify-center',
              'font-bold text-body rounded-lg px-8 py-4',
              'border-[1.5px] border-ink text-ink bg-transparent',
              'transition-transform active:scale-[0.97]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep',
            ].join(' ')}
          >
            {t('hero_cta_secondary')}
          </Link>
        </div>

        {/* Language picker */}
        <div className="w-full max-w-xs">
          <LanguagePicker />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section
        aria-label="Features"
        className="px-4 py-20 bg-surface"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-headline text-ink text-center mb-14">
            {to('slide2_heading')}
          </h2>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6 list-none">
            {features.map((feature) => (
              <li
                key={feature.label}
                className="bg-canvas border border-border rounded-lg p-6 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-accent-deep">
                    {feature.icon}
                  </span>
                  <span className="text-label font-bold tracking-[0.1em] text-accent-deep uppercase">
                    {feature.label}
                  </span>
                </div>
                <h3 className="text-subhead font-bold text-ink">
                  {feature.title}
                </h3>
                <p className="text-body text-ink-soft">
                  {feature.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Community proof ───────────────────────────────────── */}
      <section
        aria-label="Community outcomes"
        className="px-4 py-20"
      >
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-block bg-accent rounded-sm px-3 py-1 text-label font-bold text-on-accent uppercase tracking-[0.1em] mb-6">
            {t('circle_badge')}
          </div>
          <h2 className="font-display text-headline text-ink mb-4">
            {t('community_headline')}
          </h2>
          <p className="text-body text-ink-soft mb-8">
            {t('community_body')}
          </p>
          <Link
            href="/sign-up"
            className={[
              'inline-flex items-center justify-center',
              'font-semibold text-body rounded-lg px-6 py-3',
              'bg-accent text-on-accent',
              'transition-transform active:scale-[0.97]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep',
            ].join(' ')}
          >
            {t('community_cta')}
          </Link>
        </div>
      </section>

      {/* ── Pricing CTA ───────────────────────────────────────── */}
      <section
        aria-label="Pricing"
        className="px-4 py-20 bg-surface border-t border-border"
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-headline text-ink mb-4">
            {t('pricing_section_headline')}
          </h2>
          <Link
            href="/pricing"
            className={[
              'inline-flex items-center justify-center',
              'font-bold text-body rounded-lg px-8 py-4',
              'bg-ink text-ink-inverse',
              'transition-transform active:scale-[0.97]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep',
            ].join(' ')}
          >
            {t('pricing_section_cta')}
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="px-4 py-12 border-t border-border" role="contentinfo">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <span className="text-label font-bold tracking-[0.15em] text-ink uppercase">
              {tc('app_name')}
            </span>

            <nav aria-label="Footer navigation">
              <ul className="flex flex-wrap justify-center sm:justify-end gap-x-6 gap-y-2 list-none text-caption text-ink-soft">
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-ink transition-colors focus-visible:outline-accent-deep"
                  >
                    {t('footer_pricing')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-ink transition-colors focus-visible:outline-accent-deep"
                  >
                    {t('footer_privacy')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-ink transition-colors focus-visible:outline-accent-deep"
                  >
                    {t('footer_terms')}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <p className="text-caption text-ink-muted text-center sm:text-left">
            {t('footer_tagline')}
          </p>
        </div>
      </footer>
    </main>
  )
}
