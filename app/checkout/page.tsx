import { redirect } from 'next/navigation'
import CheckoutForm from './CheckoutForm'
import { createCheckoutUrl } from './actions'

/**
 * Checkout landing page.
 *
 * Query params:
 *   ?product=teams_pilot  - pre-select Teams Pilot and jump straight to Stripe
 *   ?product=season_pass  - pre-select Season Pass and jump straight to Stripe
 *   (no param)            - show product selection UI
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>
}) {
  const params = await searchParams
  const product = params.product

  if (product === 'teams_pilot' || product === 'season_pass') {
    const url = await createCheckoutUrl(product)
    if (url) redirect(url)
  }

  return <CheckoutForm />
}
