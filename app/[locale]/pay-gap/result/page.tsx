/**
 * Pay Gap result page.
 *
 * Protected route (requires sign-in via middleware).
 *
 * Renders the PayGapResult client component which subscribes to the user's
 * most recent pay-gap profile in real time via Convex. The ?new=1 query
 * parameter signals that an analysis was just queued; the component uses
 * this to show a purposeful loading state while the AI generates the result.
 */
import { PayGapResult } from '@/components/pay-gap/PayGapResult'

type Props = {
  searchParams: Promise<{ new?: string }>
}

export default async function PayGapResultPage({ searchParams }: Props) {
  const params = await searchParams
  const isNew = params.new === '1'

  return (
    <main id="main-content" className="px-4 py-10 max-w-lg mx-auto">
      <PayGapResult isNew={isNew} />
    </main>
  )
}
