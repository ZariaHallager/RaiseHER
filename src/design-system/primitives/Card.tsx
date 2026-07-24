/**
 * Card primitive.
 *
 * Flat surface container: no shadow, no glow, a single hairline border and
 * the large corner radius reserved for cards/buttons/modals.
 */
import type { ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { useTheme } from '../theme'

interface CardProps {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

export function Card({ children, style }: CardProps) {
  const { colors, spacing, radii } = useTheme()

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.lg,
          padding: spacing[5],
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base: { borderWidth: 1 },
})
