# RaiseHER PRD: Part One
**Builder One scope. Builder Two reads sections 1 through 8; their build-specific scope is in Part Two.**

Last updated: 2026-07-24
Status: Active

---

## Section 1: Mission

RaiseHER shows women their pay gap, builds their case for closing it, and puts a negotiation practice room in their pocket. Every feature exists to close one specific gap or build one specific skill. Nothing is decorative.

The product is free to use at launch. Revenue comes from a single paid tier that unlocks the Rehearsal Room and advanced case-file exports. There are no ads, no data sales, and no AI training on user data.

---

## Section 2: Goals

### 2.1 Business goals

| Goal | Target | How it is measured |
|------|--------|--------------------|
| 500 active users by week 8 | 500 users with at least one win logged | Convex `aggregatePlatformStats.totalUsers` |
| 60% of users return in week 2 | Sessions with a logged win in weeks 2 and 3 | Convex `wins` table, `createdAt` field |
| Cover hosting cost from month 3 | One Stripe subscription per day on average | Convex `revenueEntries` |
| Zero downtime that affects pay gap generation | 99.5% success on `payGapAction` | Convex `agentActivityLog.success` |

### 2.2 User goals

1. Know the exact dollar amount of their pay gap within five minutes of signing up.
2. Log wins without friction, ideally under 30 seconds per entry.
3. Walk into a salary conversation with a written case file, not just a feeling.
4. Practice the conversation until the words come naturally.

### 2.3 Non-goals for Part One scope

- Social feeds, public profiles, or follower counts.
- Job boards, resume tools, or external integrations.
- Native iOS and Android binaries at launch. The Expo shell in `app/` is frozen; Builder One ships the web app.

---

## Section 3: Personas

### Primary: Morgan, 32, senior software engineer

Morgan has been at her company for three years. She suspects she is underpaid relative to male colleagues at the same level but has no number to anchor the conversation. She is busy, skeptical of apps that overpromise, and will leave in under 60 seconds if the value is not obvious. She uses Chrome on a MacBook at work and Safari on her iPhone in the evening.

**What she needs from RaiseHER:**
- A credible number immediately, not after five onboarding screens.
- A way to record her accomplishments before she forgets them.
- A practice mode that does not feel like a game show.

**What will lose her:**
- Copy that talks down to her.
- Animations that feel like a sales funnel.
- Any ask for payment before she has seen a result.

### Secondary: Daria, 25, entry-level marketing coordinator

Daria is three months into her first job. She signed a number without negotiating and already regrets it. She does not know industry benchmarks for her role or how to frame a raise conversation with a manager she has known for three months. She uses the app on her phone during lunch.

**What she needs from RaiseHER:**
- Language she can use verbatim in a conversation, not abstract advice.
- A short path from "I want a raise" to "here is what I would say."
- Enough wins logged to feel like she has a case.

**What will lose her:**
- Forms that feel like tax preparation.
- Results that feel fake or inflated.
- Anything that requires her to know her "benchmark salary" before using the app.

### Tertiary: Founder (internal, gated)

Uses the Agent Ops Dashboard at `/agent-ops`. Reads `agentActivityLog`, tracks platform-level aggregate stats, and reviews `revenueEntries` and `expenseEntries`. This persona is never shown onboarding, pay gap intake, or wins features.

---

## Section 4: Feature Ownership

This table is the contract between Builder One and Builder Two. Do not ship a feature assigned to the other builder without written confirmation.

| Feature | Builder | Status at doc date |
|---------|---------|--------------------|
| Auth (Clerk sign up, sign in, verify email) | Builder One | Live in Expo shell |
| Pay Gap Intake and Result | Builder One | Live in Expo shell |
| Wins Ledger (CRUD + AI polish) | Builder One | Live in Expo shell |
| User profile and language settings | Builder One | Live in Expo shell |
| Agent Ops Dashboard | Builder One | Live in Expo shell |
| Pay gap share card (server-side OG image) | Builder One | Web only, new |
| Subscription checkout (Stripe) | Builder One | Live in `checkout/` app |
| PWA manifest and install prompt | Builder One | Web only, new |
| Rehearsal Room (voice + text) | Builder Two | Placeholder screen only |
| Case Files | Builder Two | Placeholder screen only |
| Circle (community tab) | Builder Two | Placeholder screen only |

**Handoff boundary:** Builder One produces `payGapProfiles` records. Builder Two reads `payGapProfileId` from the `scenarios` table to pre-populate rehearsal context. The shape of that handoff is frozen in `convex/schema.ts` and cannot change without a joint decision.

---

## Section 5: Web Information Architecture

### 5.1 URL structure

All user-facing routes live under the locale prefix so pages are statically indexable and next-intl can handle the locale without client-side detection.

```
/[locale]/                    Home (unauthenticated) or redirect to /wins
/[locale]/sign-in             Clerk-rendered sign-in page
/[locale]/sign-up             Clerk-rendered sign-up page
/[locale]/onboarding/paygap   Pay gap intake (post-signup)
/[locale]/onboarding/result   Pay gap result (post-intake)
/[locale]/wins                Wins Ledger
/[locale]/wins/new            Log a new win (modal or page depending on viewport)
/[locale]/wins/[id]           Edit a win
/[locale]/rehearsal           Rehearsal Room (Builder Two)
/[locale]/case-files          Case Files (Builder Two)
/[locale]/circle              Circle (Builder Two)
/[locale]/settings            Profile and language settings
/og/paygap                    Server-rendered OG image for pay gap share card (no locale prefix)
/agent-ops                    Agent Ops Dashboard (founder-gated, no locale prefix)
```

Locale values: `en`, `es`, `fr`, `pt`. The default locale (`en`) still appears in the URL so all canonical URLs are unambiguous. A redirect from `/` to `/en/` handles bare root visits.

### 5.2 Navigation

**Mobile (below 768 px):** Bottom navigation bar with five items in the exact tab order from the Expo shell: Wins, Rehearsal, Case Files, Circle, Profile. Bottom bar sits above `env(safe-area-inset-bottom)` so it clears iPhone home indicator. Primary action (log a win) is a floating button anchored bottom-right, above the nav bar.

**Desktop (768 px and above):** Left navigation rail, 240 px wide, same five items in the same order. Primary action moves inline to the top of the wins list as a full-width button. No hamburger menus. No drawer.

Both layouts use the same components. The rail and the bottom bar are two layout modes of one `<AppNav>` component.

### 5.3 Modal and sheet behavior

Bottom sheets on mobile, centered dialogs on desktop. Both are rendered by one `<Sheet>` component that reads viewport width and renders the appropriate container. The "log a win" form lives in a Sheet. Confirmation dialogs live in a Sheet. AI polish lives in a Sheet.

### 5.4 Pay gap share card

`/og/paygap` accepts `gap`, `currency`, `role`, and `locale` query params and returns a `1200x630` PNG using `@vercel/og`. No authentication required to render the image, but the values are passed from the client after the pay gap result is shown. The card shows the gap amount, a minimal chart, and the RaiseHER wordmark on the amber/cream palette. No personal names in the image.

### 5.5 PWA

- `app/manifest.webmanifest` specifies `name: "RaiseHER"`, `short_name: "RaiseHER"`, `display: "standalone"`, `theme_color: "#D97706"` (accent), `background_color: "#F5F0EB"` (canvas).
- Install prompt appears on the pay gap result screen, specifically after the gap amount animates in. Not on any other screen.
- Offline behavior: the wins list renders from cache if Convex's real-time connection is unavailable. A visible banner says "Offline. Changes will sync when you reconnect."

---

## Section 6: Shared Data Model

This section is the canonical record for every table both builders read. Do not derive the schema from `convex/schema.ts` alone; that file is the implementation; this section is the intent.

### 6.1 `users`

Mirrors the Clerk record. Synced on `user.created` and `user.updated` webhooks. `isFounder: true` gates the Agent Ops Dashboard. `preferredLanguage` drives the locale for AI-generated content.

### 6.2 `payGapProfiles`

One record per analysis. Not updated in place; a new record is created if the user recalculates. `aiAnalysis` is the full narrative in `targetLanguage`. Builder Two reads `payGapProfileId` from `scenarios` to inherit the user's role and industry context.

**Key fields for Builder Two:**
- `role`: freeform string, user-entered
- `industry`: freeform string, user-entered
- `gapPercentage`: float, used as rehearsal difficulty dial if Builder Two chooses to use it
- `gapAmount` + `currency`: shown in the rehearsal room header as context

### 6.3 `wins`

Core Builder One table. Each win has a `description`, optional `impact`, optional `estimatedValue` + `currency`, and a `date` (day precision). The AI polish action reads `description` and returns a refined `description`, suggested `impact`, and suggested `tags`. Builder Two has read access to surface win count in the rehearsal context ("you have logged 12 wins this quarter").

### 6.4 `scenarios`, `rehearsalSessions`, `caseFiles`, `outcomes`

Builder Two owns these. Shapes are locked in `convex/schema.ts`. Builder One does not read or write these tables except through the handoff boundary described in Section 4.

### 6.5 `agentActivityLog`

Every AI call (pay gap generation, win polish, cron agents) writes one record here. Both builders' agents write to this table. Builder One's Agent Ops Dashboard reads the full table across all `agentName` values.

### 6.6 `aggregatePlatformStats`

Single-row aggregate updated by a Convex cron. Tracks `totalUsers`, `totalWins`, `avgGapPercentage`, and `totalGapClosedUsd`. The pay gap result screen surfaces `totalGapClosedUsd` as social proof: "RaiseHER users have closed $X in pay gaps." Builder Two may surface `totalWins` in their UI.

---

## Section 7: Copy Guidelines

These rules apply to every string in `src/i18n/locales/`, every label in the UI, every error message, and every AI-generated narrative. Builder Two's strings must follow the same rules.

### 7.1 What these rules are not

Not a brand guide. Not a tone-of-voice deck. A list of things that are banned because they make the product worse.

### 7.2 Banned

| Banned | Why | Alternative |
|--------|-----|-------------|
| Em dashes | Overused in AI-generated copy; signals that a human did not read it | Use a period or rewrite the sentence |
| "Empower" or "empowerment" | Hollow filler | Say what the feature actually does |
| "Unlock your potential" | Same | Say what is behind the gate |
| "We believe" or "We're on a mission" | Press release voice | State a fact or make a direct promise |
| Exclamation marks as validation ("Great!") | Patronizing | Confirm with a neutral label or nothing |
| "Easy", "simple", "seamless" | Rug-pull adjectives; if it is those things, the user will notice | Drop the adjective |
| Sparkle or magic-wand framing for AI | Overpromises | Use the AIMark component; let the result speak |
| Hedging before instructions ("you might want to...") | Slows reading | Imperative form: "Log a win" |

### 7.3 Voice: direct, specific, adult

- Use second person. "Your pay gap is $14,200" not "The pay gap for your role is approximately..."
- Name the exact number. If the AI gives a range, show the midpoint with the range in a disclosure.
- State the negative plainly. "You are paid 18% below the median for your role." Not "There is an opportunity to align your compensation with market rates."
- Disclosure copy is honest about limits. "This estimate is based on aggregated public data. It is a starting point, not a legal figure."

### 7.4 AI-generated content rules

- The pay gap narrative in `aiAnalysis` is generated in the user's `preferredLanguage`. It must contain: the gap amount in the user's currency, the benchmark source description, one paragraph on why the gap exists for this role and industry, and three specific talking points for a raise conversation.
- The win polish output must not add claims the user did not make. If the user wrote "I led a meeting," the polish cannot say "you drove a cross-functional alignment initiative."
- Every AI-surfaced result carries an AIMark component. No sparkle icons.

### 7.5 Error messages

- Say what happened. "Could not load your wins" not "Something went wrong."
- Say what the user can do. "Tap to try again" or "Check your connection and reload."
- Never blame the user. "Your session expired. Sign in to continue" not "You were signed out."

---

## Section 8: Design System and Interaction

The full token definitions are in source. This section explains the intent behind each rule and provides the builder-facing interaction specification so both builders apply the design correctly in every new component.

### 8.1 Color

Source: `src/design-system/tokens/colors.ts`

The palette is amber and cream in light mode, dark amber and near-black in dark mode. The tokens to know:

| Token | Light | Dark | Used for |
|-------|-------|------|----------|
| `ink` | `#1A1A1A` | `#F5F0EB` | Body text, headings |
| `inkSoft` | `#444444` | `#D4CDC5` | Secondary text, subheadings |
| `inkMuted` | `#888888` | `#948C84` | Labels, captions, metadata |
| `canvas` | `#F5F0EB` | `#17140F` | Page background |
| `surface` | `#FFFFFF` | `#241F18` | Cards, modals, sheets |
| `surfaceSubtle` | `#EDE8E2` | `#2E2820` | Input backgrounds, list item hover |
| `accent` | `#D97706` | `#F59E0B` | Primary buttons, active nav, emphasis |
| `accentLight` | `#FEF3C7` | `#3A2A0C` | Ghost button fill, tag backgrounds |
| `aiMark` | `#0369A1` | `#38BDF8` | AIMark badge, AI-sourced content border |
| `success` | `#15803D` | `#4ADE80` | Confirmed states, positive values |
| `error` | `#B91C1C` | `#F87171` | Validation errors, destructive actions |
| `border` | `#D4CDC5` | `#3A332B` | Dividers, input outlines |

