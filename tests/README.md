# RaiseHER E2E Test Suite

Playwright + axe-core QA verification covering the full plan requirements:

| Requirement | File(s) |
|-------------|---------|
| axe-core WCAG 2.1 AA – all public routes, all 4 locales | `01-landing-a11y.spec.ts`, `10-voiceover-checklist.spec.ts`, `11-color-contrast.spec.ts` |
| axe-core – all 5 core flows (authenticated) | `04–08-*.spec.ts` |
| Keyboard-only traversal of every public route | `09-keyboard-traversal.spec.ts` |
| Responsive checks at 320 / 768 / 1280 / 1920 | `02-responsive.spec.ts` + all projects in `playwright.config.ts` |
| All 4 locales – overflow and diacritic rendering | `01-landing-a11y.spec.ts`, `02-responsive.spec.ts`, `04–08-*.spec.ts` |
| Loading, error, empty, success states | `04–08-*.spec.ts` |
| VoiceOver/NVDA landmark and ARIA pattern checks | `10-voiceover-checklist.spec.ts` |
| Color contrast token regression | `11-color-contrast.spec.ts` |
| prefers-reduced-motion | `12-motion-prefers-reduced.spec.ts` |
| Auth redirects | `03-auth-redirects.spec.ts` |

Manual screen-reader checklist: [`docs/voiceover-nvda-checklist.md`](../docs/voiceover-nvda-checklist.md)

---

## Prerequisites

### 1. Environment variables

Copy `.env.local` and fill in the blanks before running tests that need auth:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...            # Required – get from Clerk dashboard
NEXT_PUBLIC_CONVEX_URL=...              # Required for authenticated feature tests
GEMINI_API_KEY=...                      # Required for AI feature tests
```

### 2. Test credentials (for authenticated flow tests)

The `04–08-*.spec.ts` files test protected routes. Without credentials those tests
skip automatically (they will show `SKIPPED` in the report).

```bash
export PLAYWRIGHT_TEST_EMAIL=your-test-user@example.com
export PLAYWRIGHT_TEST_PASSWORD=yourpassword
```

Create a dedicated test account in your Clerk dashboard (dev environment), not your personal account.

### 3. Running a dev server

The Playwright config starts the dev server automatically via `npm run dev`. To
reuse an already-running server:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

---

## Running tests

```bash
# Full suite (all 4 viewport projects, 688 tests)
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Accessibility only (fastest subset, no auth needed for public routes)
npm run test:a11y

# Responsive checks only
npm run test:responsive

# Keyboard traversal
npm run test:keyboard

# prefers-reduced-motion
npm run test:motion

# Authenticated feature flows (requires credentials)
npm run test:flows

# View last HTML report
npm run test:e2e:report
```

---

## Test breakdown

| # tests | Category |
|---------|----------|
| 36 | Landing page a11y + structure (4 locales × 9 checks) |
| 21 | Responsive layout (4 viewports × public routes) |
| 17 | Auth redirect + sign-in/sign-up structure |
| 20 | Pay Gap flow |
| 16 | Wins Ledger flow |
| 14 | Rehearsal Room flow |
| 13 | Case Files flow |
| 13 | Circle flow |
| 22 | Keyboard traversal (4 routes × 5 checks + sign-in) |
| 26 | VoiceOver/NVDA readiness (4 locales × 6 checks + Route Announcer) |
| 14 | Color contrast (4 locales + token assertions) |
| 12 | prefers-reduced-motion |
| **688** | **Total across 4 viewport projects** |

---

## CI integration

```yaml
# .github/workflows/e2e.yml (example)
- name: Run Playwright tests
  env:
    PLAYWRIGHT_TEST_EMAIL: ${{ secrets.PLAYWRIGHT_TEST_EMAIL }}
    PLAYWRIGHT_TEST_PASSWORD: ${{ secrets.PLAYWRIGHT_TEST_PASSWORD }}
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
    CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
    NEXT_PUBLIC_CONVEX_URL: ${{ secrets.NEXT_PUBLIC_CONVEX_URL }}
  run: npx playwright install --with-deps && npm run test:e2e
```
