/**
 * Privacy Policy page.
 *
 * Fully server-rendered for SEO. All copy from the 'privacy' translation
 * namespace so every language gets its own indexed page.
 */
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'privacy' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://raiseher.app'

  return {
    title: t('page_title'),
    description: t('page_description'),
    alternates: {
      canonical: `${appUrl}/${locale}/privacy`,
    },
  }
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'privacy' })
  const tc = await getTranslations({ locale, namespace: 'common' })
  const tm = await getTranslations({ locale, namespace: 'marketing' })

  const sections = [
    { heading: t('s1_heading'), body: t('s1_body') },
    { heading: t('s2_heading'), body: t('s2_body') },
    { heading: t('s3_heading'), body: t('s3_body') },
    { heading: t('s4_heading'), body: t('s4_body') },
    { heading: t('s5_heading'), body: t('s5_body') },
    { heading: t('s6_heading'), body: t('s6_body') },
    { heading: t('s7_heading'), body: t('s7_body') },
    { heading: t('s8_heading'), body: t('s8_body') },
    { heading: t('s9_heading'), body: t('s9_body') },
    { heading: t('s10_heading'), body: t('s10_body') },
    { heading: t('s11_heading'), body: t('s11_body') },
  ]

  return (
    <main id="main-content" className="min-h-[calc(100svh-56px)]">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="px-4 py-12 border-b border-border bg-surface">
        <div className="max-w-2xl mx-auto">
          <p className="text-caption text-ink-muted mb-2">
            {t('last_updated')}: {t('last_updated_date')}
          </p>
          <h1 className="font-display text-headline text-ink mb-4">
            {t('headline')}
          </h1>
          <p className="text-body text-ink-soft">
            {t('intro')}
          </p>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────── */}
      <article className="px-4 py-12">
        <div className="max-w-2xl mx-auto flex flex-col gap-10">
          {sections.map(({ heading, body }) => (
            <section key={heading}>
              <h2 className="text-subhead font-bold text-ink mb-3">{heading}</h2>
              <p className="text-body text-ink-soft leading-relaxed">{body}</p>
            </section>
          ))}
        </div>
      </article>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="px-4 py-12 border-t border-border" role="contentinfo">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
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
                <Link href="/pricing" className="hover:text-ink transition-colors">
                  {tm('footer_pricing')}
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
