#!/usr/bin/env node
/**
 * WCAG 2.1 contrast-ratio verification for all RaiseHER design tokens.
 *
 * Run:  npm run verify:tokens
 *       node scripts/verify-contrast.mjs
 *
 * Thresholds:
 *   4.5:1  normal text (< 18 pt / < 24 px, not bold)
 *   3.0:1  large text (≥ 18 pt / ≥ 24 px, or ≥ 14 pt bold) and non-text UI
 *
 * Exits with code 1 if any "must pass" pair fails so this can gate CI.
 */

// ─── Color tokens (keep in sync with app/globals.css @theme) ─────────────────

const TOKENS = {
  ink: '#1a1a1a',
  inkSoft: '#444444',
  inkMuted: '#888888',
  inkInverse: '#ffffff',
  canvas: '#f5f0eb',
  surface: '#ffffff',
  surfaceSubtle: '#ede8e2',
  accent: '#d97706',
  accentLight: '#fef3c7',
  accentDeep: '#8f4e05',
  onAccent: '#1a1a1a',
  success: '#166534',
  successLight: '#dcfce7',
  error: '#b91c1c',
  errorLight: '#fee2e2',
  border: '#d4cdc5',
  borderStrong: '#887f78',
  aiMark: '#0369a1',
  aiMarkLight: '#e0f2fe',
}

// ─── WCAG algorithm ──────────────────────────────────────────────────────────

/** Convert a hex color string to [r, g, b] 0–255 integers. */
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

