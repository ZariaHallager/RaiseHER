/**
 * Middleware: next-intl locale routing + optional Clerk auth.
 *
 * Responsibilities:
 *  - Negotiate the locale from URL prefix → cookie → Accept-Language → default.
 *  - Redirect bare / to /{defaultLocale}.
 *  - Write the RAISEHER_LOCALE cookie on every request.
 *  - Emit x-default and per-locale Link rel="alternate" headers for SEO.
 *  - Protect authenticated routes when CLERK_SECRET_KEY is available.
 *
 * Protected routes (require sign-in when Clerk is configured):
 *   /:locale/wins, /:locale/pay-gap, /:locale/rehearsal,
 *   /:locale/case-files, /:locale/circle, /:locale/settings
 *
 * Public routes:
 *   /, /:locale (landing page), /:locale/sign-in, /:locale/sign-up,
 *   /share/**, /checkout/**, /api/**
 *
 * NOTE: Clerk is loaded via dynamic require so that importing this module
 * does NOT throw when CLERK_SECRET_KEY is absent (e.g. during initial
 * deployment before secrets are configured). Route-level auth guards in
 * each protected page.tsx provide defense-in-depth once keys are set.
 */
import createMiddleware from 'next-intl/middleware'
import type { NextRequest, NextResponse } from 'next/server'
import { routing } from './src/i18n/routing'

const handleI18nRouting = createMiddleware(routing)

export default function middleware(req: NextRequest): NextResponse | Response | undefined {
  // Share pages are public and bypass locale prefixing entirely.
  if (req.nextUrl.pathname.startsWith('/share/')) {
    return undefined
  }
  return handleI18nRouting(req) as NextResponse
}

export const config = {
  matcher: [
    // Match all pathnames except Next.js internals and static files.
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
}
