/**
 * Thin wrapper around @axe-core/playwright.
 *
 * Usage:
 *   import { checkA11y } from '@/tests/helpers/axe'
 *   await checkA11y(page)
 *
 * Applies the WCAG 2.1 AA ruleset and throws a readable failure message
 * that includes violation impact, the failing CSS selector, and the
 * axe help URL for each rule.
 */
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export async function checkA11y(
  page: Page,
  options?: {
    /** CSS selector to constrain the scan to a subtree. */
    include?: string
    /** axe rule IDs to exclude from this scan. */
    disableRules?: string[]
  },
) {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])

  if (options?.include) {
    builder = builder.include(options.include)
  }
  if (options?.disableRules?.length) {
    builder = builder.disableRules(options.disableRules)
  }

  const results = await builder.analyze()

  const violationSummary = results.violations
    .map((v) => {
      const nodes = v.nodes
        .map((n) => `      • ${n.target.join(' > ')}`)
        .join('\n')
      return `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n${nodes}\n      Help: ${v.helpUrl}`
    })
    .join('\n\n')

  expect(
    results.violations,
    `axe-core found ${results.violations.length} violation(s):\n\n${violationSummary}`,
  ).toHaveLength(0)
}
