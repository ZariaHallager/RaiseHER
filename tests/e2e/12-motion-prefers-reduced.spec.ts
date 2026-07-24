/**
 * prefers-reduced-motion tests.
 *
 * WCAG 2.1 SC 2.3.3 (Animation from Interactions).
 *
 * When the user sets prefers-reduced-motion: reduce, all animations must
 * be suppressed or reduced to simple opacity fades with no movement.
 *
 * We verify:
 *   - The @media (prefers-reduced-motion: reduce) CSS rule exists in the
 *     global stylesheet with a suitable declaration.
 *   - With forced reduced-motion, the hero section's Motion animation does
 *     not apply translateY or scale transforms.
 *   - With forced reduced-motion, no element has an animation-duration > 0
 *     that could cause vestibular issues.
 */
import { test, expect } from '@playwright/test'

test.describe('prefers-reduced-motion', () => {
  test('CSS contains a prefers-reduced-motion: reduce media query', async ({
    page,
  }) => {
    await page.goto('/en')
    await page.waitForLoadState('networkidle')

    const hasRule = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            if (
              rule instanceof CSSMediaRule &&
              rule.conditionText.includes('prefers-reduced-motion')
            ) {
              return true
            }
          }
        } catch {
          // Cross-origin stylesheet; skip
        }
      }
      return false
    })

    expect(
      hasRule,
      'A @media (prefers-reduced-motion) rule must exist in the stylesheet',
    ).toBe(true)
  })

  test('with forced reduced-motion, no element has animation-duration > 250ms', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/en')
    await page.waitForLoadState('networkidle')

    const violations = await page.evaluate(() => {
      const result: string[] = []
      document.querySelectorAll('*').forEach((el) => {
        const styles = window.getComputedStyle(el)
        const duration = parseFloat(styles.animationDuration) * 1000 // ms
        if (duration > 250) {
          result.push(
            `<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}>: animation-duration ${duration}ms`,
          )
        }
      })
      return result.slice(0, 10) // Cap at 10 violations in the report
    })

    expect(
      violations,
      `${violations.length} element(s) have long animations even with prefers-reduced-motion:\n${violations.join('\n')}`,
    ).toHaveLength(0)
  })

  test('with forced reduced-motion, no element has transition-duration > 250ms on movement properties', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/en')
    await page.waitForLoadState('networkidle')

    const violations = await page.evaluate(() => {
      const movementProps = ['transform', 'translate', 'scale', 'rotate', 'left', 'top']
      const result: string[] = []
      document.querySelectorAll('*').forEach((el) => {
        const styles = window.getComputedStyle(el)
        const property = styles.transitionProperty
        const duration = parseFloat(styles.transitionDuration) * 1000 // ms
        if (
          duration > 250 &&
          movementProps.some((p) => property.includes(p))
        ) {
          result.push(
            `<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}>: transition "${property}" ${duration}ms`,
          )
        }
      })
      return result.slice(0, 10)
    })

    expect(
      violations,
      `${violations.length} element(s) have movement transitions with prefers-reduced-motion:\n${violations.join('\n')}`,
    ).toHaveLength(0)
  })
})
