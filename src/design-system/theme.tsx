/**
 * Design system theme: re-exports all tokens plus a scheme-aware
 * ThemeProvider / useTheme hook.
 *
 * MVP default chosen in the build plan: always resolve to the light
 * palette regardless of device color scheme. Dark tokens are fully built
 * and ready; flip `FORCE_SCHEME` to null to let dark mode follow the
 * system setting once it ships as the fast-follow.
 *
 * Usage:
 *   import { useTheme } from '@/design-system/theme'
 *   const { colors, spacing, radii, typography, motion } = useTheme()
 *   <View style={{ backgroundColor: colors.canvas, padding: spacing[4] }} />
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { colorSchemes, type ColorScheme } from './tokens/colors'
import { spacing, radii } from './tokens/spacing'
import { typography } from './tokens/typography'
import { motion } from './tokens/motion'

// MVP default: light only (see plan defaults). Set to null to follow the
// system color scheme once dark mode ships.
const FORCE_SCHEME: ColorScheme | null = 'light'

function buildTheme(scheme: ColorScheme) {
  return {
    scheme,
    colors: colorSchemes[scheme],
    spacing,
    radii,
    typography,
    motion,
  }
}

export type Theme = ReturnType<typeof buildTheme>

export const lightTheme = buildTheme('light')
export const darkTheme = buildTheme('dark')

const ThemeContext = createContext<Theme>(lightTheme)

interface ThemeProviderProps {
  /** Preferred scheme, ignored while FORCE_SCHEME is set (MVP light-only). */
  scheme?: ColorScheme
  children: ReactNode
}

/**
 * Root theme provider. Place directly under SafeAreaProvider per the
 * provider order in the build plan: Clerk -> Convex -> i18n -> Theme -> SafeArea.
 */
export function ThemeProvider({ scheme, children }: ThemeProviderProps) {
  const resolvedScheme = FORCE_SCHEME ?? scheme ?? 'light'
  const value = useMemo(() => buildTheme(resolvedScheme), [resolvedScheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): Theme {
  return useContext(ThemeContext)
}

/**
 * Static default export for call sites outside React that cannot use the
 * `useTheme` hook. Always the light theme; components rendered inside
 * `<ThemeProvider>` should prefer `useTheme()` so dark mode works later.
 */
export const theme = lightTheme
