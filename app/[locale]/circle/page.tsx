/**
 * The Circle page.
 *
 * Protected route (requires sign-in via middleware).
 * Shows the anonymized aggregate Total Raised counter and outcome stats,
 * then the outcome reporting form.
 *
 * The CircleView client component owns all reactive Convex data.
 */
import { getTranslations } from 'next-intl/server'
import { CircleView } from '@/components/circle/CircleView'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'circle' })
  return { title: t('title') }
}

export default async function CirclePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'circle' })

  return (
    <main id="main-content" className="px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-headline font-display font-bold text-ink mb-1">
        {t('title')}
      </h1>
      <p className="text-body text-ink-soft mb-8">{t('subtitle')}</p>

      <CircleView />
    </main>
  )
}
