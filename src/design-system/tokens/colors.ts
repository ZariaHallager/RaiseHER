/**
 * RaiseHER flat color palette
 *
 * Rules enforced by design system:
 *   - NO purple
 *   - NO gradients
 *   - NO glassmorphism / glow
 *   - NO stock AI sparkle icons
 *
 * Light mode only at MVP; dark token scaffolding ready for fast-follow.
 */
export const colors = {
  // Primary
  ink: '#1A1A1A',
  inkSoft: '#444444',
  inkMuted: '#888888',

  // Background
  canvas: '#F5F0EB',
  surface: '#FFFFFF',
  surfaceSubtle: '#EDE8E2',

  // Accent — warm amber (no purple)
  accent: '#D97706',
  accentLight: '#FEF3C7',

  // Status
  success: '#15803D',
  successLight: '#DCFCE7',
  error: '#B91C1C',
  errorLight: '#FEE2E2',
  warning: '#B45309',
  warningLight: '#FEF9C3',

  // AI Mark color — distinct, not sparkle-purple
  aiMark: '#0369A1',
  aiMarkLight: '#E0F2FE',

  // Border
  border: '#D4CDC5',
  borderStrong: '#A09890',
} as const

export type ColorToken = keyof typeof colors
