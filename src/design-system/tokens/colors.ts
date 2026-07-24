/**
 * RaiseHER flat color palettes.
 *
 * Rules enforced by design system:
 *   - NO purple
 *   - NO gradients
 *   - NO glassmorphism / glow
 *   - NO stock AI sparkle icons
 *
 * Light and dark palettes share the same token names so components never
 * branch on scheme directly, they just read `theme.colors.*`.
 * Light ships at MVP; dark is fully built and fast-follow ready (see
 * `FORCE_SCHEME` in theme.tsx).
 */
export const lightColors = {
  // Primary
  ink: '#1A1A1A',
  inkSoft: '#444444',
  inkMuted: '#888888',
  inkInverse: '#FFFFFF',

  // Background
  canvas: '#F5F0EB',
  surface: '#FFFFFF',
  surfaceSubtle: '#EDE8E2',

  // Accent, warm amber (no purple)
  // ⚠ amber is a fill color; text ON amber uses onAccent (#1A1A1A, 5.47:1)
  // amber AS text/border/icon uses accentDeep (#8F4E05, 5.11:1 on canvas)
  accent: '#D97706',
  accentLight: '#FEF3C7',
  accentDeep: '#8F4E05',
  onAccent: '#1A1A1A',

  // Status
  success: '#166534', // darkened from #15803D to clear WCAG 4.5:1 on canvas
  successLight: '#DCFCE7',
  error: '#B91C1C',
  errorLight: '#FEE2E2',
  warning: '#B45309',
  warningLight: '#FEF9C3',

  // AI Mark color, distinct from sparkle-purple conventions
  aiMark: '#0369A1',
  aiMarkLight: '#E0F2FE',

  // Border
  border: '#D4CDC5',
  borderStrong: '#887F78', // darkened from #A09890 to clear WCAG 3:1 on canvas

  // Dialog / modal backdrop
  overlay: 'rgba(26, 26, 26, 0.5)',
} as const

export const darkColors: Record<keyof typeof lightColors, string> = {
  ink: '#F5F0EB',
  inkSoft: '#D4CDC5',
  inkMuted: '#948C84',
  inkInverse: '#1A1A1A',

  canvas: '#17140F',
  surface: '#241F18',
  surfaceSubtle: '#2E2820',

  accent: '#F59E0B',
  accentLight: '#3A2A0C',
  accentDeep: '#F59E0B', // dark bg provides enough contrast — amber works as text
  onAccent: '#1A1A1A',

  success: '#4ADE80',
  successLight: '#123A22',
  error: '#F87171',
  errorLight: '#3F1414',
  warning: '#FBBF24',
  warningLight: '#3A2A0C',

  aiMark: '#38BDF8',
  aiMarkLight: '#0C2C3D',

  border: '#3A332B',
  borderStrong: '#544A3E',

  overlay: 'rgba(0, 0, 0, 0.6)',
}

export type ColorToken = keyof typeof lightColors
export type ColorPalette = Record<ColorToken, string>
export type ColorScheme = 'light' | 'dark'

export const colorSchemes: Record<ColorScheme, ColorPalette> = {
  light: lightColors,
  dark: darkColors,
}

/** Backward-compatible alias: existing static imports keep resolving to light. */
export const colors = lightColors
