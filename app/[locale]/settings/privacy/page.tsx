/**
 * Privacy & Data page.
 *
 * Plain-language explanation of what data RaiseHER collects, how it is used,
 * and what controls the user has. The data deletion request and the Privacy
 * Policy / Terms links live here.
 *
 * This is a server component. The interactive deletion request is delegated
 * to the PrivacyPage client component at the bottom.
 */
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { PrivacyPage } from '@/components/settings/PrivacyPage'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'settings' })
  return { title: t('privacy') }
}

export default async function PrivacyDataPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'settings' })

  return (
    <main id="main-content" className="px-4 py-8 max-w-lg mx-auto">
      {/* Back link */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-caption text-ink-soft hover:text-ink mb-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep rounded-sm"
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t('title')}
      </Link>

      <h1 className="text-headline font-display font-bold text-ink mb-8">
        {t('privacy')}
      </h1>

      {/* What we collect */}
      <section aria-labelledby="collect-heading" className="mb-8">
        <h2
          id="collect-heading"
          className="text-subhead font-display font-bold text-ink mb-3"
        >
          {t('privacy_collect_heading')}
        </h2>
        <div className="flex flex-col gap-3 text-body text-ink-soft">
          <p>{t('privacy_collect_body_1')}</p>
          <p>{t('privacy_collect_body_2')}</p>
        </div>
      </section>

      {/* How we use it */}
      <section aria-labelledby="usage-heading" className="mb-8">
        <h2
          id="usage-heading"
          className="text-subhead font-display font-bold text-ink mb-3"
        >
          {t('privacy_use_heading')}
        </h2>
        <div className="flex flex-col gap-3 text-body text-ink-soft">
          <p>{t('privacy_use_body_1')}</p>
          <p>{t('privacy_use_body_2')}</p>
        </div>
      </section>

      {/* Your controls */}
      <section aria-labelledby="controls-heading" className="mb-8">
        <h2
          id="controls-heading"
          className="text-subhead font-display font-bold text-ink mb-3"
        >
          {t('privacy_controls_heading')}
        </h2>
        <div className="flex flex-col gap-3 text-body text-ink-soft">
          <p>{t('privacy_controls_body_1')}</p>
          <p>{t('privacy_controls_body_2')}</p>
        </div>
      </section>

      {/* Links */}
      <section aria-labelledby="links-heading" className="mb-8">
        <h2
          id="links-heading"
          className="text-subhead font-display font-bold text-ink mb-3"
        >
          {t('privacy_docs_heading')}
        </h2>
        <div className="flex flex-col gap-2">
          <Link
            href="/legal/privacy"
            className="text-body text-accent-deep hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep rounded-sm"
          >
            {t('privacy_policy')}
          </Link>
          <Link
            href="/legal/terms"
            className="text-body text-accent-deep hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep rounded-sm"
          >
            {t('terms')}
          </Link>
        </div>
      </section>

      {/* Gemini disclosure */}
      <p className="text-caption text-ink-muted mb-8">
        {t('google_gemini_disclosure')}
      </p>

      {/* Interactive deletion flow */}
      <PrivacyPage />
    </main>
  )
}
