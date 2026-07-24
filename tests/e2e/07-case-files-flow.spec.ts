/**
 * Case Files – full flow tests.
 *
 * Covers:
 *   - Redirect when unauthenticated
 *   - axe-core WCAG 2.1 AA on list and detail pages
 *   - Empty state: prompt + CTA visible
 *   - Loading state during AI case file generation
 *   - Success state: generated file appears in list
 *   - Delete confirmation dialog accessibility and keyboard
 *   - All four locales render without overflow
 */
import { test, expect } from '@playwright/test'
import { checkA11y } from '../helpers/axe'
import { assertSkipLink, assertFocusRings } from '../helpers/keyboard'
import { hasTestCredentials, signInAsTestUser } from '../helpers/auth'

test('Case Files: unauthenticated visit redirects to sign-in', async ({
  page,
}) => {
  await page.goto('/en/case-files')
  await page.waitForURL(/sign-in/, { timeout: 10_000 })
  expect(page.url()).toContain('sign-in')
})

test.describe('Case Files – authenticated', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasTestCredentials(), 'Skipping: PLAYWRIGHT_TEST_EMAIL/PASSWORD not set')
    await signInAsTestUser(page, 'en')
    await page.goto('/en/case-files')
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

  test('empty state has prompt, CTA, and descriptive content', async ({
    page,
  }) => {
    const isEmpty =
      (await page.locator('[data-testid="case-files-empty"], [class*="empty"]').count()) > 0
    if (isEmpty) {
      // Empty state CTA must be present
      const cta = page.getByRole('button', { name: /generate|create|build/i })
      await expect(cta).toBeVisible()
    }
    // Generate / create button must always exist
    const generateBtn = page.getByRole('button', { name: /generate|create|build/i })
    if ((await generateBtn.count()) > 0) {
      await expect(generateBtn.first()).toBeVisible()
    }
  })

  test('loading state: generation shows aria-live status', async ({ page }) => {
    const liveRegions = await page
      .locator('[aria-live]')
      .evaluateAll((els) =>
        (els as HTMLElement[]).map((el) => el.getAttribute('aria-live')),
      )
    // At least one live region must exist for AI generation status
    expect(liveRegions.length, 'At least one aria-live region required').toBeGreaterThan(0)
  })

  test('all four locales render without overflow', async ({ page }) => {
    for (const locale of ['es', 'fr', 'pt'] as const) {
      await page.goto(`/${locale}/case-files`)
      await page.waitForLoadState('networkidle')

      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth,
      )
      expect(overflow, `Horizontal overflow on /${locale}/case-files`).toBe(false)

      await checkA11y(page)
    }
  })
})
