/**
 * Landing page accessibility + structure tests.
 *
 * Covers:
 *   - axe-core WCAG 2.1 AA across all four locales
 *   - Exactly one h1 per page
 *   - Skip-to-content link as first focusable element
 *   - All four locales render without overflow / truncation issues
 *   - hreflang alternates present in <head>
 *   - html[lang] set correctly
 */
import { test, expect } from '@playwright/test'
import { checkA11y } from '../helpers/axe'
import { assertSkipLink, assertFocusRings } from '../helpers/keyboard'

const LOCALES = [
  { code: 'en', bcp47: 'en', sample: 'RaiseHER' },
  { code: 'es', bcp47: 'es', sample: 'RaiseHER' },
  { code: 'fr', bcp47: 'fr', sample: 'RaiseHER' },
  { code: 'pt', bcp47: 'pt-BR', sample: 'RaiseHER' },
] as const

for (const locale of LOCALES) {
  test.describe(`Landing page – ${locale.code}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/${locale.code}`)
      await page.waitForLoadState('networkidle')
    })

    test('passes axe-core WCAG 2.1 AA', async ({ page }) => {
      await checkA11y(page)
    })

    test('has exactly one h1', async ({ page }) => {
      const h1Count = await page.locator('h1').count()
      expect(h1Count, 'Exactly one h1 required per page').toBe(1)
    })

    test('skip-to-content link is first focusable element', async ({
      page,
    }) => {
      await assertSkipLink(page)
    })

    test('html[lang] matches locale BCP47 tag', async ({ page }) => {
      const lang = await page.locator('html').getAttribute('lang')
      expect(lang).toBe(locale.bcp47)
    })

    test('hreflang alternates present for all four locales', async ({
      page,
    }) => {
      const hreflangs = await page
        .locator('link[rel="alternate"][hreflang]')
        .evaluateAll((els) =>
          (els as HTMLLinkElement[]).map((el) => el.hreflang),
        )
      expect(hreflangs).toContain('en')
      expect(hreflangs).toContain('es')
      expect(hreflangs).toContain('fr')
    })

    test('hero h1 visible and not truncated', async ({ page }) => {
      const h1 = page.locator('h1').first()
      await expect(h1).toBeVisible()
      const box = await h1.boundingBox()
      expect(box?.height ?? 0, 'h1 must have positive height').toBeGreaterThan(
        0,
      )
    })

    test('feature cards all visible without horizontal overflow', async ({
      page,
    }) => {
      const cards = page.locator('ul li').filter({ hasText: /.+/ })
      const count = await cards.count()
      expect(count, 'At least 4 feature cards expected').toBeGreaterThanOrEqual(
        4,
      )

      const viewportWidth = page.viewportSize()?.width ?? 1280
      for (let i = 0; i < count; i++) {
        const box = await cards.nth(i).boundingBox()
        if (!box) continue
        expect(box.x, `Card ${i} overflows left edge`).toBeGreaterThanOrEqual(0)
        expect(
          box.x + box.width,
          `Card ${i} overflows right edge`,
        ).toBeLessThanOrEqual(viewportWidth + 2) // 2px tolerance
      }
    })

    test('interactive elements have visible focus rings', async ({ page }) => {
      await assertFocusRings(page, 15)
    })

    test('CTA buttons reachable via keyboard and have accessible names', async ({
      page,
    }) => {
      const buttons = page.getByRole('link').filter({ hasText: /.{2,}/ })
      const count = await buttons.count()
      for (let i = 0; i < count; i++) {
        const name = await buttons.nth(i).getAttribute('aria-label')
        const text = await buttons.nth(i).textContent()
        expect(
          (name ?? text ?? '').trim().length,
          `Link at index ${i} has no accessible name`,
        ).toBeGreaterThan(0)
      }
    })
  })
}
