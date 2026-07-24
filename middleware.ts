/**
 * Middleware: Clerk auth + next-intl locale routing.
 *
 * Responsibilities:
 *  - Verify the Clerk session token on every request (clerkMiddleware).
 *  - Protect authenticated routes: redirect to sign-in if not signed in.
 *  - Negotiate the locale from URL prefix → cookie → Accept-Language → default.
 *  - Redirect bare / to /{defaultLocale}.
 *  - Write the RAISEHER_LOCALE cookie on every request.
 *  - Emit x-default and per-locale Link rel="alternate" headers for SEO.
 *
 * Protected routes (require sign-in):
 *   /:locale/wins, /:locale/pay-gap, /:locale/rehearsal,
 *   /:locale/case-files, /:locale/circle, /:locale/settings
 *
 * Public routes (accessible without sign-in):
 *   /, /:locale (landing page), /:locale/sign-in, /:locale/sign-up,
 *   /checkout/**, /api/**
 */
import createMiddleware from 'next-intl/middleware'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'
import { routing } from './src/i18n/routing'

const handleI18nRouting = createMiddleware(routing)

const isProtectedRoute = createRouteMatcher([
  '/:locale/wins(.*)',
  '/:locale/pay-gap(.*)',
  '/:locale/rehearsal(.*)',
  '/:locale/case-files(.*)',
  '/:locale/circle(.*)',
  '/:locale/settings(.*)',
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
  // The /share/** routes are public and don't need locale prefixing.
  if (req.nextUrl.pathname.startsWith('/share/')) {
    return
  }
  return handleI18nRouting(req)
})

export const config = {
  matcher: [
    // Match all pathnames except Next.js internals and static files.
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
}
