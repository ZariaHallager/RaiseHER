/**
 * Public share page for a Case File brief.
 *
 * No authentication required. The share token is opaque and not guessable.
 * Renders a minimal layout (no nav, no bottom tab bar) with the brief and
 * a call-to-action to create an account on RaiseHER.
 *
 * This route is excluded from locale routing by the middleware (see middleware.ts).
 * The page renders with no locale context; all static text is in English.
 * The brief content itself was generated natively in the user's chosen language.
 */
import type { Metadata } from 'next'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@convex/_generated/api'
import { Inter, Playfair_Display } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { ShareBriefClient } from '@/components/case-files/ShareBriefClient'
import '../../globals.css'
import enMessages from '../../../messages/en.json'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-playfair',
  display: 'swap',
})

type Props = {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params

  const cf = await fetchQuery(api.caseFiles.getCaseFileByToken, {
    shareToken: token,
  }).catch(() => null)

  const title = cf?.brief
    ? ((cf.brief as Record<string, unknown>).headline as string) ?? 'Raise Case Brief'
    : 'Raise Case Brief'

  return {
    title: `${title} | RaiseHER`,
    description: 'A raise case brief built with RaiseHER.',
    robots: { index: false, follow: false },
  }
}

export default async function SharePage({ params }: Props) {
  const { token } = await params

  const cf = await fetchQuery(api.caseFiles.getCaseFileByToken, {
    shareToken: token,
  }).catch(() => null)

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <ShareBriefClient caseFile={cf} />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
