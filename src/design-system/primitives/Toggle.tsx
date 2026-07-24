/**
 * Toggle primitive.
 *
 * Custom on/off switch drawn from View primitives (no default RN Switch,
 * which renders the native platform control). The pill track and circular
 * thumb are fully round by construction (radius = size / 2), which is a
 * circular shape rather than the two-value corner-radius scale.
 */
import { useEffect, useState } from 'react'
import { Animated, Pressable, StyleSheet } from 'react-native'
import { useTheme } from '../theme'

interface ToggleProps {
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
  accessibilityLabel?: string
}

const TRACK_WIDTH = 48
const TRACK_HEIGHT = 28
const TRACK_PADDING = 2
const THUMB_SIZE = TRACK_HEIGHT - TRACK_PADDING * 2
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - TRACK_PADDING * 2

export function Toggle({ value, onValueChange, disabled = false, accessibilityLabel }: ToggleProps) {
  const { colors, motion } = useTheme()
  // useState (not useRef) holds the stable Animated.Value instance so this
  // component's own render never dereferences a ref.
  const [progress] = useState(() => new Animated.Value(value ? 1 : 0))

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: motion.duration.base,
      easing: motion.easing.standard,
      useNativeDriver: true,
    }).start()
  }, [value, progress, motion])

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, THUMB_TRAVEL] })
  const trackColor = value ? colors.accent : colors.border

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { backgroundColor: trackColor, opacity: disabled ? 0.5 : 1 }]}
    >
      <Animated.View style={[styles.thumb, { backgroundColor: colors.surface, transform: [{ translateX }] }]} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: TRACK_PADDING,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
  },
})
