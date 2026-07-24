# VoiceOver and NVDA Manual Test Checklist

Everything automated by `tests/e2e/10-voiceover-checklist.spec.ts` is excluded from this list. Run these manually before each release milestone.

## Setup

- **VoiceOver (macOS):** `Cmd+F5` to enable. Use Chrome for testing (Safari has different behavior on some ARIA patterns).
- **NVDA (Windows):** Download from nvaccess.org. Use Firefox or Chrome. Set browse mode vs application mode as appropriate.
- **Test URL base:** `http://localhost:3000` for local, production URL for pre-release.

---

## Core flows to exercise

### 1. Marketing landing page (`/en`)

| # | Step | Expected announcement | Pass/Fail |
|---|------|-----------------------|-----------|
| 1 | Load the page | "RaiseHER" (page title) announced | |
| 2 | Press Tab once | "Skip to main content" skip link focused and announced | |
| 3 | Press Enter on skip link | Focus moves to `#main-content`; "Main" landmark announced | |
| 4 | Browse headings (VO: `Ctrl+Opt+Cmd+H`, NVDA: `H`) | `h1` heard first, then `h2`s in logical order, no skipped levels | |
| 5 | Navigate landmark regions | `header`, `navigation`, `main`, `contentinfo` all announced | |
| 6 | Navigate to feature cards list | "list, 4 items" announced | |
| 7 | Tab to a CTA link | Full button text read, not just icon | |
| 8 | Activate "Get started" link via Enter | Navigation occurs; new page title announced | |

### 2. Sign-in page (`/en/sign-in`)

| # | Step | Expected announcement | Pass/Fail |
|---|------|-----------------------|-----------|
| 1 | Load page | Page title includes "Sign in" or "RaiseHER" | |
| 2 | Tab to email field | "Email address, edit text" announced | |
| 3 | Enter invalid email, submit | Error announced via live region without page reload | |
| 4 | After sign-in completes | New route announced by RouteAnnouncer | |

### 3. Wins Ledger (`/en/wins`)

| # | Step | Expected announcement | Pass/Fail |
|---|------|-----------------------|-----------|
| 1 | Load page (empty state) | Empty state prompt heard | |
| 2 | Tab to "Log a Win" button | "Log a Win, button" announced | |
| 3 | Activate button | Dialog announced: "dialog, add a win" | |
| 4 | Tab through dialog fields | Each field announced with its label | |
| 5 | Leave Description field empty, submit | Error summary at top receives focus; "Error: Description is required" announced | |
| 6 | Fill all fields, submit | Dialog closes; focus returns to trigger; "Win added" or similar status announced | |
| 7 | Win appears in list | New list item announced | |
| 8 | Tab to edit button on a win card | "Edit [win description], button" announced | |
| 9 | Activate delete button | Confirmation dialog appears; "dialog, are you sure" announced | |
| 10 | Press Escape on delete dialog | Dialog closes; focus returns to the delete button | |

### 4. Pay Gap Intake (`/en/pay-gap`)

| # | Step | Expected announcement | Pass/Fail |
|---|------|-----------------------|-----------|
| 1 | Load page | `h1` "Pay Gap Reality Check" (or locale equivalent) announced | |
| 2 | Tab to Industry field | "Industry, edit text, required" announced | |
| 3 | Submit empty form | Error summary receives focus; count announced ("6 errors") | |
| 4 | Each inline error | Announced via `role="alert"` | |
| 5 | Fill all fields correctly, submit | Loading state announced ("Analyzing your data...") | |
| 6 | Result page load | New page title announced; result heading announced | |

### 5. Rehearsal Room (`/en/rehearsal`)

| # | Step | Expected announcement | Pass/Fail |
|---|------|-----------------------|-----------|
| 1 | Load page | `h1` and subtitle announced | |
| 2 | Scenario picker | Each option announced with role | |
| 3 | Text input always available | "Your message, edit text" announced | |
| 4 | If voice unavailable | Explanation text announced (not silent failure) | |
| 5 | Submit a message | "Thinking..." or equivalent via `aria-live="polite"` announced | |
| 6 | AI response arrives | Response text announced via live region | |
| 7 | End session | Scorecard heading announced | |

### 6. Case Files (`/en/case-files`)

| # | Step | Expected announcement | Pass/Fail |
|---|------|-----------------------|-----------|
| 1 | Empty state | Prompt text announced | |
| 2 | Activate generate button | Loading state announced | |
| 3 | File generated | New list item announced | |
| 4 | Open case file | Detail content announced in reading order | |

### 7. The Circle (`/en/circle`)

| # | Step | Expected announcement | Pass/Fail |
|---|------|-----------------------|-----------|
| 1 | Total Raised counter | Number announced; updates announced via `aria-live="polite"` | |
| 2 | Outcome form | Each field labeled | |
| 3 | Submit outcome | Success message announced | |

---

## Locale spot-checks

Run the Wins Ledger test above in Spanish (`/es/wins`) and French (`/fr/wins`):
- Confirm all UI strings are in the expected language.
- Confirm accented characters (é, ñ, ç, ã) are read correctly.
- Confirm no garbled pronunciation (test with both VoiceOver en-US and a Spanish/French voice if available).

---

## Focus management post-navigation

| # | Scenario | Expected | Pass/Fail |
|---|----------|----------|-----------|
| 1 | Any client-side route change | `h1` on new page receives focus; RouteAnnouncer announces page name | |
| 2 | Language picker changes locale | Page reloads or navigates; new locale's page title announced | |
| 3 | Dialog opens | Focus moves to dialog; `h2` or first focusable element inside announced | |
| 4 | Dialog closes | Focus returns to the trigger element | |

---

## Notes

- Test at browser default zoom (100%) and at 200% zoom.
- Test with and without CSS animations (`prefers-reduced-motion: reduce` in System Preferences / OS settings).
- Do not consider a feature complete until it passes both automated axe-core and at least one manual screen reader pass.