**Rules that override judgment calls:**
- No purple, anywhere, ever. Not for hover states, not for focus rings, not for AI content.
- No gradients on any surface. Flat fills only.
- No glassmorphism or blur-behind effects. If a surface needs to feel elevated, use the `border` token as an outline.
- The `accent` color is not used for large filled surfaces (more than a button-sized element). For large highlighted blocks, use `accentLight`.
- The `aiMark` blue is reserved exclusively for AIMark badges and AI-sourced content borders. It is not a general accent.

**Dark mode:** Light ships at launch. Dark is fully tokenized and ready; enable by passing `colorScheme: 'dark'` to the theme provider. Do not introduce color values outside the token set to handle scheme differences.

### 8.2 Typography

Six-step scale. Self-hosted webfonts replace the Georgia and system font placeholders from the Expo shell. Until webfonts are wired into Next.js via `next/font`, the system stack remains: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

| Step | Size | Weight | Line height | Usage |
|------|------|--------|-------------|-------|
| `display` | 32 px | 700 | 1.2 | Pay gap amount, hero numbers |
| `heading1` | 24 px | 700 | 1.2 | Page titles |
| `heading2` | 20 px | 600 | 1.2 | Section headings, modal titles |
| `body` | 16 px | 400 | 1.5 | Body copy, form inputs |
| `label` | 14 px | 500 | 1.4 | Labels, nav items, button text |
| `caption` | 12 px | 400 | 1.5 | Disclosure text, timestamps |

All type is set flush-left. The single exception is the pay gap dollar amount on the result screen, which is centered to anchor the reveal animation.

**Minimum sizes:** Body text is never smaller than 16 px on mobile to prevent iOS from auto-zooming inputs. Caption text (12 px) is only used for metadata that is not the primary content of a surface.

### 8.3 Spacing

Source: `src/design-system/tokens/spacing.ts`

Base unit is 4 px. Valid values: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Never hardcode a spacing value outside this scale. If a layout needs 10 px, use 8 px or 12 px.

In Tailwind, these map to `space-1` through `space-16` with the exact pixel values above set in `tailwind.config.ts` under `theme.extend.spacing`.

**Touch targets:** Every interactive element on mobile has a minimum tap target of 44 x 44 px. If the visible element is smaller (e.g., a tag), use padding to expand the hit area without changing the visual size.

### 8.4 Corner radii

Exactly two values, no exceptions:

- `sm: 8 px` for tags, badges, chips, the AIMark badge, and input fields
- `lg: 16 px` for cards, buttons, sheets, and dialogs

Toggle tracks and circular avatar frames use `border-radius: 9999px`. That is a geometric choice (makes a pill or circle), not a third radius value in the design system.

Do not introduce intermediate radii (4 px, 6 px, 12 px, 24 px) for any component. If a component does not fit `sm` or `lg`, it is the wrong shape.

### 8.5 AIMark component

`src/design-system/primitives/AIMark.tsx` is the only permitted AI signature. It renders a small rectangular badge with the text "AI" in `aiMark` color on `aiMarkLight` background, with `border-radius: sm (8 px)`.

The text "AI" is a fixed abbreviation and is not translated or localized.

Every AI-sourced element in the UI carries an AIMark. Placement rules:
- In-line with a heading: AIMark to the right of the heading text, vertically centered.
- On a card: AIMark in the top-right corner of the card surface.
- On a button that triggers an AI action: AIMark to the left of the button label text.

No sparkle icons (`✨`), no magic-wand icons, no star clusters. If a third-party library ships any of these as a default icon, override it.

### 8.6 Motion

**Principle:** Motion communicates state change. It never decorates. If removing an animation does not change the user's understanding of what happened, the animation does not belong.

**CSS easing tokens** (set as CSS custom properties in `tailwind.config.ts`):

| Token | CSS value | Used for |
|-------|-----------|----------|
| `ease-standard` | `cubic-bezier(0.4, 0.0, 0.2, 1)` | Default transitions: toggles, most state changes |
| `ease-decelerate` | `cubic-bezier(0.0, 0.0, 0.2, 1)` | Entrances: elements arriving into view |
| `ease-accelerate` | `cubic-bezier(0.4, 0.0, 1.0, 1)` | Exits: elements leaving the screen |

**Interaction-level motion spec:**

| Interaction | What animates | Duration | Easing |
|------------|---------------|----------|--------|
| Pay gap number reveal | Counter from 0 to final value | 1 200 ms | `ease-decelerate` |
| Gap bar draw | `width` from 0 to computed % | 800 ms | `ease-decelerate` |
| Win stamp to ledger | `translateY(24px) → 0` + `opacity: 0 → 1` | 300 ms | `ease-decelerate` |
| Win card entering | As above | 300 ms | `ease-decelerate` |
| Sheet open (mobile) | `translateY(100%) → 0` | 250 ms | `ease-decelerate` |
| Sheet open (desktop) | `scale(0.96) → 1` + `opacity: 0 → 1` | 200 ms | `ease-decelerate` |
| Sheet close | Reverse of open | 200 ms | `ease-accelerate` |
| Page cross-fade | `opacity: 0 → 1` | 150 ms | `ease-standard` |
| Navigation tab switch | None | 0 ms | — |
| Streak counter pulse | `scale(1) → scale(1.15) → scale(1)` | 400 ms | `ease-standard` |
| Gap closed meter fill | `width` increment | 600 ms | `ease-decelerate` |
| Error field shake | `translateX: 0 → -8px → 8px → 0` | 400 ms | `ease-standard` |
| Upgrade CTA appearance | `opacity: 0 → 1` | 200 ms | `ease-standard` |

**CLS constraint on the pay gap result screen:** Reserve final layout dimensions before any animation starts. The gap amount element is sized to its maximum expected character width (use `ch` units, minimum 8 characters) before the count-up begins. No element shifts position during or after animation. CLS on this screen must be 0 before the count-up fires.

**Sound:** A soft stamp sound plays when a win is logged. Off by default. Users enable it in Settings under "Haptics and sound." The sound file is a single 16-bit WAV under 50 KB, loaded lazily after first user interaction (to comply with browser autoplay policy). Sound never plays during a Rehearsal Room session.

**Haptics:** `navigator.vibrate(40)` fires on win log confirm on mobile browsers that support it. No vibration on desktop. This is independent of the sound setting and independent of `prefers-reduced-motion`. Haptics are not motion.

### 8.7 Responsive layout system

The layout is one system with two display modes. There are no separate mobile and desktop component trees. The same components receive different layout classes from the shell.

**Breakpoints:**

| Name | min-width | Behavior |
|------|-----------|----------|
| `mobile` | 0 | Bottom nav bar, FAB anchored bottom-right, full-width sheets |
| `desktop` | 768 px | Left nav rail (240 px fixed), inline primary action, centered dialog overlays |

There is no intermediate tablet breakpoint. At exactly 768 px the layout mode switches. Components are not aware of the breakpoint; only the layout shell applies the mode class.

**Bottom nav bar (mobile, below 768 px):**
- Fixed to the bottom of the viewport.
- Height: 56 px + `env(safe-area-inset-bottom)` so the bar clears the iPhone home indicator and Android gesture bar.
- Five items in order: Wins, Rehearsal, Case Files, Circle, Profile. Same order as the Expo shell tab bar.
- Active item: `accent` icon and label. Inactive items: `inkMuted` icon and label.
- The FAB sits 16 px above the top edge of the nav bar, right-aligned with 16 px inset from the screen edge.

**Left rail (desktop, 768 px and above):**
- Fixed to the left of the viewport. Width: 240 px.
- Content area starts at `margin-left: 240px`.
- Same five items as the bottom nav, displayed as rows with icon (24 px) + label.
- Active item: `accent` text + `accentLight` background fill, `border-radius: lg`.
- No icon-only collapse mode at Part One scope.

**Primary action:**
- Mobile: floating action button (FAB), 56 px diameter, `accent` background, white `+` icon.
- Desktop: full-width `<Button variant="primary">` at the top of the wins list, labeled "Log a win."
- Both are rendered by one `<LogWinButton>` component that reads viewport width. The component renders the FAB below 768 px and the inline button at 768 px and above.

**Viewport height:**
- All full-screen layouts use `height: 100dvh`. Not `100vh`.
- `dvh` (dynamic viewport height) accounts for browser chrome on mobile (address bar, bottom bar) without JavaScript measurement.
- Support: Chrome 108+, Safari 15.4+, Firefox 109+. No fallback needed for the target browser matrix.

**Sheet component (one component, two modes):**
- `<Sheet>` reads a `useViewportWidth` hook. Below 768 px: bottom sheet sliding up from `translateY(100%)`. At 768 px and above: centered dialog with `max-width: 480px`, `border-radius: lg`, and a `rgba(26,26,26,0.5)` backdrop.
- Both modes: `role="dialog"`, `aria-modal="true"`, focus trap via the `inert` attribute on the rest of the document, closes on Escape key.
- The `<Sheet>` is the only overlay primitive. Confirmation dialogs, log-win forms, AI polish output, and upgrade prompts all use `<Sheet>`. There is no separate `<Dialog>` or `<Modal>` component.

**Safe area handling:**
- Bottom nav uses `padding-bottom: env(safe-area-inset-bottom)` in addition to its fixed height.
- The FAB uses `bottom: calc(56px + env(safe-area-inset-bottom) + 16px)` so it always sits above the nav bar regardless of device.
- Content pages use `padding-bottom: calc(56px + env(safe-area-inset-bottom) + 16px)` on mobile so the last list item is not hidden behind the nav bar.

### 8.8 Focus and keyboard

- Every interactive element has a visible focus ring: `outline: 2px solid var(--color-accent)` with `outline-offset: 2px`. No `outline: none` anywhere in the codebase without an equivalent, visible replacement.
- Arrow keys (`↑` / `↓`) navigate the wins list. `j` / `k` also work (Vim bindings, undocumented, not in help text).
- `Cmd+K` (Mac) and `Ctrl+K` (Windows/Linux) opens the log-a-win sheet from anywhere in the authenticated app.
- Tab order follows visual order. No programmatic `tabindex` manipulation except on sheets and dialogs, which trap focus. Focus trap implementation: set `inert` on everything outside the active sheet; remove `inert` on close.
- On sheet open: focus moves to the first focusable element inside the sheet (typically the first input or the close button if there are no inputs).
- On sheet close: focus returns to the element that triggered the sheet open.
- The wins list supports `role="list"` with each item as `role="listitem"`. Arrow key navigation is implemented with `roving tabindex` on the list items.

### 8.9 Feedback layer

The four primary feedback moments that make the product feel physical and earned. Each must be implemented exactly as specified.

**1. Pay gap reveal**

This is the screen users screenshot and share. It is the product's most important moment.

Timing sequence after the result screen mounts:

| Elapsed | Event |
|---------|-------|
| 0 ms | Screen mounts. Layout fully reserved. Gap amount placeholder shows at final character width. |
| 200 ms | Count-up starts: `0` to final value over 1 200 ms. |
| 800 ms | Gap bar starts drawing: `width: 0` to computed percentage over 800 ms. |
| 1 400 ms | Count-up completes. Estimate landing copy fades in over 200 ms. |
| 1 600 ms | Social proof line ("RaiseHER users have closed $X in pay gaps") fades in over 200 ms. |
| 2 000 ms | Share button appears. PWA install prompt fires if `beforeinstallprompt` was captured. |

Screen readers receive the final gap amount immediately in an `aria-live="polite"` region on mount. The visual count-up is decorative for assistive technology; the region announces the final value once, not each intermediate number.

**2. Win stamp**

When a win mutation confirms (Convex optimistic update resolves):

1. The new win card inserts at the top of the ledger (list sorted `createdAt DESC`) with `translateY(24px)` and `opacity: 0`.
2. Over 300 ms it settles to `translateY(0)` and `opacity: 1`.
3. If sound is enabled, the stamp WAV plays at the 150 ms mark.
4. `navigator.vibrate(40)` fires at the same moment as the sound trigger.
5. The streak counter rerenders. If the streak value increased, the scale pulse runs.
6. If the win had an `estimatedValue`, the gap closed meter updates.

The wins list does not scroll on log. The new card appears at the top because the list is sorted newest-first. No toast notification is shown; the stamp animation is the confirmation.

**3. Streak counter**

Displayed in the Wins screen header. Icon: an SVG flame (not an emoji or icon-font glyph). Counter: the number of consecutive calendar days with at least one win logged.

On streak increase:
- The count number runs `scale(1) → scale(1.15) → scale(1)` over 400 ms with `ease-standard`.
- The flame icon stays at full opacity with no size change. Only the number pulses.

On streak break (no win in the past calendar day):
- No animation. Count resets to 0 silently on next page load. No toast, no "you broke your streak" state. Punishment is not the product's job.

**4. Gap closed meter**

