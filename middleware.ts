/**
 * Middleware: next-intl locale routing.
 *
 * Handles locale prefix, cookie persistence, and alternate links.
 * Clerk auth is enforced at the route page level, not middleware,
 * to avoid edge-runtime compatibility issues with Clerk's SDK.
 *
 * /share/** routes are excluded from locale prefixing because they use
 * globally-accessible tokens, not locale-prefixed paths.
 */
import createMiddleware from 'next-intl/middleware'
import {routing} from './src/i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: [
    // Match all pathnames except:
    // - Next.js internals (_next, _vercel)
    // - Static files (paths with a dot extension)
    // - Public share routes (no locale prefix needed)
    '/((?!_next|_vercel|share|.*\\..*).*)',
  ],
}
