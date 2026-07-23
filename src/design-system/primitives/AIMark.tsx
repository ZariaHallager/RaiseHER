/**
 * AIMark — the single "AI signature" component used everywhere AI content
 * or actions appear. Replaces sparkle icons entirely per design system rules.
 *
 * Renders a small geometric badge with "AI" label in the accent color.
 * Do NOT use any sparkle / magic-wand / star icons for AI anywhere in the app.
 */
import { View, Text, StyleSheet } from 'react-native'
import { theme } from '../theme'

interface AIMarkProps {
  size?: 'sm' | 'md'
}

export function AIMark({ size = 'sm' }: AIMarkProps) {
  const isSmall = size === 'sm'
  return (
    <View style={[styles.container, isSmall ? styles.sm : styles.md]}>
      <Text style={[styles.label, isSmall ? styles.labelSm : styles.labelMd]}>AI</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.aiMarkLight,
    borderRadius: theme.radii.sm,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sm: { paddingHorizontal: 6, paddingVertical: 2 },
  md: { paddingHorizontal: 10, paddingVertical: 4 },
  label: {
    color: theme.colors.aiMark,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelSm: { fontSize: 10 },
  labelMd: { fontSize: 13 },
})
