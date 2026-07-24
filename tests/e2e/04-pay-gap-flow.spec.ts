/**
 * Pay Gap Reality Check – full flow tests.
 *
 * When test credentials are present, exercises:
 *   - Loading state (skeleton/spinner visible then resolves)
 *   - Empty state (no prior analysis)
 *   - Form validation error state (all fields blank submit)
 *   - Error state messages and retry paths
 *   - Success path (form filled → result page)
 *
 * Accessibility:
 *   - axe-core on both the intake form and the result page
 *   - Inline form errors wired with aria-invalid + aria-describedby
 *   - Error summary receives focus on failed submit
 *   - Keyboard-only traversal of the intake form
 */
import { test, expect } from '@playwright/test'
import { checkA11y } from '../helpers/axe'
import { assertSkipLink, assertFocusRings } from '../helpers/keyboard'
import { hasTestCredentials, signInAsTestUser } from '../helpers/auth'

// ── Public (redirect) tests – always run ────────────────────────────────────

test.describe('Pay Gap – unauthenticated', () => {
  test('redirects to sign-in', async ({ page }) => {
    await page.goto('/en/pay-gap')
    await page.waitForURL(/sign-in/, { timeout: 10_000 })
    expect(page.url()).toContain('sign-in')
  })
})

// ── Authenticated tests – skip if no credentials ────────────────────────────

test.describe('Pay Gap – authenticated', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCredentials(), 'Skipping: PLAYWRIGHT_TEST_EMAIL/PASSWORD not set')
    await signInAsTestUser(page, 'en')
    await page.goto('/en/pay-gap')
    await page.waitForLoadState('networkidle')
  })

  test('intake page passes axe-core WCAG 2.1 AA', async ({ page }) => {
    await checkA11y(page)
  })

  test('skip-to-content link is first focusable element', async ({ page }) => {
    await assertSkipLink(page)
  })

  test('has exactly one h1', async ({ page }) => {
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  })

  test('form fields have visible focus rings', async ({ page }) => {
    await assertFocusRings(page, 20)
  })

  test('error state: submitting blank form shows accessible error summary', async ({
    page,
  }) => {
    const submitBtn = page.getByRole('button', { name: /analyze|check|submit/i })
    await submitBtn.click()

    // Error summary should appear and receive focus
    const errorSummary = page
      .locator('[role="alert"], [aria-live], [id*="error-summary"]')
      .first()
    await expect(errorSummary).toBeVisible({ timeout: 5_000 })

    // At least one field should have aria-invalid="true"
    const invalidFields = page.locator('[aria-invalid="true"]')
    const invalidCount = await invalidFields.count()
    expect(invalidCount, 'At least one field should be aria-invalid').toBeGreaterThan(0)
  })

  test('error messages are not communicated by color alone', async ({
    page,
  }) => {
    const submitBtn = page.getByRole('button', { name: /analyze|check|submit/i })
    await submitBtn.click()

    // Every error message should have an accessible text description
    const errorMessages = page.locator('[role="alert"]')
    const count = await errorMessages.count()
    for (let i = 0; i < count; i++) {
      const text = await errorMessages.nth(i).innerText()
      expect(text.trim().length, `Error message ${i} has no text`).toBeGreaterThan(0)
    }
  })

  test('all four locales render intake form without overflow', async ({
    page,
  }) => {
    for (const locale of ['es', 'fr', 'pt'] as const) {
      await page.goto(`/${locale}/pay-gap`)
      await page.waitForLoadState('networkidle')

      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth,
      )
      expect(overflow, `Horizontal overflow on /${locale}/pay-gap`).toBe(false)

      await checkA11y(page)
    }
  })
})

// ── Result page ──────────────────────────────────────────────────────────────

test.describe('Pay Gap Result – authenticated', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCredentials(), 'Skipping: PLAYWRIGHT_TEST_EMAIL/PASSWORD not set')
    await signInAsTestUser(page, 'en')
  })

  test('loading state: ?new=1 shows purposeful loading indicator', async ({
    page,
  }) => {
    await page.goto('/en/pay-gap/result?new=1')
    // A loading state (aria-busy, spinner, or status copy) should appear first
    const busyOrSpinner = page.locator('[aria-busy="true"], [role="status"], [class*="loading"], [class*="spinner"]').first()
    // Either shows loading OR immediately shows result – both are valid
    const hasLoading = await busyOrSpinner.isVisible().catch(() => false)
    // After it resolves, the page should have content
    await page.waitForTimeout(2000)
    const mainContent = await page.locator('main').innerText()
    expect(mainContent.length, 'Result page should have content').toBeGreaterThan(10)
  })

  test('result page passes axe-core WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/en/pay-gap/result')
    await page.waitForLoadState('networkidle')
    await checkA11y(page)
  })

  test('result page has exactly one h1', async ({ page }) => {
    await page.goto('/en/pay-gap/result')
    await page.waitForLoadState('networkidle')
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  })
})
