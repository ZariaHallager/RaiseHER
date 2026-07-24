/**
 * Settings page.
 *
 * Protected route. Renders the full settings surface as a server wrapper
 * around the SettingsPage client component.
 */
import { getTranslations } from 'next-intl/server'
import { SettingsPage } from '@/components/settings/SettingsPage'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'settings' })
  return { title: t('title') }
}

export default async function Settings({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'settings' })

  return (
    <main id="main-content" className="px-4 py-8 max-w-lg mx-auto">
      <h1 className="text-headline font-display font-bold text-ink mb-8">
        {t('title')}
      </h1>

      <SettingsPage />
    </main>
  )
}
