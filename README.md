<div align="center">

<img src="assets/icon.png" alt="RaiseHER" width="96" height="96" />

# RaiseHER

**Know your worth. Raise your pay.**

RaiseHER gives you the data, the practice, and the paper trail to negotiate the salary you have already earned.

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Convex](https://img.shields.io/badge/Convex-backend-EE342F)](https://convex.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Request Beta Access](YOUR_BETA_LINK_HERE) · [Join the Waitlist](YOUR_WAITLIST_LINK_HERE) · Live Site: Coming Soon

</div>

---

## What is RaiseHER

RaiseHER is a salary negotiation and pay equity platform for women. It turns a vague suspicion that you are underpaid into a specific number, then helps you build the case to close it: log the wins that prove your value, rehearse the conversation with an AI negotiation partner, and walk into the room with a one-page brief instead of a feeling.

## Why we built this

Most pay-gap tools stop at the statistic. Knowing that women earn less on average does not tell you what *you* should be asking for on Tuesday morning, and it does not make the ask any easier to say out loud. RaiseHER exists to close that distance. Every feature either quantifies a gap or builds a skill — nothing is decorative.

## Features

| Feature | What it does |
| --- | --- |
| **Pay Gap Analysis** | Enter your role, industry, and salary. RaiseHER benchmarks you against public labor-market data and shows exactly how much you are leaving on the table. |
| **Wins Ledger** | Every win you log becomes evidence. Track accomplishments, quantify impact, and let AI polish the language so your work speaks for itself. |
| **Rehearsal Room** | Rehearse your negotiation with an AI partner trained on real scenarios, in voice or text, and get a scorecard afterward. |
| **Case Files** | Your wins, your pay gap figure, and your strongest rehearsed lines compiled into a one-page brief you can bring to the room. |
| **Circle** | Anonymized salary outcomes from women who used RaiseHER. The total grows every time someone reports back. |

RaiseHER is free to start. A single paid tier unlocks the Rehearsal Room and advanced case-file exports.

## Tech stack

- **[Next.js 15](https://nextjs.org)** (App Router, React 19, TypeScript)
- **[Convex](https://convex.dev)** — database, server functions, scheduled jobs, and webhooks
- **[Clerk](https://clerk.com)** — authentication and user management
- **[Google Gemini](https://ai.google.dev)** — AI analysis, win polishing, and rehearsal partner (server-side only)
- **[Stripe](https://stripe.com)** — subscription checkout and billing
- **[Tailwind CSS 4](https://tailwindcss.com)** — styling, on top of a token-based design system
- **[next-intl](https://next-intl.dev)** — localized routing and translations
- **[Playwright](https://playwright.dev)** + **[axe-core](https://github.com/dequelabs/axe-core)** — end-to-end, accessibility, and contrast testing

## Getting started

### Prerequisites

- Node.js 22 (see [`.nvmrc`](.nvmrc); anything `>=20.12.0` works)
- npm
- Accounts for [Convex](https://convex.dev), [Clerk](https://clerk.com), and [Google AI Studio](https://aistudio.google.com/app/apikey). Stripe is only needed if you are working on checkout.

### Local development

```bash
git clone https://github.com/YOUR_ORG_HERE/RaiseHER.git
cd RaiseHER
npm install

# Copy the template and fill in your own values
cp .env.example .env.local

# Start Convex (writes your deployment URL into .env.local)
npx convex dev
```

In a second terminal, start the web app:

```bash
npm run dev:http     # http://localhost:3000
```

`npm run dev` runs the same server over HTTPS, which some Clerk and Stripe flows need locally. It expects `localhost-key.pem` and `localhost.pem` in the project root — generate them with [mkcert](https://github.com/FiloSottile/mkcert):

```bash
mkcert -install
mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost 127.0.0.1
```

### Useful scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js dev server over HTTPS |
| `npm run dev:http` | Next.js dev server over HTTP |
| `npm run build` | Production build |
| `npm run lint` | ESLint, including the JSX a11y rules |
| `npm run convex` | Convex dev server (watches `convex/`) |
| `npm run convex:deploy` | Deploy Convex functions |
| `npm run test:e2e` | Full Playwright suite |
| `npm run test:a11y` | Accessibility, VoiceOver, and contrast specs |
| `npm run verify:tokens` | Check design-token color contrast ratios |

More detail on the test suite lives in [`tests/README.md`](tests/README.md).

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local` and fill in real values. Never commit `.env.local`.

**Next.js app (`.env.local`)**

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL (written automatically by `npx convex dev`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_APP_URL` | Canonical site URL, used for metadata, sitemap, and Stripe redirects |
| `STRIPE_SECRET_KEY` | Stripe secret key (checkout only) |
| `STRIPE_SEASON_PASS_PRICE_ID` | Stripe price ID for the individual plan |
| `STRIPE_TEAMS_PILOT_PRICE_ID` | Stripe price ID for the teams plan |

**Convex deployment (set with `npx convex env set`)**

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Google Gemini key. Server-side only — never expose it to the client. |
| `CLERK_WEBHOOK_SECRET` | Verifies Clerk user webhooks |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe subscription webhooks |

## Internationalization

RaiseHER ships in four languages: **English**, **Spanish**, **French**, and **Portuguese (Brazil)**. Every user-facing route is prefixed with its locale (`/en/wins`, `/es/wins`), so pages stay statically indexable and locale resolution never depends on client-side detection.

Locale detection falls back in this order: URL prefix → `RAISEHER_LOCALE` cookie → `Accept-Language` header → English. Translations live in [`messages/`](messages) and [`src/i18n/locales/`](src/i18n/locales); the locale list is defined once in [`src/i18n/routing.ts`](src/i18n/routing.ts). The layout threads text direction through from config, so adding an RTL language later is a config change rather than a refactor.

## Privacy commitments

- Your pay data is never readable by other users.
- Your data is never used to train AI models.
- No ads. No data sales.
- Platform statistics are aggregated server-side; raw individual values are never exposed through aggregate endpoints.
- You can delete your data from Settings.

The full policy is a plain-English page at `/en/privacy`.

## Contributing

Issues and pull requests are welcome. A few things that make review easier:

- Run `npm run lint` and `npm run test:e2e` before opening a PR.
- Accessibility is a requirement, not a nice-to-have. New UI should pass `npm run test:a11y`.
- User-facing strings belong in the translation files, not inline in components.

## License

[MIT](LICENSE)
