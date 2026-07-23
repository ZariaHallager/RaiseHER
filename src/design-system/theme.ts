/**
 * Design system theme — re-exports all tokens as a single import.
 *
 * Usage:
 *   import { theme } from '@/design-system/theme'
 *   <View style={{ backgroundColor: theme.colors.canvas }} />
 */
import { colors } from './tokens/colors'
import { spacing, radii } from './tokens/spacing'
import { typography } from './tokens/typography'

export const theme = {
  colors,
  spacing,
  radii,
  typography,
} as const

export type Theme = typeof theme
