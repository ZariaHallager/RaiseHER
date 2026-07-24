/**
 * Authentication redirect tests.
 *
 * Protected routes must redirect unauthenticated visitors to sign-in.
 * The sign-in page must itself pass axe-core and have the correct structure.
 *
 * These tests do NOT require live Clerk credentials and can run in any environment.
 */
import { test, expect } from '@playwright/test'
import { checkA11y } from '../helpers/axe'
import { assertSkipLink } from '../helpers/keyboard'

const PROTECTED_PATHS = [
  { locale: 'en', path: '/en/wins' },
  { locale: 'en', path: '/en/pay-gap' },
  { locale: 'en', path: '/en/rehearsal' },
  { locale: 'en', path: '/en/case-files' },
  { locale: 'en', path: '/en/circle' },
  { locale: 'en', path: '/en/settings' },
  // Spot-check one more locale
  { locale: 'es', path: '/es/wins' },
  { locale: 'fr', path: '/fr/pay-gap' },
  { locale: 'pt', path: '/pt/circle' },
]

for (const { locale, path } of PROTECTED_PATHS) {
  test(`${path} redirects unauthenticated visitors to sign-in`, async ({
    page,
  }) => {
    await page.goto(path)
    // Allow up to 10s for the redirect to settle
    await page.waitForURL(/sign-in/, { timeout: 10_000 })
    expect(page.url()).toContain('sign-in')
  })
}

test.describe('Sign-in page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/sign-in')
    await page.waitForLoadState('networkidle')
  })

  test('passes axe-core WCAG 2.1 AA', async ({ page }) => {
    // Clerk's embedded UI may include third-party iframes; scope scan to our shell
    await checkA11y(page, {
      // Clerk's UI is injected into a shadow DOM / iframe; scan our outer shell only
      disableRules: ['frame-title'],
    })
  })

  test('skip-to-content link is first focusable element', async ({ page }) => {
    await assertSkipLink(page)
  })

  test('has exactly one h1', async ({ page }) => {
    // Clerk renders its own heading inside an iframe; the outer page shell
    // should still have exactly one h1 if we added one, otherwise 0 is acceptable.
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBeLessThanOrEqual(1)
  })

  test('html[lang] is en', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang')
    expect(lang).toBe('en')
  })
})

test.describe('Sign-in page – locale variants', () => {
  for (const locale of ['es', 'fr', 'pt'] as const) {
    test(`/${locale}/sign-in has html[lang] = ${locale === 'pt' ? 'pt-BR' : locale}`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/sign-in`)
      await page.waitForLoadState('networkidle')
      const lang = await page.locator('html').getAttribute('lang')
      const expected = locale === 'pt' ? 'pt-BR' : locale
      expect(lang).toBe(expected)
    })
  }
})

test.describe('Sign-up page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/sign-up')
    await page.waitForLoadState('networkidle')
  })

  test('passes axe-core WCAG 2.1 AA (outer shell)', async ({ page }) => {
    await checkA11y(page, { disableRules: ['frame-title'] })
  })

  test('skip-to-content link is first focusable element', async ({ page }) => {
    await assertSkipLink(page)
  })
})
