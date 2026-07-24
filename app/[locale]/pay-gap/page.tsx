/**
 * Pay Gap intake form page.
 *
 * Protected route (requires sign-in via middleware).
 * Renders a heading/subtitle then the IntakeForm client component.
 */
import { getTranslations } from 'next-intl/server'
import { IntakeForm } from '@/components/pay-gap/IntakeForm'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function PayGapPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'onboarding' })

  return (
    <main id="main-content" className="px-4 py-10 max-w-lg mx-auto">
      <h1 className="text-headline font-display font-bold text-ink mb-2">
        {t('paygap_title')}
      </h1>
      <p className="text-body text-ink-soft mb-8">
        {t('paygap_subtitle')}
      </p>

      <IntakeForm />
    </main>
  )
}
