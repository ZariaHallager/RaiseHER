/**
 * Spacing scale, base unit 4, fixed multiples.
 * Use these tokens everywhere; never hardcode spacing values.
 */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const

export type SpacingToken = keyof typeof spacing

/**
 * Corner radii, exactly two values per design system rules.
 *   sm: tags, badges, chips
 *   lg: cards, buttons, modals
 * Fully round controls (toggle track/thumb, calendar day dots) use
 * radius = size / 2, which is a circular shape rather than a corner-radius
 * style choice, so it is intentionally outside this two-value scale.
 */
export const radii = {
  sm: 8,
  lg: 16,
} as const

export type RadiusToken = keyof typeof radii