Displayed on the Wins screen beneath the streak. A labeled progress bar from `$0` to `gapAmount` (from the user's active `payGapProfile`).

Bar fill = sum of `estimatedValue` across all the user's wins, capped at `gapAmount`.

On new win with `estimatedValue`:
- Bar width increments over 600 ms with `ease-decelerate`.
- The dollar label (`$X of $Y gap closed`) updates immediately without animation.

The meter is not shown until the user has both a `payGapProfile` record and at least one win with `estimatedValue`. Do not show an empty or zero-fill meter; it reads as broken, not motivating.

### 8.10 Reduced-motion contract

`prefers-reduced-motion: reduce` disables every animated transition in the product. No exceptions.

**Implementation rule:** Write base styles as the instant, no-motion state. Apply motion inside a `@media (prefers-reduced-motion: no-preference)` block. Never invert this by writing the animated style first and then overriding it with a reduced-motion query.

```css
/* Correct */
.win-card { opacity: 1; transform: none; }

@media (prefers-reduced-motion: no-preference) {
  .win-card-entering {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 300ms ease-out, transform 300ms ease-out;
  }
}

/* Wrong — do not do this */
.win-card-entering {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 300ms ease-out, transform 300ms ease-out;
}
@media (prefers-reduced-motion: reduce) {
  .win-card-entering { opacity: 1; transform: none; transition: none; }
}
```

**Pay gap count-up under reduced motion:** The pay gap amount appears at its final value immediately on mount. No count from zero. Layout dimensions are still reserved before mount so CLS is still zero.

**Gap bar under reduced motion:** The bar appears at its computed fill percentage immediately. No width animation.

**Streak pulse under reduced motion:** The counter number updates to the new value with no scale animation.

**Sound under reduced motion:** Sound is controlled by its own setting in Settings (off by default). `prefers-reduced-motion` does not affect sound.

**Haptics under reduced motion:** `navigator.vibrate` still fires. Haptics are tactile feedback, not visual motion.

**Verification:** The launch checklist item "`prefers-reduced-motion` disables all animations" must be confirmed in Chrome DevTools (Rendering panel, emulate prefers-reduced-motion: reduce) and by a manual keyboard-only walkthrough before the public URL is shared.

---

## Section 9: Non-Functional Requirements

### 9.1 Performance

| Metric | Target | Notes |
|--------|--------|-------|
| Largest Contentful Paint | Under 2.5 s on 4G | Measured on Lighthouse mobile profile |
| First Input Delay | Under 100 ms | |
| Cumulative Layout Shift | Under 0.1 | Pay gap result screen is the highest risk; number reveal must reserve space before the count-up starts |
| Time to Interactive | Under 3.5 s on 4G | |
| Pay gap generation round-trip | Under 30 s | Shown in `paygap.loading_detail` copy; 30 s is the SLA |

The pay gap result screen is the most performance-sensitive page because it is the one users share and screenshot. Layout shift on that screen is a hard failure.

### 9.2 Accessibility

- WCAG 2.1 AA. No exceptions for launch.
- Color contrast: all text on `canvas` or `surface` backgrounds meets 4.5:1. The `accent` color on white background fails 4.5:1 for body text; do not use `accent` as a background for dark body text.
- Screen reader: every dynamic update (pay gap result appearing, win logged, AI polish returned) announces via `aria-live="polite"`.
- The pay gap number reveal animation does not block screen readers. Screen readers receive the final value immediately; the visual animation is decorative for them.
- Alternative text on all meaningful images. The OG share card image has a matching text summary available via the share flow.

### 9.3 Internationalization

Four locales at launch: `en`, `es`, `fr`, `pt`. next-intl handles locale routing. Locale lives in the URL (`/es/wins`), not in a cookie or header.

Static strings: eight JSON namespace files per locale in `src/i18n/locales/[locale]/`. The filenames and key structure do not change when adding locales; add the new locale folder with the same eight files.

Dynamic AI content: generated in `users.preferredLanguage` by Gemini at generation time. The locale of the UI and the locale of the AI narrative are the same.

RTL is not in scope for Part One. The layout does not need to be RTL-compatible at launch.

### 9.4 Security

- Convex mutations check `ctx.auth.getUserIdentity()` before reading or writing any user-owned record. No mutation reads another user's data.
- `isFounder` is set server-side in the Clerk webhook handler. It is never set by client request.
- The Agent Ops Dashboard route (`/agent-ops`) middleware-checks `isFounder` on every request. A non-founder user who navigates to the URL gets a 404, not a 403, so the route does not reveal its existence.
- Stripe webhook signatures are verified before any revenue record is written.
- The OG image route (`/og/paygap`) does not render user-identifiable data. Gap amount, role, and currency are the only values. No name, no email, no Clerk ID.

### 9.5 Infrastructure and cost

All services used at zero or predictable-free tiers:

| Service | Tier | Hard limit | What happens at limit |
|---------|------|-----------|----------------------|
| Vercel | Hobby | 100 GB bandwidth/month | Build and deploy stop; the existing deploy keeps serving |
| Convex | Free | 1 GB storage, 1M function calls/month | Reads and writes start failing with a rate-limit error |
| Clerk | Free | 10,000 MAUs | Sign-in page shows an error |
| Gemini | Free (gemini-2.0-flash) | Quota varies; currently 1,500 requests/day | Pay gap generation returns an error with a "try again later" message |

When any limit is within 20% of being hit, the Finance agent writes a `revenueEntries` alert record and the Agent Ops Dashboard surfaces it. The cron that computes `aggregatePlatformStats` also checks quotas on each run.

### 9.6 Privacy

- User pay data (`currentSalary`, `gapAmount`, `aiAnalysis`) is never read by other users.
- `aggregatePlatformStats` aggregates are computed server-side; no raw individual values are ever surfaced in aggregate endpoints.
- `submissionContacts` is a fully separate table with its own access controls. It is never joined with anonymized app data in any query.
- The privacy policy is a static page at `/en/privacy`. It is written in plain English, not legalese.
- User data is never used to train AI models. This is stated explicitly in `onboarding.slide3_body` and on the privacy page.

---

## Section 10: Web Launch Readiness

This section replaces the app store review section from the mobile PRD. The web launch readiness bar is lower in one direction (no gatekeeper approval) and higher in another (SEO, Core Web Vitals, and PWA installability are live on day one).

### 10.1 SEO

Every page that a new visitor might land on must be statically renderable with a full `<head>`.

| Page | Title tag | Description | Canonical |
|------|-----------|-------------|-----------|
| `/en/` | "RaiseHER: Know your pay gap" | "Find out if you are underpaid, log your wins, and practice the conversation." | `https://raiseher.app/en/` |
| `/en/sign-up` | "Create your RaiseHER account" | "Free to join. No credit card." | `https://raiseher.app/en/sign-up` |
| Authenticated routes | `"RaiseHER"` | None (noindex) | noindex |
| `/agent-ops` | None | None | noindex, nofollow |

The home page (`/en/`) is the only page that carries substantive SEO value. It is a Next.js server component that renders without a Convex connection. It does not show any user-specific data. Its primary CTA is "See your pay gap" which flows directly to sign-up.

### 10.2 Open Graph and share

| Route | `og:title` | `og:image` |
|-------|-----------|-----------|
| `/en/` | "RaiseHER: Know your pay gap" | Static OG image: wordmark on cream |
| Pay gap result | "I found my pay gap" | Dynamic: `/og/paygap?gap=...` |

The share flow on the pay gap result page uses the Web Share API if available, falling back to a "Copy link" button. The link includes the gap params so the OG image renders the user's specific number. The link does not include any user-identifying information.

### 10.3 Lighthouse and Core Web Vitals targets

Measured on the home page and the wins page at launch. Both must pass before the public URL is shared.

| Metric | Target |
|--------|--------|
| Performance | 90+ |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| LCP | Under 2.5 s |
| CLS | Under 0.1 |
| FID / INP | Under 100 ms |

The pay gap result page is exempt from the Performance target because Convex real-time and Gemini generation are outside Lighthouse's measurement scope. It must still meet the LCP and CLS targets for the static shell before the result loads.

### 10.4 PWA installability

The install prompt on the pay gap result screen requires:
- `manifest.webmanifest` linked in `<head>` with correct MIME type.
- Service worker registered (Workbox via `next-pwa` or a minimal custom worker).
- The app served over HTTPS (Vercel provides this automatically).
- `beforeinstallprompt` event captured and deferred until the pay gap reveal animation completes.

The install prompt copy is: "Add RaiseHER to your home screen to track wins and practice negotiation without opening a browser."

A user who installs and later upgrades to the paid plan gets the same subscription flow in standalone mode. The Stripe checkout opens in a browser tab (not in-app), which avoids any PWA payment flow edge cases.

### 10.5 Subscription path

Stripe handles all payments. No Apple IAP, no Google Play billing.

Free tier: pay gap calculation, wins ledger, AI polish (5 uses per month), basic case file.
Paid tier ("RaiseHER Pro", $9/month): unlimited AI polish, Rehearsal Room, full case file export, priority support.

The upgrade CTA appears in three places:
1. After the 5th AI polish use ("You have used your 5 free polishes this month. Upgrade to keep going.")
2. On the Rehearsal Room screen ("Rehearsal is part of RaiseHER Pro.")
3. In Settings, always visible as a non-intrusive line item.

Checkout flows through the existing `checkout/` Next.js app (already wired to Stripe). The `revenueEntries` table records every successful charge. The Finance agent reads these entries to compute monthly recurring revenue.

### 10.6 Launch checklist

The following must be true before the public URL is shared. Each item maps to a specific test that can be run against the deployed URL.

- [ ] Home page loads without a Clerk session and renders full content (no white flash, no "loading..." state).
- [ ] Pay gap intake to result completes in under 30 seconds on a fresh account.
- [ ] Win logged and visible in the ledger within 2 seconds of submission.
- [ ] AI polish returns a result or a clear error message within 15 seconds.
- [ ] Lighthouse Performance score is 90+ on the home page.
- [ ] Lighthouse Accessibility score is 100 on the home page and the wins page.
- [ ] OG image renders correctly when the pay gap result URL is pasted into Slack or iMessage.
- [ ] PWA install prompt appears on the pay gap result screen.
- [ ] Stripe checkout completes a test-mode payment and writes a `revenueEntries` record.
- [ ] `/agent-ops` returns 404 for a non-founder signed-in user.
- [ ] All four locales (`en`, `es`, `fr`, `pt`) load the home page without missing-key errors.
- [ ] `prefers-reduced-motion` disables all animations (verified in Chrome DevTools emulation).

### 10.7 Week-by-week milestones

**Week 1:** Convex, Clerk, and next-intl wired into the Next.js app. Sign-up to pay gap result is the complete, working path. No styling required; plain HTML is acceptable.

**Week 2:** Wins ledger and AI polish working. Bottom nav and left rail implemented. Tailwind tokens match `colors.ts` and `spacing.ts`. Pay gap result screen motion implemented.

**Week 3:** Public preview URL live at `raiseher.app/en/`. Home page passes Lighthouse targets. OG image renders. PWA manifest present. Stripe checkout reachable from the upgrade CTA.

**Week 4:** Launch checklist fully green. Builder Two Rehearsal Room placeholder screens visible in the nav (locked behind "coming soon" state, not behind auth). `prefers-reduced-motion` verified. Performance budget met.

---

## Section 17: Zero-Budget Infrastructure

This section is the operational contract for a zero-budget deployment. It covers the exact limits of every service in the stack, what happens when those limits are reached, how to stay below them by default, and the two subsystems (browser speech and Stripe) that require more than a table entry to implement correctly.

### 17.1 Free tier limits per service

The table below is the definitive reference for every hard constraint the product runs against. "Hard limit" means the service stops working, not slows down.

| Service | Plan | Limit type | Limit value | What happens when hit | Recovery |
|---------|------|-----------|-------------|----------------------|----------|
| Vercel | Hobby | Bandwidth | 100 GB/month | Build and deploy stop; the current deploy continues serving until the billing period resets | Wait for reset or upgrade to Pro ($20/month) |
| Vercel | Hobby | Serverless execution | 100 GB-hours/month | Functions return 500; static assets still serve | Same as above |
| Convex | Free | Function calls | 1 M/month | Queries and mutations return a rate-limit error | Wait for reset; no self-serve upgrade path in the free tier UI |
| Convex | Free | Storage | 1 GB | Mutations that write new data fail | Delete old data or upgrade |
| Convex | Free | Bandwidth | 1 GB/month | Data reads return an error | Same as above |
| Clerk | Free | Monthly active users | 10,000 MAU | Sign-in page returns an error | Upgrade to Clerk Pro ($25/month base) |
| Gemini | Free (gemini-2.0-flash) | Requests | 1,500/day | `payGapAction` and win polish return a quota error | Wait for next UTC midnight reset |
| Gemini | Free | Tokens per minute | 1,000,000 | Individual request fails; next request may succeed | Retry after 60 seconds |
| Stripe | No monthly fee | None (pay-per-transaction) | None | N/A | N/A |

**The binding constraint at launch is Gemini.** 1,500 requests per day is the first limit the product will hit at scale. At 500 active users, even a 20% daily pay gap regeneration rate reaches 100 requests per day; the quota is safe. Once users exceed 1,500 daily active actions involving Gemini, the limit becomes visible. The mitigation strategy in Section 17.2 delays that point significantly.

### 17.2 Rate limit mitigations

Each service has a specific mitigation strategy. These are implemented behaviors, not aspirational plans.

**Gemini**

*Deduplication on pay gap requests.* Before calling `payGapAction`, check whether the user has a `payGapProfile` record created in the last 30 days. If one exists, prompt: "You already have a pay gap result from [date]. Recalculate or view the existing result?" Only proceed with a new Gemini call if the user confirms recalculation. Implement this check in the result screen before the action is dispatched, not in the Convex action itself. This alone eliminates a large fraction of redundant API calls.

*Hard limit on win polish.* Free users receive 5 win polish actions per calendar month. This is enforced server-side in the Convex action (`api.winsAction.polishWin`). The action checks a `polishUsage` field on the `users` document (reset monthly by the cron). On limit reached, the action throws with code `"POLISH_LIMIT_EXCEEDED"` and the client shows the upgrade CTA. This protects the Gemini quota and creates upgrade pressure simultaneously.

*Retry with backoff.* When `payGapAction` receives a Gemini 429 error, the action retries once after 5 seconds before failing. The result screen already has a 30-second loading SLA, so a single 5-second retry is invisible to the user.

*Quota check in the Finance agent cron.* The cron that computes `aggregatePlatformStats` runs daily. On each run it also checks `agentActivityLog` for the count of Gemini calls in the past 24 hours. When that count exceeds 1,200 (80% of the 1,500 daily limit), the cron writes a `revenueEntries` record of type `"ALERT"` with a `note` of `"Gemini quota at 80%"`. The Agent Ops Dashboard surfaces all alert records at the top of the log view.

**Convex**

*Bounded queries everywhere.* No query in the codebase uses `.collect()` on a table that can grow without bound. `api.wins.listWins` paginates. `api.payGap.getPayGapProfiles` takes a `limit` argument. `api.dashboard.getAgentActivityLog` paginates. This is not just a Convex best practice; it is the primary defense against hitting the 1 M function call limit with a small but active user base.

*No polling on the result screen.* `useQuery(api.payGap.getPayGapProfiles)` uses Convex's real-time subscription, not a polling interval. One initial query plus one push when the result is written. Do not add a `setInterval` or a manual refetch loop.

*Storage monitoring.* The Finance agent cron checks `aggregatePlatformStats.totalStorageBytes` (a field maintained by the cron, computed by querying `_storage` metadata) against the 1 GB limit. Alert threshold: 80% (820 MB). This is most relevant for any future file upload features, not for the current text-only schema.

**Vercel**

*Static where possible.* The home page, sign-in page, and sign-up page are statically rendered. They consume no serverless execution budget and minimal bandwidth. The only dynamic Vercel functions are the Clerk webhook handler, the Stripe webhook handler, and the OG image route. All are invoked only on external events, not on every page load.

*OG image caching.* The `/og/paygap` route returns `Cache-Control: public, max-age=86400, stale-while-revalidate=3600`. The same gap amount, role, and locale combination generates the same image every time. Vercel's CDN caches it after the first request. This matters because a shared pay gap result can generate hundreds of OG image requests in a short window.

**Clerk**

*MAU tracking.* The Finance agent cron reads the total user count from `aggregatePlatformStats.totalUsers`. When `totalUsers` exceeds 8,000 (80% of the 10,000 MAU limit), the cron writes a `"ALERT"` entry to `revenueEntries` with `note: "Clerk MAU at 80%"`. At this point Clerk Pro ($25/month) should be provisioned before the limit is hit. The 10,000 MAU hard limit is the second-most-binding constraint after Gemini.

### 17.3 Browser speech for the Rehearsal Room handoff

The Rehearsal Room uses browser-native speech APIs. There is no third-party speech service, no billing per minute, and no audio sent to a remote server. Gemini receives only text.

**What runs in the browser**

*Listening:* `window.SpeechRecognition` (Chrome, Edge) or `window.webkitSpeechRecognition` (Safari). The API streams a live transcript; the final result fires on `result` events with `isFinal: true`. Recognition runs in the browser process, not on any server.

*Speaking:* `window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))`. The voice is selected from the browser's installed voices. On initial load, call `speechSynthesis.getVoices()` and pick the first voice whose `lang` matches the user's current locale. If no match, use the browser's default voice.

*AI response generation:* The user's spoken (or typed) input is sent to a Convex action as a text string. The action calls Gemini with the negotiation scenario context and the user's input. Gemini returns a text response. The action writes the turn to `rehearsalSessions`. The browser receives the text response via a real-time Convex subscription and speaks it with `speechSynthesis`.

**Browser support matrix**

| Browser | SpeechRecognition | speechSynthesis | Result |
|---------|------------------|----------------|--------|
| Chrome 108+ | Yes | Yes | Full voice mode |
| Safari 15.4+ | Yes (webkit prefix) | Yes | Full voice mode |
| Firefox 109+ | No | Yes | Text-only mode (first-class path, not degraded) |
| Mobile Chrome (Android) | Yes | Yes | Full voice mode |
| Mobile Safari (iOS 16+) | Yes | Yes | Full voice mode |

Firefox has supported `speechSynthesis` for years but has not shipped `SpeechRecognition` to stable. The text path must work without any degraded-mode framing. Firefox users do not receive a banner saying "voice not supported." They receive the same interface with a text input instead of a microphone button.

**Hook contract (Builder Two inherits these hooks from the web/ directory)**

`web/hooks/useSpeechInput.ts` returns:

```ts
{
  isSupported: boolean;        // true if SpeechRecognition or webkitSpeechRecognition is present
  isListening: boolean;        // true while recognition is active
  transcript: string;          // current (possibly partial) transcript
  finalTranscript: string;     // transcript on isFinal: true events
  startListening: () => void;
  stopListening: () => void;
  error: "not-allowed" | "aborted" | "no-speech" | null;
}
```

Initialization: detect `window.SpeechRecognition || window.webkitSpeechRecognition`. If neither exists, `isSupported` is false and the other values are inert. Do not throw; do not log a console error. The hook is importable by Firefox users without consequences.

`web/hooks/useSpeechOutput.ts` returns:

```ts
{
  speak: (text: string, locale: string) => void;
  cancel: () => void;
  isSpeaking: boolean;
}
```

`speak` creates a new `SpeechSynthesisUtterance`, sets `utterance.lang = locale`, selects the best available voice, and calls `speechSynthesis.speak(utterance)`. `cancel` calls `speechSynthesis.cancel()`. `isSpeaking` tracks the `start` and `end` events on the utterance.

**Sound rule during rehearsal.** The stamp WAV sound (Section 8.6) is suppressed while a rehearsal session is active. The `useSpeechOutput` hook exposes `isSpeaking`. The wins ledger's sound trigger checks this flag before playing the stamp audio to prevent audio collision.

**Convex schema for Builder Two (read-only reference)**

The following fields on `rehearsalSessions` are what the Rehearsal Room feature reads and writes. They are frozen in `convex/schema.ts` and must not change without a joint decision:

- `payGapProfileId`: the user's active pay gap profile. The Rehearsal Room reads `role`, `industry`, `gapPercentage`, and `gapAmount` from this record to initialize the negotiation scenario.
- `scenario`: the manager persona and negotiation context, generated from `payGapProfile` fields by a Convex action.
- `turns`: array of `{ role: "user" | "ai", text: string, createdAt: number }`. Builder Two may paginate this if sessions grow long.
- `status`: `"active" | "completed"`. A session is completed when the user taps "End practice" or when 20 turns have elapsed (configurable by founder in Agent Ops).

**The Gemini call for rehearsal AI responses**

Builder Two's rehearsal Convex action calls `gemini-2.0-flash` with a system prompt that includes:
- The negotiation scenario (manager persona, company context)
- The user's role and gap amount from `payGapProfile`
- All prior turns in the session as conversation history
- An instruction not to exceed 3 sentences per response

Each turn is one Gemini request. A 10-turn session consumes 10 Gemini requests. At 1,500 requests per day, the quota supports 150 complete 10-turn sessions per day across all users. This is the second Gemini budget line alongside pay gap generation.

The rehearsal Convex action must write to `agentActivityLog` on every call, with `agentName: "rehearsalAgent"`, so the Finance agent cron can track combined Gemini usage across both agents.

### 17.4 Stripe subscription path

Stripe has no monthly fee. The 2.9% + 30 cents per transaction cost is deducted from each payment, not billed separately. A $9 charge nets approximately $8.44 after fees.

**Product and price setup (done once in Stripe dashboard)**

- Product name: "RaiseHER Pro"
- Price: $9.00 USD recurring monthly
- `STRIPE_PRICE_ID_PRO_MONTHLY` in `web/.env.local` and Vercel environment variables holds the Price ID
- No trial period. The upgrade decision happens after the user has already seen their pay gap result and hit a limit; a trial does not add value at that point.

**Checkout session creation**

`web/app/api/checkout/route.ts` is a POST endpoint that:

1. Reads the authenticated user's Clerk ID from the session via `auth()` from `@clerk/nextjs/server`.
2. Calls a Convex action (`api.stripe.createCheckoutSession`) that creates a Stripe Checkout Session using the Stripe Node SDK and returns the session URL.
3. Returns `{ url: string }` to the client.
4. The client navigates to the URL.

The Convex action (`convex/stripe.ts`) does the following:

```ts
"use node";
import Stripe from "stripe";

export const createCheckoutSession = action({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: process.env.STRIPE_PRICE_ID_PRO_MONTHLY!, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/en/settings?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/en/settings?upgrade=cancelled`,
      metadata: { clerkId },
    });
    return session.url;
  },
});
```

Do not pass user-identifiable information other than `clerkId` in metadata. Do not pass `currentSalary` or pay gap data.

**Stripe webhook handler (`web/app/api/webhooks/stripe/route.ts`)**

Handles `checkout.session.completed` and `invoice.payment_succeeded`. Both write a `revenueEntries` record:

```ts
await convex.mutation(api.revenue.recordPayment, {
  userId,             // resolved from metadata.clerkId via convex users table
  amount,             // in cents, from event
  currency,           // from event
  stripeSessionId,    // event ID for deduplication
  recordedAt: Date.now(),
});
```

Stripe webhooks can deliver the same event more than once. Deduplicate by checking whether a `revenueEntries` document with the same `stripeSessionId` already exists before writing. The mutation does this check with a `.withIndex("by_stripe_session_id")` query; the index must exist in `convex/schema.ts`.

**Subscription status resolution**

Section 16.5 specifies `getSubscriptionStatus` in `convex/users.ts`. The logic is: a user is "pro" if a `revenueEntries` record with their `userId` exists within the last 35 days. The 35-day window covers the monthly billing cycle with a 5-day buffer for late or retried charges. This is a query, not a Stripe API call, so it adds no latency and no external dependency to the subscription check.

**Customer Portal**

A subscribed user who wants to cancel navigates to Settings and taps "Manage subscription." This calls a Convex action that creates a Stripe Customer Portal session and returns its URL. The client navigates to the URL. The Portal opens in a new tab (not in-app) so PWA mode users are not stranded if the Portal triggers a redirect.

To create a Portal session, the action needs the user's Stripe Customer ID. Store this ID in the `users` document as `stripeCustomerId` (nullable string) at the time of the first successful payment. The webhook handler writes it when recording the `checkout.session.completed` event.

**Add `NEXT_PUBLIC_APP_URL` to the environment variable list**

`web/.env.local` and Vercel must include:

```
NEXT_PUBLIC_APP_URL=https://raiseher.app
```

Used by the Stripe checkout action to construct `success_url` and `cancel_url`. In local development this is `http://localhost:3000`. Do not hardcode the domain string in the action.

