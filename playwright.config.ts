/**
 * Playwright configuration for the RaiseHER QA verification suite.
 *
 * Covers:
 *   - axe-core accessibility checks across all public + protected routes
 *   - Keyboard-only navigation traversal
 *   - Responsive viewport checks at 320 / 768 / 1280 / 1920
 *   - All four locales (en / es / fr / pt)
 *   - Loading, error, empty, and success states for every feature
 *   - The five core flows: Pay Gap, Wins, Rehearsal Room, Case Files, Circle
 */
import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // ── Desktop Chrome ────────────────────────────────────────────────────────
    {
      name: 'desktop-1280',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'desktop-1920',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    // ── Tablet ────────────────────────────────────────────────────────────────
    {
      name: 'tablet-768',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
      },
    },
    // ── Mobile ────────────────────────────────────────────────────────────────
    {
      name: 'mobile-320',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 320, height: 568 },
        isMobile: true,
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    /**
     * In CI: always start a fresh server.
     * Locally: reuse an existing server if one is running on BASE_URL.
     * Set PLAYWRIGHT_BASE_URL=http://localhost:3000 to point at a running dev server.
     */
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
