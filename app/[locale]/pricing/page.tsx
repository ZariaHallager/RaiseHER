/**
 * Pricing page.
 *
 * Three tiers: Free / Season Pass / Teams Pilot.
 * Season Pass and Teams Pilot use the existing Stripe checkout action.
 * All copy server-rendered for SEO. The checkout buttons are client components.
 *
 * Design: flat fills, amber accent badge, no gradients.
 */
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { CheckoutButton } from './CheckoutButton'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pricing' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://raiseher.app'

  return {
    title: t('page_title'),
    description: t('page_description'),
    alternates: {
      canonical: `${appUrl}/${locale}/pricing`,
    },
    openGraph: {
      title: `${t('page_title')} | RaiseHER`,
      description: t('page_description'),
    },
  }
}

function CheckMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0 mt-0.5"
    >
      <path
        d="M3 8.5L6.5 12L13 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pricing' })
  const tm = await getTranslations({ locale, namespace: 'marketing' })
  const tc = await getTranslations({ locale, namespace: 'common' })

  const freePlanFeatures = [
    t('free_feature1'),
    t('free_feature2'),
    t('free_feature3'),
    t('free_feature4'),
  ]

  const passPlanFeatures = [
    t('pass_feature1'),
    t('pass_feature2'),
    t('pass_feature3'),
    t('pass_feature4'),
  ]

  const teamsPlanFeatures = [
    t('teams_feature1'),
    t('teams_feature2'),
    t('teams_feature3'),
    t('teams_feature4'),
  ]

  const faqs = [
    { q: t('faq1_q'), a: t('faq1_a') },
    { q: t('faq2_q'), a: t('faq2_a') },
    { q: t('faq3_q'), a: t('faq3_a') },
    { q: t('faq4_q'), a: t('faq4_a') },
  ]

  return (
    <main id="main-content" className="min-h-[calc(100svh-56px)]">
      {/* ── Header ─────────────────────────────────────────── */}
      <section
        aria-labelledby="pricing-heading"
        className="px-4 py-16 text-center bg-surface border-b border-border"
      >
        <p className="text-label font-bold tracking-[0.15em] text-accent-deep uppercase mb-4">
          {tc('app_name')}
        </p>
        <h1
          id="pricing-heading"
          className="font-display text-display text-ink mb-4"
        >
          {t('headline')}
        </h1>
        <p className="text-subhead text-ink-soft max-w-lg mx-auto">
          {t('subheadline')}
        </p>
      </section>

      {/* ── Plan cards ─────────────────────────────────────── */}
      <section aria-label="Plans" className="px-4 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

          {/* Free */}
          <article
            aria-label={t('free_name')}
            className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-4"
          >
            <header className="flex flex-col gap-1">
              <h2 className="text-subhead font-bold text-ink">{t('free_name')}</h2>
              <p className="text-caption text-ink-soft">{t('free_tagline')}</p>
            </header>

            <div className="py-3 border-y border-border">
              <span className="text-headline font-bold text-ink">{t('free_price')}</span>
            </div>

            <ul className="flex flex-col gap-2 list-none flex-1" aria-label={`${t('free_name')} features`}>
              {freePlanFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-body text-ink-soft">
                  <span className="text-success"><CheckMark /></span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/sign-up"
              className={[
                'inline-flex items-center justify-center mt-2',
                'font-bold text-body rounded-lg px-6 py-4',
                'border-[1.5px] border-ink text-ink bg-transparent',
                'transition-transform active:scale-[0.97]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep',
              ].join(' ')}
            >
              {t('free_cta')}
            </Link>
          </article>

          {/* Season Pass */}
          <article
            aria-label={t('pass_name')}
            className="bg-surface border-2 border-accent rounded-lg p-6 flex flex-col gap-4 relative"
          >
            <span
              className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-on-accent text-label font-bold px-3 py-1 rounded-sm uppercase tracking-[0.08em]"
              aria-label={t('pass_badge')}
            >
              {t('pass_badge')}
            </span>

            <header className="flex flex-col gap-1 mt-2">
              <h2 className="text-subhead font-bold text-ink">{t('pass_name')}</h2>
              <p className="text-caption text-ink-soft">{t('pass_tagline')}</p>
            </header>

            <div className="py-3 border-y border-border flex items-baseline gap-2">
              <span className="text-headline font-bold text-ink">$97</span>
              <span className="text-caption text-ink-muted">{t('per_year')}</span>
            </div>

            <ul className="flex flex-col gap-2 list-none flex-1" aria-label={`${t('pass_name')} features`}>
              {passPlanFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-body text-ink-soft">
                  <span className="text-success"><CheckMark /></span>
                  {f}
                </li>
              ))}
            </ul>

            <CheckoutButton
              product="season_pass"
              label={t('pass_cta')}
              redirectingLabel={t('redirecting')}
              errorLabel={t('error_generic')}
              className="bg-ink text-ink-inverse mt-2"
            />
          </article>

          {/* Teams Pilot */}
          <article
            aria-label={t('teams_name')}
            className="bg-surface border border-border rounded-lg p-6 flex flex-col gap-4"
          >
            <header className="flex flex-col gap-1">
              <h2 className="text-subhead font-bold text-ink">{t('teams_name')}</h2>
              <p className="text-caption text-ink-soft">{t('teams_tagline')}</p>
            </header>

            <div className="py-3 border-y border-border flex items-baseline gap-2">
              <span className="text-headline font-bold text-ink">$497</span>
              <span className="text-caption text-ink-muted">{t('per_year')}</span>
            </div>

            <ul className="flex flex-col gap-2 list-none flex-1" aria-label={`${t('teams_name')} features`}>
              {teamsPlanFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-body text-ink-soft">
                  <span className="text-success"><CheckMark /></span>
                  {f}
                </li>
              ))}
            </ul>

            <CheckoutButton
              product="teams_pilot"
              label={t('teams_cta')}
              redirectingLabel={t('redirecting')}
              errorLabel={t('error_generic')}
              className="border-[1.5px] border-ink text-ink bg-transparent mt-2"
            />
          </article>
        </div>

        {/* Trust line */}
        <p className="text-caption text-ink-muted text-center mt-8 max-w-lg mx-auto">
          {t('stripe_trust')}
        </p>
        <p className="text-caption text-ink-muted text-center mt-2 max-w-lg mx-auto">
          {t('disclosure')}
        </p>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="faq-heading"
        className="px-4 py-16 bg-surface border-t border-border"
      >
        <div className="max-w-2xl mx-auto">
          <h2
            id="faq-heading"
            className="font-display text-headline text-ink mb-10 text-center"
          >
            {t('faq_heading')}
          </h2>

          <dl className="flex flex-col gap-6">
            {faqs.map(({ q, a }) => (
              <div key={q} className="border-b border-border pb-6 last:border-b-0 last:pb-0">
                <dt className="text-body font-bold text-ink mb-2">{q}</dt>
                <dd className="text-body text-ink-soft">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="px-4 py-12 border-t border-border" role="contentinfo">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-label font-bold tracking-[0.15em] text-ink uppercase">
            {tc('app_name')}
          </span>
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 list-none text-caption text-ink-soft">
              <li>
                <Link href="/" className="hover:text-ink transition-colors">
                  {tc('not_found_home')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-ink transition-colors">
                  {tm('footer_privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-ink transition-colors">
                  {tm('footer_terms')}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </main>
  )
}