---

## Appendix A: Migration Guide from Expo Shell to Web

Builder One owns the migration. Builder Two reads this appendix to understand what they are inheriting and what the web client's asset origins are.

Three categories: unchanged assets that move directly, assets that get ported to web equivalents, and assets that are retired.

---

### A.1 Carries Over Unchanged

These assets are platform-neutral. Builder One copies or symlinks them into `web/` without modification. Their behavior, shape, and content do not change.

**Convex backend (entire `convex/` directory)**

The web client connects to the same Convex deployment as the Expo shell. No backend files change. Builder One and Builder Two inherit the same running backend from day one.

| File | What it does | Builder note |
|------|-------------|--------------|
| `convex/schema.ts` | All table definitions for both builders | The handoff boundary (`scenarios.payGapProfileId`) is already in this file. Do not alter without a joint decision. |
| `convex/payGapAction.ts` | Gemini call, benchmark salary extraction, `agentActivityLog` write | The `BENCHMARK_SALARY:` marker parsing and the 1.15x fallback are battle-tested. Do not re-implement. |
| `convex/payGapMutations.ts` | `insertProfile` internal mutation | Called by `payGapAction`; no client touches this directly. |
| `convex/payGap.ts` | `requestPayGapAnalysis` mutation and `getPayGapProfiles` query | The public API surface Builder One's components call. |
| `convex/wins.ts` | Full CRUD for the `wins` table | Builder Two reads win count from this same file via `api.wins.listWins`. |
| `convex/winsAction.ts` | `polishWin` action (Gemini), `weeklyNudge` cron handler | The `POLISH_LIMIT_EXCEEDED` error code the web client reads is thrown here. |
| `convex/users.ts` | `upsertFromClerk`, `getCurrentUser`, `updatePreferredLanguage`, `deleteUserData` | Builder One adds `getSubscriptionStatus` to this file per Section 16.5. |
| `convex/agentActivityLog.ts` | `logActivity` internal mutation | Both builders' agents write here. The Agent Ops Dashboard reads the full table. |
| `convex/stripe.ts` | `createCheckoutSession` and webhook support | The `"use node"` Stripe action already exists; the web checkout absorbs `checkout/` around it. |
| `convex/http.ts` | HTTP router for Clerk and Stripe webhooks | Builder One's Next.js webhook routes (`/api/webhooks/clerk`, `/api/webhooks/stripe`) replace this for the web path. The Convex HTTP router remains for any non-Next.js webhook traffic. |
| `convex/dashboard.ts` | `getPlatformStats`, `getAgentActivityLog` | Agent Ops Dashboard queries. Unchanged. |
| `convex/crons.ts` | Five scheduled jobs: growth, support, finance, platform-stats, acquisition | These run independently of the client platform. No changes. |
| `convex/agents/growth.ts` | Daily social content drafts | Unchanged. |
| `convex/agents/support.ts` | 4-hour support message scan | Unchanged. |
| `convex/agents/finance.ts` | Daily revenue/expense reconciliation, quota alerts | This agent writes the Gemini and Clerk MAU alert records the Agent Ops Dashboard surfaces. |
| `convex/agents/platformStats.ts` | Hourly aggregate recompute | Unchanged. |
| `convex/agents/acquisition.ts` | Weekly outreach drafts | Unchanged. |
| `convex/lib/gemini.ts` | `generateNativeContent` helper used by all Gemini callers | Unchanged. |

