/**
 * Root page: immediately redirects to the default locale.
 * The middleware handles locale negotiation for normal traffic; this page
 * is a fallback for static-export edge cases and direct root hits.
 */
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/en')
}
