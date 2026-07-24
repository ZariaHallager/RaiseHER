/**
 * AIMark: the single "AI signature" component used everywhere AI content
 * or actions appear. Replaces sparkle icons entirely per design system rules.
 *
 * Renders a small geometric badge with an "AI" label in the AI mark color.
 * Do NOT use any sparkle / magic-wand / star icons for AI anywhere in the app.
 *
 * Note on the "AI" label: it is a fixed two-letter abbreviation (like a
 * wordmark), not translated copy, so it is intentionally exempt from the
 * no-hardcoded-jsx-text lint rule below.
 */
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../theme'

interface AIMarkProps {
  size?: 'sm' | 'md'
}

export function AIMark({ size = 'sm' }: AIMarkProps) {
  const { colors, radii } = useTheme()
  const isSmall = size === 'sm'

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.aiMarkLight, borderRadius: radii.sm },
        isSmall ? styles.sm : styles.md,
      ]}
    >
      {/* eslint-disable-next-line raiseher/no-hardcoded-jsx-text -- fixed AI wordmark, not translated */}
      <Text style={[styles.label, { color: colors.aiMark }, isSmall ? styles.labelSm : styles.labelMd]}>AI</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sm: { paddingHorizontal: 6, paddingVertical: 2 },
  md: { paddingHorizontal: 10, paddingVertical: 4 },
  label: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelSm: { fontSize: 10 },
  labelMd: { fontSize: 13 },
})
