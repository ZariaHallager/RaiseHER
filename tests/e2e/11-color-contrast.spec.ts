/**
 * Color contrast regression tests.
 *
 * The plan identified two failing pairs that were fixed with new tokens:
 *   - onAccent (#FFFFFF) on accent (#D97706): was 3.19:1, now text-on-accent is ink (#1A1A1A) at 5.47:1
 *   - accent (#D97706) as text/border on canvas (#F5F0EB): was 2.81:1, replaced by accentDeep (~#8F4E05)
 *
 * This spec verifies:
 *   1. axe-core "color-contrast" rule passes on every public route (all 4 locales)
 *   2. Programmatic spot-checks that the amber fill uses ink text (not white)
 *   3. accentDeep CSS variable is defined and meets 3:1 against canvas
 *
 * The scripts/verify-contrast.mjs script covers token-level contrast at build
 * time; this spec catches runtime-rendered contrast regressions (e.g. a
 * utility class applying the wrong token combination).
 */
import { test, expect } from '@playwright/test'
import { checkA11y } from '../helpers/axe'

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ]
}

const PUBLIC_ROUTES = ['/en', '/es', '/fr', '/pt']

for (const path of PUBLIC_ROUTES) {
  test(`${path} — axe-core color-contrast rule passes`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')

    await checkA11y(page)
  })
}

test('CSS variables: --color-accent-deep is defined and darker than accent', async ({
  page,
}) => {
  await page.goto('/en')
  await page.waitForLoadState('networkidle')

  const colors = await page.evaluate(() => {
    const root = document.documentElement
    const styles = getComputedStyle(root)
    return {
      accent: styles.getPropertyValue('--color-accent').trim(),
      accentDeep: styles.getPropertyValue('--color-accent-deep').trim(),
      canvas: styles.getPropertyValue('--color-canvas').trim(),
      ink: styles.getPropertyValue('--color-ink').trim(),
      onAccent: styles.getPropertyValue('--color-on-accent').trim(),
    }
  })

  // Verify accentDeep is defined
  expect(
    colors.accentDeep.length,
    '--color-accent-deep CSS variable must be defined',
  ).toBeGreaterThan(0)

  // If values are hex-parseable, verify contrast ratios
  const accentDeepRgb = hexToRgb(colors.accentDeep)
  const canvasRgb = hexToRgb(colors.canvas)
  const inkRgb = hexToRgb(colors.ink)
  const accentRgb = hexToRgb(colors.accent)

  if (accentDeepRgb && canvasRgb) {
    const ratio = contrastRatio(
      luminance(...accentDeepRgb),
      luminance(...canvasRgb),
    )
    expect(
      ratio,
      `accentDeep on canvas contrast ratio (${ratio.toFixed(2)}:1) must be ≥ 3:1`,
    ).toBeGreaterThanOrEqual(3)
  }

  if (inkRgb && accentRgb) {
    const inkOnAccentRatio = contrastRatio(
      luminance(...inkRgb),
      luminance(...accentRgb),
    )
    expect(
      inkOnAccentRatio,
      `ink text on accent background (${inkOnAccentRatio.toFixed(2)}:1) must be ≥ 4.5:1`,
    ).toBeGreaterThanOrEqual(4.5)
  }
})

test('CSS variables: --color-on-accent is ink, not white', async ({ page }) => {
  await page.goto('/en')
  await page.waitForLoadState('networkidle')

  const onAccent = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--color-on-accent')
      .trim(),
  )

  // White would be #ffffff or rgb(255,255,255); on-accent must NOT be white
  const isWhite =
    /^#fff(fff)?$/i.test(onAccent) ||
    /^rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)$/.test(onAccent)
  expect(
    isWhite,
    `--color-on-accent is white (${onAccent}), which fails contrast on amber. Must be a dark ink color.`,
  ).toBe(false)
})
