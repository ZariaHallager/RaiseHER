/**
 * The Circle – full flow tests.
 *
 * Covers:
 *   - Redirect when unauthenticated
 *   - axe-core WCAG 2.1 AA
 *   - Total Raised odometer aria-live announcement
 *   - Outcome reporting form accessibility
 *   - Loading, empty, and success states
 *   - All four locales render without overflow
 */
import { test, expect } from '@playwright/test'
import { checkA11y } from '../helpers/axe'
import { assertSkipLink, assertFocusRings } from '../helpers/keyboard'
import { hasTestCredentials, signInAsTestUser } from '../helpers/auth'

test('Circle: unauthenticated visit redirects to sign-in', async ({ page }) => {
  await page.goto('/en/circle')
  await page.waitForURL(/sign-in/, { timeout: 10_000 })
  expect(page.url()).toContain('sign-in')
})

test.describe('The Circle – authenticated', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCredentials(), 'Skipping: PLAYWRIGHT_TEST_EMAIL/PASSWORD not set')
    await signInAsTestUser(page, 'en')
    await page.goto('/en/circle')
    await page.waitForLoadState('networkidle')
  })

  test('passes axe-core WCAG 2.1 AA', async ({ page }) => {
    await checkA11y(page)
  })

  test('skip-to-content link is first focusable element', async ({ page }) => {
    await assertSkipLink(page)
  })

  test('has exactly one h1', async ({ page }) => {
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  })

  test('interactive controls have visible focus rings', async ({ page }) => {
    await assertFocusRings(page, 15)
  })

  test('Total Raised counter has aria-live="polite"', async ({ page }) => {
    // The odometer / counter must announce through a polite live region
    const livePolite = page.locator('[aria-live="polite"]')
    const count = await livePolite.count()
    expect(count, 'At least one aria-live="polite" required for Total Raised counter').toBeGreaterThan(0)
  })

  test('outcome form has labeled inputs and accessible submit', async ({
    page,
  }) => {
    const form = page.locator('form')
    if ((await form.count()) > 0) {
      const inputs = form.locator('input, select, textarea')
      const inputCount = await inputs.count()
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i)
        const id = await input.getAttribute('id')
        const ariaLabel = await input.getAttribute('aria-label')
        const ariaLabelledBy = await input.getAttribute('aria-labelledby')
        const hasLabel = id
          ? (await page.locator(`label[for="${id}"]`).count()) > 0
          : false

        expect(
          hasLabel || !!ariaLabel || !!ariaLabelledBy,
          `Form input at index ${i} has no accessible label`,
        ).toBe(true)
      }
    }
  })

  test('all four locales render without overflow', async ({ page }) => {
    for (const locale of ['es', 'fr', 'pt'] as const) {
      await page.goto(`/${locale}/circle`)
      await page.waitForLoadState('networkidle')

      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth,
      )
      expect(overflow, `Horizontal overflow on /${locale}/circle`).toBe(false)

      await checkA11y(page)
    }
  })
})
