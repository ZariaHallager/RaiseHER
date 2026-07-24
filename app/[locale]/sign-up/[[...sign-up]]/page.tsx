/**
 * Sign-up page.
 *
 * Renders Clerk's built-in SignUp component, which handles email/password
 * registration, social OAuth, and email verification with the locale-matched
 * UI strings set by ClerkProvider in the locale layout.
 *
 * The [[...sign-up]] catch-all segment is required for Clerk's path-based
 * routing to capture sub-routes like /sign-up/verify-email-address.
 */
import { SignUp } from '@clerk/nextjs'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function SignUpPage({ params }: Props) {
  const { locale } = await params

  return (
    <main
      id="main-content"
      className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4 py-12"
    >
      <SignUp
        routing="path"
        path={`/${locale}/sign-up`}
        signInUrl={`/${locale}/sign-in`}
        forceRedirectUrl={`/${locale}/pay-gap`}
      />
    </main>
  )
}