**Translation files (`src/i18n/locales/`)**

All 32 JSON files (8 namespaces x 4 locales: `en`, `es`, `fr`, `pt`) carry over with the same key structure. next-intl reads the same namespace names and key paths that react-i18next uses. Copy or symlink the entire `src/i18n/locales/` tree to `web/i18n/locales/`. While both shells exist, edit both locations when any key changes.

| Namespace | Key count (en) | Used by |
|-----------|---------------|---------|
| `common` | ~20 | Both builders |
| `onboarding` | ~30 | Builder One |
| `paygap` | ~25 | Builder One |
| `wins` | ~30 | Builder One, Builder Two (win count display) |
| `settings` | ~25 | Builder One |
| `rehearsal` | ~15 | Builder Two |
| `casefiles` | ~10 | Builder Two |
| `circle` | ~10 | Builder Two |

**Design system tokens**

The token values carry over exactly. The format changes from TypeScript objects (for React Native `StyleSheet`) to CSS custom properties (for Tailwind v4).

| Source file | Carries over as | Action |
|-------------|----------------|--------|
| `src/design-system/tokens/colors.ts` | CSS custom properties in `web/app/globals.css` | Map each `lightColors` entry to `--color-[kebab-name]`. Dark values go in a `@media (prefers-color-scheme: dark)` block. |
| `src/design-system/tokens/spacing.ts` | `theme.extend.spacing` in `web/tailwind.config.ts` | The 11-step scale (0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64) maps to Tailwind class suffixes 0 through 16. |
| `src/design-system/tokens/motion.ts` | `theme.extend.transitionTimingFunction` in `web/tailwind.config.ts` | Three easing curves: `standard`, `decelerate`, `accelerate`. |
| `src/design-system/tokens/typography.ts` | `theme.extend.fontSize` in `web/tailwind.config.ts` | Six steps: `display` (32), `heading1` (24), `heading2` (20), `body` (16), `label` (14), `caption` (12). |

**Utility library**

| File | Carries over as | Action |
|------|----------------|--------|
| `src/lib/currency.ts` | `web/lib/currency.ts` | Copy verbatim. The file uses `Intl.NumberFormat` with no React Native dependencies. |

---

### A.2 Gets Ported (Rewritten for Web)

These assets have direct web equivalents. The logic and UI intent carry over; the implementation technology changes from React Native to React/HTML/CSS.

**Auth screens**

| Expo file | Web equivalent | What changes |
|-----------|---------------|--------------|
| `app/(onboarding)/sign-in.tsx` | `web/app/[locale]/sign-in/[[...sign-in]]/page.tsx` | Expo used a custom form calling Clerk's JS SDK. Web renders Clerk's `<SignIn />` component with appearance tokens. No custom form logic needed. |
| `app/(onboarding)/sign-up.tsx` | `web/app/[locale]/sign-up/[[...sign-up]]/page.tsx` | Same pattern. `<SignUp />` component. `afterSignUpUrl` points to `/[locale]/onboarding/paygap`. |
| `app/(onboarding)/verify-email.tsx` | Handled internally by Clerk's `<SignUp />` component | No separate page required. Clerk handles the email verification flow within its component. |
| `app/(onboarding)/welcome.tsx` | `web/app/[locale]/page.tsx` | The welcome splash becomes the home page server component. Same one-line statement, same CTA. |
| `app/(onboarding)/language.tsx` | Absorbed into `web/app/[locale]/settings/page.tsx` | Language selection moves to the Settings screen. No standalone onboarding step. |
| `app/oauth-callback.tsx` | Not needed | Clerk's web SDK handles the OAuth callback route automatically. |

**Pay gap screens**

| Expo file | Web equivalent | What changes |
|-----------|---------------|--------------|
| `app/(onboarding)/paygap-intake.tsx` | `web/components/paygap/PayGapIntakeForm.tsx` | React Native `TextInput` and `Picker` become `<input>` and `<select>`. The six fields, validation logic, and `sessionStorage` intake cache are identical. |
| `app/(onboarding)/paygap-result.tsx` | `web/components/paygap/PayGapResult.tsx` | The count-up animation changes from Reanimated to CSS transitions per Section 8.9. `aria-live` region is added for screen readers. The PWA install prompt and share card are new additions; the result data comes from the same `api.payGap.getPayGapProfiles` query. |

**Wins screens**

| Expo file | Web equivalent | What changes |
|-----------|---------------|--------------|
| `app/(tabs)/wins/index.tsx` | `web/app/[locale]/wins/page.tsx` + `WinsLedger.tsx` | `FlatList` becomes a `<ul role="list">`. Keyboard navigation (arrow keys, Cmd+K) is new. Stamp animation changes from Reanimated to CSS. |
| `app/(tabs)/wins/add-win.tsx` | `web/components/wins/WinForm.tsx` inside `<Sheet>` | The form fields carry over; the native modal becomes the web `<Sheet>` component. |
| `app/(tabs)/wins/[id].tsx` | Redirect to `/[locale]/wins?edit=[id]` per Section 14.9 | Same pattern as add-win. |

**Agent Ops Dashboard**

| Expo file | Web equivalent | What changes |
|-----------|---------------|--------------|
| `app/(internal)/agent-dashboard/index.tsx` | `web/app/agent-ops/page.tsx` | The dashboard reads the same Convex queries. The founder gate moves from Expo Router's `_layout.tsx` to Next.js middleware (404 for non-founders, per Section 9.4). |

**Navigation**

| Expo file | Web equivalent | What changes |
|-----------|---------------|--------------|
| `app/(tabs)/_layout.tsx` | `web/components/layout/AppNav.tsx` | The five-tab Expo tab bar becomes the `<AppNav>` component with two layout modes: bottom bar on mobile, left rail on desktop. Same five items in the same order. Active state logic is identical. |
| `app/_layout.tsx` | `web/app/layout.tsx` | `ClerkProvider` from `@clerk/clerk-expo` becomes `ClerkProvider` from `@clerk/nextjs`. `ConvexProviderWithClerk` import changes from `convex/react-clerk` (unchanged import path). `SafeAreaProvider` is not needed; safe area is handled with `env(safe-area-inset-*)` in CSS. `ThemeProvider` is retired (see A.3). |

**Profile and settings screen**

| Expo file | Web equivalent | What changes |
|-----------|---------------|--------------|
| `app/(tabs)/profile/index.tsx` | `web/app/[locale]/settings/page.tsx` | The profile screen maps to the Settings page. The subscription section switches from `src/lib/purchases.ts` (RevenueCat stub) to `api.users.getSubscriptionStatus` (Stripe-based, per Section 16.5). |

**Design system primitives**

Each primitive is rewritten from React Native (`View`, `Text`, `Pressable`, `StyleSheet`) to HTML and CSS. The visual output and interaction spec are identical. The component API (props, variants) carries over.

| Expo file | Web equivalent | Rewrite notes |
|-----------|---------------|---------------|
| `src/design-system/primitives/AIMark.tsx` | `web/components/primitives/AIMark.tsx` | `View` + `Text` becomes `<span>` + `<span>`. Same `size` prop. Same color tokens via CSS variables. |
| `src/design-system/primitives/Button.tsx` | `web/components/primitives/Button.tsx` | `Pressable` becomes `<button>`. `variant` prop carries over (`primary`, `secondary`, `ghost`, `destructive`). Add `type="button"` or `type="submit"` as needed. |
| `src/design-system/primitives/TextField.tsx` | `web/components/primitives/TextField.tsx` | `TextInput` becomes `<input>` or `<textarea>`. Add `aria-describedby` for error messages. Error shake animation via CSS class toggle. |
| `src/design-system/primitives/Tag.tsx` | `web/components/primitives/Tag.tsx` | `View` + `Text` becomes `<span>`. Same token usage. |
| `src/design-system/primitives/Card.tsx` | Inline CSS on `<div>` containers | The Card primitive was a thin `StyleSheet` wrapper. In the web, card styles are applied directly via Tailwind classes rather than a dedicated component. |
| `src/design-system/primitives/Dialog.tsx` | `web/components/layout/Sheet.tsx` | The React Native `Modal` + `Animated` pattern becomes the `<Sheet>` component with two modes (bottom sheet on mobile, centered dialog on desktop). |
| `src/design-system/primitives/DatePicker.tsx` | `<input type="date">` styled with Tailwind | The React Native date picker was a native module wrapper. The web uses the browser's native date input. |
| `src/design-system/primitives/Toggle.tsx` | `<input type="checkbox">` styled as toggle | Browser checkbox with CSS styling. Same `on`/`off` appearance via the token palette. |
| `src/design-system/icons/TabIcons.tsx` | Inline SVG paths in `AppNav.tsx` | The React Native SVG tab icons are rewritten as inline `<svg>` elements. Same five icons, same visual design. |

**i18n system**

| Expo file | Web equivalent | What changes |
|-----------|---------------|--------------|
| `src/i18n/index.ts` (i18next + react-i18next + expo-localization) | `web/i18n/routing.ts` + `web/i18n/request.ts` | The i18next initialization, `expo-localization` device detection, and SecureStore language persistence are all replaced by next-intl. Locale lives in the URL; no client-side detection or persistent storage needed. |
| `src/i18n/useLanguage.ts` | `useLocale()` from `"next-intl"` + `useRouter().push(...)` | Language change writes to Convex and navigates to the new locale URL (Section 15.4). No hook file needed. |

---

### A.3 Gets Retired

These assets have no equivalent in the web build. They are not copied to `web/`. They remain in the repo only because the frozen Expo shell still references them.

| Asset | Why retired | Replacement |
|-------|-------------|-------------|
| `src/lib/purchases.ts` | RevenueCat/Apple IAP stub. Never activated in production. The web has no app store, so IAP is not applicable. | `api.users.getSubscriptionStatus` (Convex query) + Stripe checkout per Sections 16.5 and 17.4. |
| `checkout/` as a separate app | The standalone checkout Next.js app was a temporary host for Stripe. It absorbs into `web/app/[locale]/checkout/` during Week 3. After absorption, `checkout/` directory is archived and excluded from future builds. | `web/app/[locale]/checkout/page.tsx` |
| `src/design-system/theme.tsx` | The React Native `ThemeContext` and `useTheme()` hook exist to thread color and spacing tokens into `StyleSheet` calls. The web uses CSS custom properties; no runtime theme context is needed. | `globals.css` CSS custom properties consumed directly via Tailwind classes. |
| `src/i18n/index.ts` (i18next configuration) | The i18next initialization and react-i18next wiring are Expo-specific. next-intl replaces the entire i18n runtime for the web. | `web/i18n/routing.ts` + `web/i18n/request.ts` |
| `src/i18n/useLanguage.ts` | Wraps i18next's `changeLanguage` and SecureStore persistence. Neither is used in the web build. | `useLocale()` from `"next-intl"` and URL-based navigation. |
| `expo-localization`, `expo-secure-store` | Device locale detection and language persistence. next-intl reads locale from the URL; no device API is needed. | next-intl locale routing. |
| `react-i18next`, `i18next` | The i18n runtime. | `next-intl`. |
| `react-native-purchases` (stub, not installed) | RevenueCat React Native SDK. Never installed; only a try/catch stub exists. | Stripe webhook + `revenueEntries` table. |
| `expo-*` packages (expo-router, expo-auth-session, expo-linking, expo-web-browser, expo-constants) | Expo SDK modules used by the native shell. | Web equivalents: `next/navigation`, Web Share API, native `<a>` links. |
| `react-native`, `react-native-web`, `react-native-safe-area-context`, `react-native-screens` | React Native renderer and platform abstractions. | DOM, `100dvh`, `env(safe-area-inset-*)`. |
| `app.json`, `eas.json` | Expo build and submit configuration. | Vercel `vercel.json` (already exists in `checkout/`; migrates to repo root or `web/`). |
| `expo-env.d.ts` | Expo TypeScript environment types. | `next-env.d.ts` generated by Next.js. |
| `app/(tabs)/rehearsal/index.tsx`, `casefiles/index.tsx`, `circle/index.tsx` | Placeholder screens in the Expo shell. The web placeholder screens are new files at `web/app/[locale]/rehearsal/page.tsx` etc. | Builder Two builds from the web placeholder screens, not from the Expo stubs. |

**Packages that stay in `package.json` (root) for the frozen Expo shell only**

The root `package.json` is the Expo shell's manifest. Do not move these to `web/package.json`. The web app has its own `package.json` in `web/`. When the Expo shell is retired (see Appendix B), these packages are removed from the root manifest.

