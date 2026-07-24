/**
 * Individual Case File brief page.
 *
 * Protected route (requires sign-in via middleware).
 * Fetches the case file server-side (metadata only) and renders the
 * CaseFileBriefLoader client component which does the live Convex query
 * so the status can update reactively if generation is still in progress.
 */
import { getTranslations } from 'next-intl/server'
import { CaseFileBriefLoader } from '@/components/case-files/CaseFileBriefLoader'

type Props = {
  params: Promise<{ locale: string; caseFileId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'casefiles' })
  return { title: t('title') }
}

export default async function CaseFilePage({ params }: Props) {
  const { caseFileId } = await params
  return <CaseFileBriefLoader caseFileId={caseFileId} />
}
