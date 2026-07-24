/**
 * Keyboard-navigation helpers for Playwright tests.
 *
 * Provides utilities to:
 *   - Tab through all focusable elements in order and assert they are visible
 *   - Verify that the skip-to-content link is the first focusable element
 *   - Verify that :focus-visible rings are applied (via computed style)
 */
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Presses Tab `count` times, returning the accessible name (or tag) of each
 * element that received focus. Useful for asserting focus order.
 */
export async function tabThrough(
  page: Page,
  count: number,
): Promise<string[]> {
  const focused: string[] = []

  for (let i = 0; i < count; i++) {
    await page.keyboard.press('Tab')

    const label = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return null
      const ariaLabel = (el as HTMLElement).getAttribute('aria-label')
      if (ariaLabel) return ariaLabel
      const labelledById = (el as HTMLElement).getAttribute('aria-labelledby')
      if (labelledById) {
        return document.getElementById(labelledById)?.textContent?.trim() ?? null
      }
      const inputLabels = (el as HTMLInputElement).labels
      if (inputLabels && inputLabels.length > 0) {
        return inputLabels[0].textContent?.trim() ?? null
      }
      const text = (el as HTMLElement).textContent?.trim()
      if (text) return text
      return (el as HTMLElement).tagName.toLowerCase()
    })

    focused.push(label ?? '(unlabeled)')
  }

  return focused
}

/**
 * Asserts that the first focusable element after page load is a skip-to-main
 * link with href="#main-content".
 */
export async function assertSkipLink(page: Page) {
  // Click body to ensure focus is reset
  await page.locator('body').click({ position: { x: 0, y: 0 } })
  await page.keyboard.press('Tab')

  const focused = await page.evaluate(() => {
    const el = document.activeElement as HTMLAnchorElement | null
    return {
      tagName: el?.tagName?.toLowerCase(),
      href: el?.getAttribute('href'),
    }
  })

  expect(focused.tagName, 'First Tab should focus an <a> element').toBe('a')
  expect(focused.href, 'Skip link must point to #main-content').toBe(
    '#main-content',
  )
}

/**
 * Tabs through the page and verifies every focused interactive element
 * has a visible outline or border (i.e., focus-visible ring is applied).
 * Logs any elements that appear to have no visible focus indicator.
 */
export async function assertFocusRings(
  page: Page,
  maxTabs = 30,
): Promise<void> {
  const failures: string[] = []

  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab')

    const result = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body) return null

      const styles = window.getComputedStyle(el)
      const outlineWidth = parseFloat(styles.outlineWidth)
      const outlineStyle = styles.outlineStyle
      const boxShadow = styles.boxShadow

      const hasFocusRing =
        (outlineWidth > 0 && outlineStyle !== 'none') ||
        (boxShadow !== 'none' && boxShadow !== '')

      return {
        tag: el.tagName.toLowerCase(),
        text: el.textContent?.trim().slice(0, 40) ?? '',
        role: el.getAttribute('role'),
        hasFocusRing,
        outlineWidth,
        outlineStyle,
        boxShadow: boxShadow.slice(0, 60),
      }
    })

    if (result === null) break
    if (!result.hasFocusRing) {
      failures.push(
        `<${result.tag}${result.role ? ` role="${result.role}"` : ''}> "${result.text}" — no focus ring (outline: ${result.outlineWidth}px ${result.outlineStyle}, box-shadow: ${result.boxShadow})`,
      )
    }
  }

  expect(
    failures,
    `${failures.length} element(s) lacked a visible focus ring:\n${failures.join('\n')}`,
  ).toHaveLength(0)
}