```
react-native, react-native-web, react-native-safe-area-context,
react-native-screens, expo, expo-router, expo-auth-session,
expo-constants, expo-linking, expo-localization, expo-secure-store,
expo-status-bar, expo-web-browser, @clerk/clerk-expo,
i18next, react-i18next
```

---

### A.4 Schema changes required before launch

The Convex schema carries over unchanged with two exceptions. Both must be applied before Builder One's Week 1 work is complete.

**1. `revenueEntries` index for Stripe deduplication**

Section 17.4 requires deduplication of Stripe webhook events by `stripeSessionId`. Add a field and index to `revenueEntries`:

```ts
revenueEntries: defineTable({
  // ... existing fields ...
  stripeSessionId: v.optional(v.string()),   // add this
}).index('by_recorded_at', ['recordedAt'])
  .index('by_stripe_session_id', ['stripeSessionId']),  // add this
```

**2. `users` subscription fields for Stripe**

Section 17.4 requires storing the Stripe Customer ID on the user record so the Customer Portal link can be generated:

```ts
users: defineTable({
  // ... existing fields ...
  stripeCustomerId: v.optional(v.string()),  // add this
  polishUsageThisMonth: v.optional(v.number()),  // add this — reset monthly by finance agent cron
  polishUsageResetAt: v.optional(v.number()),    // Unix ms of last monthly reset
}),
```

Run `npx convex dev` after making these changes to push the schema. Existing documents are unaffected; optional fields default to `undefined`.

---

## Appendix B: Decisions

The previous PRD left four decisions open. Three were effectively resolved by the code that existed; one required a call. All four are closed here with explicit recommendations. These recommendations are final for Part One scope.

---

### Decision 1: Mobile-first or web-first?

**Decision: Web first. The Expo shell is frozen.**

The `checkout/` app has been Next.js since day one. Convex is fully platform-neutral. The Clerk integration in the Expo shell and the web app uses the same deployment and the same `users` table. The web app is the primary product; the frozen Expo shell is an archived starting point for a future native build.

**What "web first" means concretely:**

- Builder One ships the web app at `raiseher.app`. That URL is the product.
- The Expo shell at `app/` is not deleted. It is frozen at its current commit. It is not run, not updated, and not tested during Part One.
- When native is resourced (post-parity decision, see Decision 4), the Expo shell is the starting point for native, not a live product to be maintained in parallel.

---

### Decision 2: IAP or Stripe?

**Decision: Stripe only. `src/lib/purchases.ts` is retired.**

The RevenueCat stub in `src/lib/purchases.ts` was never activated. No `react-native-purchases` SDK was installed. Stripe is already wired in `checkout/` with a working `createCheckoutSession` action in `convex/stripe.ts`.

Stripe eliminates Apple's 30% commission, which at $9/month and any meaningful subscriber count would be the largest single cost line in the product. A PWA on the web is not subject to App Store billing rules.

`src/lib/purchases.ts` is not copied to `web/`. It is not removed from the repo; it stays in place for the frozen Expo shell, which will need RevenueCat if native is ever shipped through the App Store. Its removal from the active codebase is tracked as part of the Expo shell retirement in Decision 4.

---

### Decision 3: i18n library?

**Decision: next-intl. react-i18next stays in the frozen Expo shell only.**

next-intl is the correct choice for Next.js App Router for three reasons:

1. Locale lives in the URL (`/es/wins`), so pages are statically renderable and indexable without client-side JavaScript running first. react-i18next reads locale from a cookie or local state, which requires client-side hydration before the correct language renders.
2. `getTranslations` in server components returns translations before the component renders. react-i18next has no equivalent for React Server Components.
3. The eight JSON namespace files and their key structure are identical between react-i18next and next-intl. No translation file edits are required.

The migration cost is replacing `useTranslation("namespace")` with `useTranslations("namespace")` and `t("key")` with `t("key")`, which is a function call change with identical semantics.

While the Expo shell is frozen, translation files are maintained in both `src/i18n/locales/` and `web/i18n/locales/`. Both locations must be updated whenever a key is added, removed, or changed. This is a two-location edit; it is low enough friction to accept on a zero-budget timeline where one shell is frozen and rarely touched.

---

### Decision 4: Expo shell retired or maintained in parallel?

**Decision: Freeze now. Retire when web reaches full feature parity. The retirement date is not Week 4.**

The concrete plan:

**Now through Week 4 launch:** The Expo shell is frozen at its current state. No code changes, no dependency updates, no test runs. The `app/` directory exists but is treated as an archive.

**At web launch parity (Week 4):** Builder One documents the feature delta between the web app and the frozen Expo shell. "Parity" means: sign-up, pay gap intake and result, wins ledger with AI polish, settings, and Agent Ops Dashboard all work on the web app at the same level as they did in the Expo shell.

**After parity, before retiring:** The retirement decision is made jointly when native is being resourced. If native is resourced within six months of launch, the Expo shell is the starting point and it is not deleted. If native is not resourced, the Expo shell is archived (moved to a `native/` directory or a separate branch) and the Expo-specific packages are removed from the root `package.json`.

**Why not retire it immediately:** The Expo shell is the only place the React Native component implementations, the RevenueCat stub, and the `@clerk/clerk-expo` integration exist. Deleting it before native is resourced destroys implementation work that would have to be reproduced. The cost of keeping it is zero (it is not run or maintained). The cost of premature deletion is non-trivial.

**Why not maintain it in parallel:** Maintaining two shells actively on a zero budget and a two-builder team means both end up half finished. The web app is the product. The Expo shell is a reference implementation. Any feature that is built for the web does not get built again for Expo during Part One.

---

## Section 11: Web Foundation

This section is Builder One's detailed implementation specification. It is not shared context. Read Sections 1 through 10 first; this section assumes that material.

### 11.1 Repository layout

The web app lives at the repository root alongside the frozen Expo shell. Do not move or restructure existing directories. The new Next.js app files go into a new `web/` directory at the repo root. The existing `checkout/` directory is absorbed into `web/app/[locale]/checkout/` during Week 3.

```
web/
  app/
    layout.tsx                  Root layout: fonts, providers, viewport meta
    manifest.webmanifest        PWA manifest (served at /manifest.webmanifest)
    [locale]/
      layout.tsx                Locale layout: next-intl provider, AppNav shell
      page.tsx                  Home screen (unauthenticated landing)
      sign-in/
        [[...sign-in]]/
          page.tsx              Clerk-rendered sign-in page
      sign-up/
        [[...sign-up]]/
          page.tsx              Clerk-rendered sign-up page
      onboarding/
        paygap/
          page.tsx              Pay gap intake form
        result/
          page.tsx              Pay gap result screen
      wins/
        page.tsx                Wins Ledger
        new/
          page.tsx              Log win (redirects to Wins with sheet open on mobile)
        [id]/
          page.tsx              Edit win
      rehearsal/
        page.tsx                Rehearsal Room placeholder (Builder Two)
      case-files/
        page.tsx                Case Files placeholder (Builder Two)
      circle/
        page.tsx                Circle placeholder (Builder Two)
      settings/
        page.tsx                Profile and language settings
      checkout/
        page.tsx                Stripe subscription checkout (absorbed from checkout/)
    agent-ops/
      page.tsx                  Agent Ops Dashboard (founder-gated)
    og/
      paygap/
        route.tsx               Dynamic OG image via @vercel/og
    api/
      webhooks/
        clerk/
          route.ts              Clerk user.created / user.updated webhook handler
        stripe/
          route.ts              Stripe payment webhook handler
  components/
    layout/
      AppNav.tsx                One component, two render modes (bottom bar / left rail)
      LogWinButton.tsx          FAB below 768 px, inline button above
      Sheet.tsx                 Bottom sheet / centered dialog
      OfflineBanner.tsx         "Offline. Changes will sync when you reconnect."
    paygap/
      PayGapIntakeForm.tsx      Multi-field form with validation
      PayGapResult.tsx          Result screen with count-up animation
      PayGapShareCard.tsx       Share button + copy link fallback
      GapBar.tsx                Animated progress bar
    wins/
      WinsLedger.tsx            List with roving tabindex, sort by createdAt DESC
      WinCard.tsx               Single win card with stamp entry animation
      WinForm.tsx               Log/edit form used inside Sheet
      AIPolishSheet.tsx         Polish result view inside Sheet
      StreakCounter.tsx         Flame SVG + count with pulse animation
      GapClosedMeter.tsx        Progress bar: sum of estimatedValue vs gapAmount
    settings/
      SettingsPage.tsx
      LanguagePicker.tsx
      SubscriptionSection.tsx
      PrivacySection.tsx
    primitives/
      AIMark.tsx                Mirror of src/design-system/primitives/AIMark.tsx
      Button.tsx
      TextField.tsx
      Sheet.tsx
      Tag.tsx
  hooks/
    useViewportWidth.ts         Returns boolean: isDesktop (>= 768 px)
    useConvexUser.ts            Resolves Clerk identity to Convex user record
    useWins.ts                  Wraps api.wins.listWins with pagination state
    usePayGapProfile.ts         Returns the most recent payGapProfile for the user
    useStreakCount.ts           Computes consecutive-day streak from wins
    useGapClosedAmount.ts       Sums estimatedValue across wins, caps at gapAmount
    usePWAInstallPrompt.ts      Captures and defers beforeinstallprompt
  lib/
    convex.ts                   ConvexReactClient singleton
    currency.ts                 Port of src/lib/currency.ts
  i18n/
    routing.ts                  next-intl locale config (locales, defaultLocale)
    request.ts                  getRequestConfig for next-intl
    locales/                    Symlink or copy of src/i18n/locales/
  public/
    stamp.wav                   Win stamp sound (16-bit, under 50 KB)
    icons/                      PWA icons: 192x192 and 512x512 PNG
```

### 11.2 Dependencies to install

Install into `web/package.json`. Do not add these to the root `package.json` (which belongs to the Expo shell).

```
next@15
react@19
react-dom@19
convex
@clerk/nextjs
next-intl
tailwindcss@4
motion
@vercel/og
```

No additional UI component library. Build from the design system primitives in `web/components/primitives/`.

### 11.3 Environment variables

The following must be set in Vercel and in `web/.env.local` for local development. The file `.env.local` at the repo root is for the Expo shell; do not modify it.

```
NEXT_PUBLIC_CONVEX_URL              From Convex dashboard (same deployment as Expo shell)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET                Svix signing secret for the Clerk webhook
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID_PRO_MONTHLY         Stripe Price ID for the $9/month plan
```

`GEMINI_API_KEY` is read only by Convex actions, never by the Next.js server. Do not forward it to the web app.

### 11.4 Convex provider for web

The Expo shell uses `ConvexProviderWithClerk` from `@convex-dev/auth/react`. The web app uses the Clerk integration from `"convex/react-clerk"`:

