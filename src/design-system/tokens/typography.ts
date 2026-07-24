/**
 * Type scale, 6 tokens.
 * Distinctive display face + legible body face.
 * Both verified for Latin-1 / accented glyphs (es, fr, pt).
 *
 * Fonts: loaded via expo-font config plugin (see app.json / fonts-config-plugin rule).
 * Using system fallbacks until custom fonts are bundled.
 */
import { Platform } from 'react-native'

const displayFont = Platform.select({
  ios: 'Georgia', // swap for custom display font once bundled
  android: 'serif',
  default: 'serif',
})

const bodyFont = Platform.select({
  ios: '-apple-system',
  android: 'Roboto',
  default: 'sans-serif',
})

export const typography = {
  display: {
    fontFamily: displayFont,
    fontSize: 40,
    fontWeight: '800' as const,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  headline: {
    fontFamily: displayFont,
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: -0.2,
  },
  subhead: {
    fontFamily: bodyFont,
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  body: {
    fontFamily: bodyFont,
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontFamily: bodyFont,
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  label: {
    fontFamily: bodyFont,
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
} as const

export type TypographyToken = keyof typeof typography
