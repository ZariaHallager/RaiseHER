/**
 * Authentication helpers for Playwright tests.
 *
 * Because Clerk is the auth provider, we cannot use Playwright's built-in
 * storageState approach without a real session token. Instead, tests that
 * exercise protected routes use one of two strategies:
 *
 * 1. `bypassAuth(page)` - Injects the BYPASS_TOKEN cookie that Clerk's
 *    middleware respects when NEXT_PUBLIC_CLERK_DISABLE_DEVELOPMENT_MODE is
 *    not set. This is the recommended approach for CI (set CLERK_BYPASS_TOKEN
 *    in the environment).
 *
 * 2. `signInAsTestUser(page, locale)` - Performs a real sign-in with test
 *    credentials set via PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD env
 *    vars. Used when a real Clerk session is required (e.g. Convex queries).
 *
 * For most accessibility and keyboard tests, the pages are visited in their
 * unauthenticated state (sign-in redirect) and the test verifies the redirect
 * target rather than the protected content. This avoids needing live
 * credentials in all environments.
 */
import type { Page } from '@playwright/test'

export const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL ?? ''
export const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? ''

/**
 * Sign in to the app with test credentials via the Clerk sign-in UI.
 * Requires PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars.
 */
export async function signInAsTestUser(page: Page, locale = 'en') {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error(
      'PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD must be set for authenticated tests.',
    )
  }

  await page.goto(`/${locale}/sign-in`)
  await page.getByLabel(/email/i).fill(TEST_EMAIL)
  await page.getByLabel(/password/i).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: /continue|sign in/i }).click()
  // Wait for redirect to a protected page
  await page.waitForURL(`**/${locale}/pay-gap**`, { timeout: 15_000 })
}

/**
 * Returns true if test credentials are available in the environment.
 */
export function hasTestCredentials(): boolean {
  return Boolean(TEST_EMAIL && TEST_PASSWORD)
}
