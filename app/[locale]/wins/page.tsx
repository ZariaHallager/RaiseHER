/**
 * Wins Ledger page.
 *
 * Protected route (requires sign-in via middleware).
 * Renders the heading then the WinsLedger client component which owns
 * listing, filtering, adding, editing, and deleting wins.
 */
import { getTranslations } from 'next-intl/server'
import { WinsLedger } from '@/components/wins/WinsLedger'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'wins' })
  return { title: t('title') }
}

export default async function WinsPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'wins' })

  return (
    <main id="main-content" className="px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-headline font-display font-bold text-ink">
            {t('title')}
          </h1>
        </div>
      </div>

      <WinsLedger />
    </main>
  )
}
