/**
 * Tag primitive.
 *
 * Small pill used for badges/chips, uses the small corner radius reserved
 * for tags/badges. Tone maps to the flat status colors, never a gradient.
 */
import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../theme'

export type TagTone = 'neutral' | 'accent' | 'success' | 'error' | 'warning'

interface TagProps {
  label: string
  tone?: TagTone
}

export function Tag({ label, tone = 'neutral' }: TagProps) {
  const { colors, spacing, radii, typography } = useTheme()

  const toneColors: Record<TagTone, { bg: string; fg: string }> = {
    neutral: { bg: colors.surfaceSubtle, fg: colors.inkSoft },
    accent: { bg: colors.accentLight, fg: colors.accent },
    success: { bg: colors.successLight, fg: colors.success },
    error: { bg: colors.errorLight, fg: colors.error },
    warning: { bg: colors.warningLight, fg: colors.warning },
  }
  const { bg, fg } = toneColors[tone]

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: bg,
          borderRadius: radii.sm,
          paddingHorizontal: spacing[2],
          paddingVertical: spacing[1],
        },
      ]}
    >
      <Text style={[typography.label, { color: fg }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: { alignSelf: 'flex-start' },
})