/** WCAG 2.1 relative luminance for a single 0–255 channel. */
function linearize(c8bit) {
  const c = c8bit / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** WCAG 2.1 relative luminance of a hex color (0–1). */
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

/** WCAG 2.1 contrast ratio between two hex colors. */
function contrastRatio(fg, bg) {
  const L1 = luminance(fg)
  const L2 = luminance(bg)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

// ─── Pairs to verify ─────────────────────────────────────────────────────────
//
// Format: { fg, bg, label, threshold, note? }
//   threshold: 'text' (4.5:1) | 'ui' (3.0:1) | 'warn-only' (document but don't fail)
//
// 'warn-only' pairs are logged but do NOT exit(1). Use for intentionally
// constrained tokens (e.g. ink-muted is only legal for large text / disabled).

const PAIRS = [
  // ── Core text on surfaces ────────────────────────────────────────────────
  {
    fg: 'ink', bg: 'canvas',
    label: 'ink / canvas (primary body text)',
    threshold: 'text',
  },
  {
    fg: 'ink', bg: 'surface',
    label: 'ink / surface (primary body text on white)',
    threshold: 'text',
  },
  {
    fg: 'ink', bg: 'surfaceSubtle',
    label: 'ink / surface-subtle',
    threshold: 'text',
  },
  {
    fg: 'inkSoft', bg: 'canvas',
    label: 'ink-soft / canvas (secondary body text)',
    threshold: 'text',
  },
  {
    fg: 'inkSoft', bg: 'surface',
    label: 'ink-soft / surface (secondary body text on white)',
    threshold: 'text',
  },
  {
    fg: 'inkMuted', bg: 'canvas',
    label: 'ink-muted / canvas (muted text — large text / UI only)',
    threshold: 'warn-only',
    note: '2.81:1 — intentionally below 4.5:1. Use only for large text (≥24px), decorative UI, or disabled states.',
  },

  // ── Amber: the two WCAG failures that prompted this work ─────────────────
  {
    fg: 'onAccent', bg: 'accent',
    label: 'on-accent (#1a1a1a) / accent fill (text on amber button)',
    threshold: 'text',
  },
  {
    fg: 'accentDeep', bg: 'canvas',
    label: 'accent-deep / canvas (amber text/border/focus ring)',
    threshold: 'text',
  },
  {
    fg: 'accentDeep', bg: 'surface',
    label: 'accent-deep / surface (amber text/border on white)',
    threshold: 'text',
  },
  {
    fg: 'accent', bg: 'canvas',
    label: 'accent fill / canvas (amber as a border or icon)',
    threshold: 'warn-only',
    note: 'Amber (#d97706) = 2.81:1 on canvas. Rule: use accent-deep for amber text/border/icon/focus ring. Amber fill is only compliant when paired with on-accent (#1a1a1a) text.',
  },

  // ── Status colors on surfaces ────────────────────────────────────────────
  {
    fg: 'success', bg: 'canvas',
    label: 'success / canvas',
    threshold: 'text',
  },
  {
    fg: 'success', bg: 'surface',
    label: 'success / surface',
    threshold: 'text',
  },
  {
    fg: 'error', bg: 'canvas',
    label: 'error / canvas',
    threshold: 'text',
  },
  {
    fg: 'error', bg: 'surface',
    label: 'error / surface',
    threshold: 'text',
  },

  // ── Inverse text ─────────────────────────────────────────────────────────
  {
    fg: 'inkInverse', bg: 'ink',
    label: 'ink-inverse / ink (white text on dark surface)',
    threshold: 'text',
  },

  // ── AI mark ─────────────────────────────────────────────────────────────
  {
    fg: 'aiMark', bg: 'canvas',
    label: 'ai-mark / canvas',
    threshold: 'text',
  },
  {
    fg: 'aiMark', bg: 'surface',
    label: 'ai-mark / surface',
    threshold: 'text',
  },

  // ── Border UI elements ───────────────────────────────────────────────────
  {
    fg: 'borderStrong', bg: 'canvas',
    label: 'border-strong / canvas (visible borders as UI element)',
    threshold: 'ui',
  },
]

// ─── Run verification ────────────────────────────────────────────────────────

const TEXT_MIN = 4.5
const UI_MIN = 3.0

let failures = 0
let warnings = 0

const COL_W = 56
const SEP = '─'.repeat(72)

console.log('\n' + SEP)
console.log('  RaiseHER — WCAG 2.1 contrast verification')
console.log(SEP)

for (const { fg, bg, label, threshold, note } of PAIRS) {
  const fgHex = TOKENS[fg]
  const bgHex = TOKENS[bg]

  if (!fgHex) { console.error(`  ✗ Unknown token: ${fg}`); process.exit(2) }
  if (!bgHex) { console.error(`  ✗ Unknown token: ${bg}`); process.exit(2) }

  const ratio = contrastRatio(fgHex, bgHex)
  const required = threshold === 'text' ? TEXT_MIN : threshold === 'ui' ? UI_MIN : 0
  const pass = ratio >= required

  const ratioStr = ratio.toFixed(2).padStart(5)
  const reqStr = threshold === 'warn-only'
    ? '(warn)'
    : `${required.toFixed(1)}:1`

  if (threshold === 'warn-only') {
    warnings++
    console.log(`  ⚠ ${label.padEnd(COL_W)} ${ratioStr}:1  ${reqStr}`)
    if (note) console.log(`      → ${note}`)
  } else if (pass) {
    console.log(`  ✓ ${label.padEnd(COL_W)} ${ratioStr}:1  ≥ ${reqStr}`)
  } else {
    failures++
    console.log(`  ✗ ${label.padEnd(COL_W)} ${ratioStr}:1  needs ${reqStr}  FAIL`)
  }
}

console.log(SEP)

const passCount = PAIRS.filter((p) => p.threshold !== 'warn-only').length - failures
const totalChecked = PAIRS.filter((p) => p.threshold !== 'warn-only').length

console.log(`  ${passCount}/${totalChecked} pairs pass  |  ${warnings} documented exception(s)`)

if (failures > 0) {
  console.log(`\n  ✗ ${failures} WCAG failure(s). Fix tokens before shipping.\n`)
  process.exit(1)
} else {
  console.log(`\n  All required pairs pass WCAG AA.\n`)
}
