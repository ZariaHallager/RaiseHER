/**
 * Case Files list page.
 *
 * Protected route (requires sign-in via middleware).
 * Renders the heading and the CaseFileList client component which owns
 * generation, listing, and deletion.
 */
import { getTranslations } from 'next-intl/server'
import { CaseFileList } from '@/components/case-files/CaseFileList'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'casefiles' })
  return {
    title: t('title'),
    description: t('subtitle'),
  }
}

export default async function CaseFilesPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'casefiles' })

  return (
    <main id="main-content" className="px-4 py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-headline font-display font-bold text-ink mb-2">
          {t('title')}
        </h1>
        <p className="text-body text-ink-soft">{t('subtitle')}</p>
      </div>

      <CaseFileList />
    </main>
  )
}
