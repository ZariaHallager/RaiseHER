/**
 * Button primitive.
 *
 * Variants: primary (filled ink), secondary (outlined), ghost (text-only).
 * Uses a subtle press-scale animation driven by motion tokens instead of
 * any default platform button chrome.
 */
import { useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { useTheme } from '../theme'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps {
  label: string
  onPress?: (event: GestureResponderEvent) => void
  variant?: ButtonVariant
  disabled?: boolean
  loading?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  accessibilityLabel?: string
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  testID,
  accessibilityLabel,
}: ButtonProps) {
  const { colors, spacing, radii, typography, motion } = useTheme()
  // useState (not useRef) holds the stable Animated.Value instance so this
  // component's own render never dereferences a ref.
  const [scale] = useState(() => new Animated.Value(1))
  const isDisabled = disabled || loading

  const animateTo = (value: number) => {
    Animated.timing(scale, {
      toValue: value,
      duration: motion.duration.fast,
      easing: motion.easing.standard,
      useNativeDriver: true,
    }).start()
  }

  const backgroundColor = variant === 'primary' ? colors.ink : 'transparent'
  const borderColor = variant === 'secondary' ? colors.ink : 'transparent'
  const textColor = variant === 'primary' ? colors.inkInverse : colors.ink

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        testID={testID}
        style={[
          styles.base,
          {
            backgroundColor,
            borderColor,
            borderWidth: variant === 'secondary' ? 1.5 : 0,
            borderRadius: radii.lg,
            paddingVertical: spacing[4],
            paddingHorizontal: spacing[6],
            opacity: isDisabled ? 0.5 : 1,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <Text style={[typography.body, styles.label, { color: textColor }]}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '700' },
})