```tsx
// web/app/layout.tsx
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

`ConvexProviderWithClerk` from `"convex/react-clerk"` handles token forwarding automatically. Do not use plain `ConvexProvider`; it does not send auth tokens.

### 11.5 Tailwind v4 token mapping

`web/tailwind.config.ts` maps every token from `src/design-system/tokens/colors.ts` and `src/design-system/tokens/spacing.ts` to CSS custom properties.

```ts
// web/tailwind.config.ts (abbreviated)
export default {
  theme: {
    extend: {
      colors: {
        ink:              "var(--color-ink)",
        "ink-soft":       "var(--color-ink-soft)",
        "ink-muted":      "var(--color-ink-muted)",
        canvas:           "var(--color-canvas)",
        surface:          "var(--color-surface)",
        "surface-subtle": "var(--color-surface-subtle)",
        accent:           "var(--color-accent)",
        "accent-light":   "var(--color-accent-light)",
        "ai-mark":        "var(--color-ai-mark)",
        "ai-mark-light":  "var(--color-ai-mark-light)",
        success:          "var(--color-success)",
        error:            "var(--color-error)",
        border:           "var(--color-border)",
      },
      spacing: {
        "1": "4px",  "2": "8px",  "3": "12px", "4": "16px",
        "5": "20px", "6": "24px", "8": "32px",  "10": "40px",
        "12": "48px", "16": "64px",
      },
      borderRadius: {
        sm: "8px",
        lg: "16px",
      },
      transitionTimingFunction: {
        standard:   "cubic-bezier(0.4, 0.0, 0.2, 1)",
        decelerate: "cubic-bezier(0.0, 0.0, 0.2, 1)",
        accelerate: "cubic-bezier(0.4, 0.0, 1.0, 1)",
      },
    },
  },
}
```

CSS custom properties are declared in `web/app/globals.css` using the light palette values from `src/design-system/tokens/colors.ts`.

### 11.6 Clerk webhook handler

`web/app/api/webhooks/clerk/route.ts` handles `user.created` and `user.updated` events. It calls a Convex mutation (write `convex/users.ts`: `upsertFromClerk`) via `ConvexHttpClient` from `"convex/browser"` to create or update the `users` table record.

The `isFounder` field is set server-side only: check the Clerk user's primary email address against an allow-list stored in an environment variable (`FOUNDER_EMAILS`, comma-separated). Never derive `isFounder` from a client request.

Skeleton:

```ts
import { Webhook } from "svix";
import { headers } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function POST(req: Request) {
  const body = await req.text();
  const h = await headers();
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let event: unknown;
  try {
    event = wh.verify(body, {
      "svix-id":        h.get("svix-id") ?? "",
      "svix-timestamp": h.get("svix-timestamp") ?? "",
      "svix-signature": h.get("svix-signature") ?? "",
    });
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  // Type-narrow event.type, call convex.mutation(api.users.upsertFromClerk, {...})
  return new Response("OK", { status: 200 });
}
```

### 11.7 Middleware

`web/middleware.ts` handles two concerns:

1. **Locale routing** via next-intl's `createMiddleware`. All user-facing routes are prefixed with `/[locale]`. A bare `/` request redirects to `/en/`.
2. **Founder gate** for `/agent-ops`. If the request path starts with `/agent-ops`, check the Clerk session. If the user is not authenticated or does not have `isFounder: true` on their Convex record, return a 404 response. The response must be a 404, not a 401 or 403.

Compose Clerk middleware with next-intl middleware. The `matcher` config excludes `/_next/`, `/og/`, and `/api/webhooks/` from the locale-routing pass but not from the founder check.

---

## Section 12: Onboarding Flow

### 12.1 Route sequence

A new user follows this path:

```
/en/ -> /en/sign-up -> (Clerk email verification) -> /en/onboarding/paygap -> /en/onboarding/result -> /en/wins
```

After the result screen the user taps "Start logging wins" to reach `/[locale]/wins`, or taps "Build my negotiation plan" which calls `api.payGap.createScenarioFromPayGap` then navigates to `/[locale]/rehearsal`.

A returning user with a Convex `users` record and at least one `payGapProfile` is redirected from `/[locale]/` directly to `/[locale]/wins`. Implement this in the home page server component: call `auth()` from `@clerk/nextjs/server`, and if authenticated, redirect.

### 12.2 Home page (`/[locale]/page.tsx`)

Server component. No Convex connection required. Renders without a session.

Content (no feature grid, no testimonial carousel, no pricing table):
- RaiseHER wordmark as text, not an image
- One-line statement: "Your pay gap has a number. Find it."
- Two sentences of sub-copy: "RaiseHER analyzes your role, industry, and location against public labor-market data. Know what you are worth and how to ask for it."
- Primary CTA button: "See your pay gap" navigating to `/[locale]/sign-up`
- Secondary link: "Sign in" navigating to `/[locale]/sign-in`
- Disclosure footer: "AI-generated analysis based on aggregated public labor-market statistics. Not legal or financial advice."

SEO head tags via `generateMetadata`:
- `title`: "RaiseHER: Know your pay gap"
- `description`: "Find out if you are underpaid, log your wins, and practice the conversation."
- `og:title`: "RaiseHER: Know your pay gap"
- `og:image`: static OG image at `/og/home.png` (wordmark on cream background)
- `canonical`: `https://raiseher.app/[locale]/`

### 12.3 Sign-up and sign-in pages

Render Clerk's `<SignUp />` and `<SignIn />` components. Set `afterSignUpUrl` to `/[locale]/onboarding/paygap` and `afterSignInUrl` to `/[locale]/wins`. Apply Clerk's appearance API with design system tokens:

```ts
appearance={{
  variables: {
    colorPrimary:    "#D97706",
    colorBackground: "#F5F0EB",
    colorText:       "#1A1A1A",
    borderRadius:    "16px",
    fontFamily:      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  elements: {
    card: { boxShadow: "none", border: "1px solid #D4CDC5" },
    formButtonPrimary: { borderRadius: "16px" },
  },
}}
```

Do not build custom sign-up or sign-in forms. Clerk renders them.

### 12.4 Pay gap intake form (`/[locale]/onboarding/paygap/page.tsx`)

Client component. Protected (redirect to sign-in if no session).

Six fields, all required:

| Field | Label key | Input type | Validation |
|-------|-----------|-----------|-----------|
| `industry` | `onboarding.paygap_industry` | text | Non-empty |
| `role` | `onboarding.paygap_role` | text | Non-empty |
| `yearsExperience` | `onboarding.paygap_years` | number | Integer >= 0 |
| `location` | `onboarding.paygap_location` | text | Non-empty |
| `currentSalary` | `onboarding.paygap_salary` | number | Positive number |
| `currency` | `onboarding.paygap_currency` | select | USD, EUR, GBP, CAD, AUD, MXN, BRL |

On submit:
1. Validate all fields client-side. Show inline errors on invalid fields using the error shake animation (Section 8.6).
2. Store the form values in `sessionStorage` under the key `paygap_intake` as JSON. This enables the result screen to retry without re-entering data.
3. Call `useMutation(api.payGap.requestPayGapAnalysis)` with `targetLanguage` set to the current locale.
4. Navigate to `/[locale]/onboarding/result` immediately after the mutation returns `{ queued: true }`.

Form layout: single column, full-width inputs, 24 px vertical gap between fields, 48 px between the last field and the submit button. Submit button is `<Button variant="primary">` full-width.

No "back" button. Users who want to recalculate use Settings after onboarding completes.

### 12.5 Result screen (`/[locale]/onboarding/result/page.tsx`)

Client component. Protected. Polls `useQuery(api.payGap.getPayGapProfiles, { limit: 1 })`. While the result list is empty or the most recent profile lacks a `gapAmount`, the loading state renders.

**Loading state:**

- Centered on the page: `paygap.loading_analysis` in body text
- Below it: `paygap.loading_detail` in `inkMuted` at caption size
- No spinner, no skeleton
- 30-second timeout: "Pay gap generation is taking longer than expected." with a retry button. On retry, read the intake data from `sessionStorage` and call `api.payGap.requestPayGapAnalysis` again.

**Result state:**

Centered single column, max-width 480 px:

1. `paygap.gap_label` in `inkMuted`, caption size
2. `gapAmount` formatted as currency, `display` type (32 px bold), centered, sized to minimum 8 ch before animation
3. `paygap.estimate_framing` in `inkMuted`, caption size
4. `<GapBar>` showing `gapAmount / benchmarkSalary` as a percentage
5. `paygap.benchmark_label`: `benchmarkSalary` formatted as currency
6. `paygap.current_salary_label`: `currentSalary` formatted as currency
7. `paygap.gap_pct_label`: `gapPercentage` formatted as a signed percentage (e.g. "+18.4%")
8. `paygap.ai_analysis_label` with inline `<AIMark>`, then `aiAnalysis` text in body size. Render in a scrollable container with max-height 240 px and a bottom fade-out gradient.
9. `paygap.disclosure` in `inkMuted`, caption size
10. Social proof: "RaiseHER users have closed $[totalGapClosedUsd] in pay gaps." Read from `api.dashboard.getPlatformStats`.
11. Two buttons stacked: "Start logging wins" and "Build my negotiation plan"
12. `<PayGapShareCard>` share button

Animation timing: Section 8.9, feedback moment 1. Implement exactly as specified. The `aria-live="polite"` region announces the final gap amount immediately on mount; it does not announce intermediate count-up values.

---

## Section 13: Pay Gap Reality Check

### 13.1 What "reality check" means in this context

The pay gap result is a factual readout of a specific number derived from a specific analysis. Every element of copy, layout, and animation exists to make that number feel real, credible, and actionable. "Reality check" is the internal name for this feature set; it does not appear in any UI copy.

### 13.2 GapBar component

`web/components/paygap/GapBar.tsx`

Props:
- `fillPercent: number` -- `(gapAmount / benchmarkSalary) * 100`, clamped 0 to 100
- `animated: boolean` -- false when `prefers-reduced-motion: reduce` is active

Structure:
- Outer container: `height: 8px`, `border-radius: 4px` (pill, geometric choice, not from the radius scale), `background: var(--color-surface-subtle)`
- Inner fill: `height: 100%`, `border-radius: 4px`, `background: var(--color-accent)`
- Motion: `width` transitions from `0%` to `fillPercent%` over 800 ms with `ease-decelerate`, inside `@media (prefers-reduced-motion: no-preference)` only
- Base style (no-motion): `width: fillPercent%` immediately, no transition

Screen reader: `role="img"`, `aria-label="Your pay gap is X% of the benchmark salary"`.

### 13.3 Share card and OG image

**Client-side share flow (`<PayGapShareCard>`):**

Construct the share URL: `https://raiseher.app/og/paygap?gap=AMOUNT&currency=CURRENCY&role=ROLE_SLUG&locale=LOCALE`

- `ROLE_SLUG`: user's role URL-encoded and truncated to 60 characters
- No name, email, or Clerk ID in the URL

On button tap:
1. Try `navigator.share({ url, title: "I found my pay gap" })`. If it resolves, done.
2. Otherwise: copy the URL to clipboard. Change button label to "Link copied" for 2 seconds, then revert.

**Server-side OG image (`web/app/og/paygap/route.tsx`):**

Uses `@vercel/og`. Accepts `gap`, `currency`, `role`, `locale` query params. Layout (1200 x 630 px):
- Background: `#F5F0EB`
- Centered: gap amount, 72 px bold, `#1A1A1A`
- Below: "Pay gap for [role]", 32 px, `#888888`
- Bottom-left: RaiseHER wordmark, 24 px, `#D97706`
- Bottom-right: "raiseher.app", 20 px, `#888888`
- No user photo, no name, no email

No authentication required to render the image.

### 13.4 PWA install prompt

`web/hooks/usePWAInstallPrompt.ts` captures `beforeinstallprompt` on `window` and stores it in state, returning `{ prompt, triggerPrompt }`.

On the result screen, after the full animation sequence completes (2 000 ms mark from Section 8.9), call `triggerPrompt()` if `prompt` is non-null. Do not show the prompt before that mark. Use the browser's native install dialog; no custom UI.

### 13.5 PWA manifest

`web/app/manifest.webmanifest`:

```json
{
  "name": "RaiseHER",
  "short_name": "RaiseHER",
  "description": "Know your pay gap. Log your wins. Practice the conversation.",
  "start_url": "/en/wins",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#D97706",
  "background_color": "#F5F0EB",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

Link in the root layout: `<link rel="manifest" href="/manifest.webmanifest" />`.

---

## Section 14: Wins Ledger

### 14.1 Page structure (`/[locale]/wins/page.tsx`)

Client component. Protected. Mounts in two layout modes per Section 8.7.

Header area:
- Page title: `wins.title` in `heading1`
- `<StreakCounter>` inline with title, right-aligned
- `<GapClosedMeter>` below the title row, full-width. Hidden until both conditions from Section 8.9 item 4 are true.
- Desktop only: `<LogWinButton>` as a full-width `<Button variant="primary">` below the meter

List area:
- `<WinsLedger>` renders the win cards
- `<WinsEmptyState>` when `wins.length === 0`

Keyboard shortcuts (via `useEffect` on `keydown`):
- `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux): open the log-win Sheet from anywhere on this page, unless the active element is a text input, textarea, or contenteditable
- `ArrowUp` / `ArrowDown` or `j` / `k`: move focus through win cards

### 14.2 WinsLedger component

`web/components/wins/WinsLedger.tsx`

Props:
- `wins: Doc<"wins">[]` -- sorted by `createdAt DESC`
- `onEdit: (winId: Id<"wins">) => void`
- `onDelete: (winId: Id<"wins">) => void`

Renders `<ul role="list">`. Each `<WinCard>` is `<li role="listitem">`.

Roving tabindex: the focused card has `tabIndex={0}`; all others have `tabIndex={-1}`. Arrow keys move focus. `Enter` or `Space` on a focused card opens the edit Sheet.

When a new win is added (detected by comparing the incoming wins array to the previous render via `useRef`), the first card receives the stamp entry animation (Section 8.9, item 2). Toggle a CSS class on the element; remove it via an `animationend` listener.

### 14.3 WinCard component

`web/components/wins/WinCard.tsx`

Displays:
- `description` in body text
- `tags` as `<Tag>` chips
- `date` formatted per the active locale via `Intl.DateTimeFormat`
- `estimatedValue` and `currency` in label size, `inkSoft`
- `impact` in body size, `inkSoft`
- Edit icon button and delete icon button (minimum 44 x 44 px tap target via padding)

Card surface: `background: var(--color-surface)`, `border: 1px solid var(--color-border)`, `border-radius: lg`, `padding: 16px`.

On hover (pointer devices): `border-color` transitions to `var(--color-border-strong)` over 150 ms.
On focus (keyboard): `outline: 2px solid var(--color-accent); outline-offset: 2px`.

### 14.4 WinForm component

`web/components/wins/WinForm.tsx`

Used for both log and edit. Receives initial values for edit mode; empty for log mode.

Fields:
- `description` (required): textarea, min-height 80 px, label `wins.win_description_label`
- `impact` (optional): textarea, min-height 56 px, label `wins.win_impact_label`
- `date` (required): date input, defaults to today, label `wins.win_date_label`
- `estimatedValue` (optional): number input, label `wins.win_value_label`
- `currency` (optional, required if estimatedValue is present): select with USD, EUR, GBP, CAD, AUD, MXN, BRL
- `tags`: type and press Enter or click `wins.win_tags_add` to add. Pre-populated suggestions from the ten `wins.tag_*` keys.

Below the fields: `<Button variant="secondary">` labeled `wins.ai_polish_btn` with `<AIMark>` to its left.

Submit button: `<Button variant="primary">` full-width, labeled `wins.save`.

### 14.5 AI Polish flow

When the user taps "Polish with AI" in `<WinForm>`:

