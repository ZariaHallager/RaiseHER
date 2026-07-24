/**
 * Sign-in page.
 *
 * Renders Clerk's built-in SignIn component, which handles email/password,
 * social OAuth, and verification flows with the locale-matched UI strings
 * set by ClerkProvider in the locale layout.
 *
 * The [[...sign-in]] catch-all segment is required for Clerk's path-based
 * routing to capture sub-routes like /sign-in/sso-callback.
 */
import { SignIn } from '@clerk/nextjs'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function SignInPage({ params }: Props) {
  const { locale } = await params

  return (
    <main
      id="main-content"
      className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4 py-12"
    >
      <SignIn
        routing="path"
        path={`/${locale}/sign-in`}
        signUpUrl={`/${locale}/sign-up`}
        forceRedirectUrl={`/${locale}/pay-gap`}
      />
    </main>
  )
}