1. The Sheet shows a loading state (centered `wins.ai_polish_loading` text, no spinner).
2. Call the AI polish action (the existing `api.winsAction.polishWin` or equivalent).
3. On success: show the polish result view with `<AIMark>` badge, original description (`wins.ai_polish_original_label`), polished description (`wins.ai_polish_polished_label`), suggested impact, and suggested tags.
4. Two buttons: `wins.ai_polish_use_this` replaces form fields and returns to form view; `wins.ai_polish_keep_mine` returns to form view without changes.
5. On error: `wins.ai_polish_error` in `error` color with a retry button.
6. On limit exceeded (Convex action throws with code `"POLISH_LIMIT_EXCEEDED"`): show the upgrade CTA Sheet instead of the error message.

The monthly limit (5 uses free, unlimited on Pro) is enforced server-side in the Convex action. The client only reads the error code.

### 14.6 StreakCounter component

`web/components/wins/StreakCounter.tsx`

`useStreakCount` hook: takes the sorted wins list and counts consecutive calendar days (user's local timezone) ending today or yesterday.

Renders:
- An SVG flame icon (24 x 24 px path in `var(--color-accent)`, or `var(--color-border)` when streak is 0)
- The streak count in `heading2` (20 px, 600 weight)

On streak increase: the count number runs the scale pulse animation from Section 8.6, triggered by toggling a CSS class when the value changes (detected via `useEffect` comparing previous and current count).

On zero streak: render with gray flame, count "0". No animation, no penalty message.

### 14.7 GapClosedMeter component

`web/components/wins/GapClosedMeter.tsx`

Visibility: render only when the user has a `payGapProfile` AND at least one win with a non-null `estimatedValue`.

Props (derived from hooks in the parent page):
- `gapAmount: number`
- `currency: string`
- `closedAmount: number` -- sum of `estimatedValue` across all wins, capped at `gapAmount`

Layout:
- Label row: "$[closedAmount] closed" left-aligned in label type; "of $[gapAmount]" right-aligned in `inkMuted` caption. Both labels update immediately with no animation.
- Progress bar: same structure as `<GapBar>`, fill color `var(--color-success)`.
- On new win with `estimatedValue`: bar width transitions to the new fill percentage over 600 ms with `ease-decelerate`.

### 14.8 Log win route (`/[locale]/wins/new/page.tsx`)

On both mobile and desktop: redirect to `/[locale]/wins?new=1`. The wins page detects this param on mount and opens the log-win Sheet. After the Sheet closes, call `router.replace("/[locale]/wins")` to remove the query param without a new history entry.

### 14.9 Edit win route (`/[locale]/wins/[id]/page.tsx`)

On both mobile and desktop: redirect to `/[locale]/wins?edit=[id]`. If the win does not belong to the authenticated user (`api.wins.getWin` returns null), redirect to `/[locale]/wins` silently.

---

## Section 15: Localization

### 15.1 next-intl setup

`web/i18n/routing.ts`:

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es", "fr", "pt"],
  defaultLocale: "en",
  localePrefix: "always",
});
```

`web/i18n/request.ts`:

```ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? routing.defaultLocale;
  return {
    locale,
    messages: {
      common:     (await import(`./locales/${locale}/common.json`)).default,
      onboarding: (await import(`./locales/${locale}/onboarding.json`)).default,
      paygap:     (await import(`./locales/${locale}/paygap.json`)).default,
      wins:       (await import(`./locales/${locale}/wins.json`)).default,
      settings:   (await import(`./locales/${locale}/settings.json`)).default,
      rehearsal:  (await import(`./locales/${locale}/rehearsal.json`)).default,
      casefiles:  (await import(`./locales/${locale}/casefiles.json`)).default,
      circle:     (await import(`./locales/${locale}/circle.json`)).default,
    },
  };
});
```

The locale JSON files in `web/i18n/locales/` are copies of `src/i18n/locales/`. Keep them in sync manually until the Expo shell is retired. When editing any translation key, update both locations.

### 15.2 Middleware

`web/middleware.ts` composes Clerk middleware with next-intl middleware:

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const handleI18n = createMiddleware(routing);

const isProtected = createRouteMatcher([
  "/:locale/wins(.*)",
  "/:locale/onboarding(.*)",
  "/:locale/settings(.*)",
  "/:locale/rehearsal(.*)",
  "/:locale/case-files(.*)",
  "/:locale/circle(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect();
  return handleI18n(req);
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|webmanifest)).*)"],
};
```

Protected routes redirect to `/[locale]/sign-in` on unauthenticated access.

### 15.3 Using translations in components

Server components use `getTranslations` from `"next-intl/server"`:

```ts
const t = await getTranslations("wins");
return <h1>{t("title")}</h1>;
```

Client components use `useTranslations` from `"next-intl"`:

```ts
"use client";
import { useTranslations } from "next-intl";
const t = useTranslations("wins");
return <button>{t("ai_polish_btn")}</button>;
```

Never pass raw translation strings as component props from server to client to avoid adding `"use client"`. If a component needs translations and must be a client component, import `useTranslations` directly in that component.

### 15.4 Language change flow

When the user changes language in Settings:

1. Call `useMutation(api.users.updatePreferredLanguage)` with the new locale string.
2. Navigate to the same page under the new locale via `router.push("/" + newLocale + currentPath)`.
3. next-intl reads the new locale from the URL and re-renders with new message files.
4. The Convex mutation runs in the background; its success or failure does not block navigation.

The language change is immediate. No page reload required.

### 15.5 Locale-aware formatting

Use the `Intl` API for all currency and date formatting. Do not import a date library.

Currency: `new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount)`.

Date: `new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(unixMs))`.

Read `locale` from `useLocale()` from `"next-intl"` in client components.

### 15.6 Missing key behavior

next-intl logs a console warning for missing keys in development and falls back to the key string in production. This prevents a UI crash. Do not silence the development warning.

---

## Section 16: Profile and Settings

### 16.1 Page structure (`/[locale]/settings/page.tsx`)

Client component (reads Convex user via `useQuery(api.users.getCurrentUser)`). Protected.

Page title: `settings.title` in `heading1`.

Five sections separated by a 1 px `border-bottom: var(--color-border)` above each section heading:

1. Account
2. Pay Gap
3. Language
4. Subscription
5. Privacy and Data

Each section uses a list of row items: label left in body size, value or action right in label size `inkSoft`, full-width tap target minimum 44 px tall.

### 16.2 Account section

Rows:
- Email: label `settings.account_email`, value = user's email from `useUser()` from `@clerk/nextjs`
- Change Password: label `settings.account_change_password`, right chevron, opens Clerk's password reset flow
- Sign Out: label `settings.account_sign_out` in `error` color, opens confirmation Sheet. On confirm: call Clerk's `signOut()` then navigate to `/en/`.
- Delete Account: label `settings.account_delete` in `error` color, opens confirmation Sheet (`settings.account_delete_confirm_title`, `settings.account_delete_confirm_body`, confirm button `settings.account_delete_confirm_action` in error color). On confirm: call `useMutation(api.users.deleteUserData)`, then call Clerk's `user.delete()`, then navigate to `/en/`.

### 16.3 Pay Gap section

Placed between Account and Language.

If the user has a `payGapProfile` (read via `useQuery(api.payGap.getPayGapProfiles, { limit: 1 })`):
- One row showing the most recent result: role and `gapAmount` formatted as currency, date in caption size
- One row labeled `settings.pay_gap_rerun` with right chevron, navigates to `/[locale]/onboarding/paygap`

If no profile:
- A row labeled `settings.pay_gap_none` in `inkMuted`
- A full-width `<Button variant="primary">` labeled "Calculate my pay gap" navigating to `/[locale]/onboarding/paygap`

### 16.4 Language section

One row per locale:
- English -- `settings.language_en`
- Espanol -- `settings.language_es`
- Francais -- `settings.language_fr`
- Portugues -- `settings.language_pt`

Each row shows a checkmark on the right when it is the active locale. On tap: run the language change flow from Section 15.4.

### 16.5 Subscription section

Reads subscription status via `useQuery(api.users.getSubscriptionStatus)`.

Add the following query to `convex/users.ts`:

```ts
export const getSubscriptionStatus = query({
  args: {},
  handler: async (ctx): Promise<"free" | "pro"> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return "free";
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return "free";
    const cutoff = Date.now() - 35 * 24 * 60 * 60 * 1000;
    const recentPayment = await ctx.db
      .query("revenueEntries")
      .withIndex("by_recorded_at", (q) => q.gte("recordedAt", cutoff))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();
    return recentPayment ? "pro" : "free";
  },
});
```

Settings section rows:

- Current Plan: label `settings.subscription_status`, value "Free" or "RaiseHER Pro"
- If Free: full-width `<Button variant="primary">` labeled `settings.upgrade` navigating to `/[locale]/checkout`
- If Pro: label `settings.manage_subscription`, right chevron, navigates to Stripe Customer Portal URL retrieved via a Convex action

Version footer at the bottom of the page: `settings.app_version` label with the git SHA from `process.env.NEXT_PUBLIC_APP_VERSION`. Below it: `settings.google_gemini_disclosure` in `inkMuted`, caption size.

### 16.6 Privacy and Data section

Rows:
- Privacy Policy: label `settings.privacy_policy`, right chevron, links to `/en/privacy`
- Terms of Service: label `settings.terms`, right chevron, links to `/en/terms`
- How We Use Your Data: label `settings.data_usage`, right chevron, links to `/en/privacy#data-usage`
- Request Data Deletion: label `settings.data_delete_request` in `error` color, opens confirmation Sheet. On confirm: call `api.users.deleteUserData`, sign out via Clerk, navigate to `/en/`.

---

## Appendix C: Common Error States

Every error state follows the pattern from Section 7.5: say what happened, say what the user can do, never blame the user.

| Location | Trigger | Primary text | Secondary text or action |
|----------|---------|--------------|--------------------------|
| Pay gap intake | Form submit fails (network) | "Could not submit your information." | "Check your connection and try again." with retry button |
| Pay gap result | Generation timeout (30 s) | "Pay gap generation is taking longer than expected." | Retry button re-submits intake data from sessionStorage |
| Pay gap result | Hard error (Gemini quota) | "Could not complete the analysis right now." | "Try again later." with button to return to onboarding |
| Wins list | Convex query fails | "Could not load your wins." | "Tap to try again." tapping calls refetch |
| Win save | Mutation fails | "Could not save your win." | "Tap to try again." inline below the submit button |
| Win delete | Mutation fails | "Could not delete this win." | Dismiss the Sheet; win remains |
| AI polish | Action fails | `wins.ai_polish_error` | Retry button in the polish Sheet |
| AI polish | Limit exceeded | "You have used your 5 free polishes this month." | Upgrade CTA: "Upgrade to keep going." navigating to /[locale]/checkout |
| Settings | deleteUserData fails | "Could not delete your data." | "Contact support@raiseher.app" |
| Language change | updatePreferredLanguage fails | No visible error | Log to console; navigation proceeds regardless |
| Offline | Convex disconnects | `<OfflineBanner>`: "Offline. Changes will sync when you reconnect." | Shown at top of content area; disappears on reconnect |

The `<OfflineBanner>` renders in the locale layout and reads Convex's connection state. No manual dismiss required.

---

## Appendix D: Component Checklist for Builder One

Every component below must be complete before Week 4 launch. Complete means: renders correctly in both layout modes, passes Lighthouse Accessibility 100 on its pages, respects `prefers-reduced-motion`, and has no hard-coded color, spacing, or radius values outside the design system tokens.

| Component | File | Section |
|-----------|------|---------|
| `AppNav` | `web/components/layout/AppNav.tsx` | 5.2, 8.7 |
| `LogWinButton` | `web/components/layout/LogWinButton.tsx` | 5.2, 8.7 |
| `Sheet` | `web/components/layout/Sheet.tsx` | 5.3, 8.7 |
| `OfflineBanner` | `web/components/layout/OfflineBanner.tsx` | Appendix C |
| `PayGapIntakeForm` | `web/components/paygap/PayGapIntakeForm.tsx` | 12.4 |
| `PayGapResult` | `web/components/paygap/PayGapResult.tsx` | 12.5, 8.9 |
| `GapBar` | `web/components/paygap/GapBar.tsx` | 13.2 |
| `PayGapShareCard` | `web/components/paygap/PayGapShareCard.tsx` | 13.3 |
| `WinsLedger` | `web/components/wins/WinsLedger.tsx` | 14.2 |
| `WinCard` | `web/components/wins/WinCard.tsx` | 14.3 |
| `WinForm` | `web/components/wins/WinForm.tsx` | 14.4 |
| `AIPolishSheet` | `web/components/wins/AIPolishSheet.tsx` | 14.5 |
| `StreakCounter` | `web/components/wins/StreakCounter.tsx` | 14.6 |
| `GapClosedMeter` | `web/components/wins/GapClosedMeter.tsx` | 14.7 |
| `SettingsPage` | `web/components/settings/SettingsPage.tsx` | 16.1 |
| `LanguagePicker` | `web/components/settings/LanguagePicker.tsx` | 16.4 |
| `SubscriptionSection` | `web/components/settings/SubscriptionSection.tsx` | 16.5 |
| `PrivacySection` | `web/components/settings/PrivacySection.tsx` | 16.6 |
| `AIMark` | `web/components/primitives/AIMark.tsx` | 8.5 |
| `Button` | `web/components/primitives/Button.tsx` | 8.3, 8.4 |
| `TextField` | `web/components/primitives/TextField.tsx` | 8.3 |
| `Tag` | `web/components/primitives/Tag.tsx` | 8.4 |
