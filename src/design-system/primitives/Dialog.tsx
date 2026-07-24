/**
 * Dialog primitive.
 *
 * Custom modal: no default platform alert/action-sheet chrome. Backdrop
 * fades in, card fades and scales in, both driven by motion tokens.
 * Tapping the backdrop calls onRequestClose.
 */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { useTheme } from '../theme'

interface DialogProps {
  visible: boolean
  onRequestClose: () => void
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

export function Dialog({ visible, onRequestClose, children, style }: DialogProps) {
  const { colors, spacing, radii, motion } = useTheme()
  // useState (not useRef) holds the stable Animated.Value instance so this
  // component's own render never dereferences a ref.
  const [progress] = useState(() => new Animated.Value(0))

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? motion.duration.base : motion.duration.fast,
      easing: visible ? motion.easing.decelerate : motion.easing.accelerate,
      useNativeDriver: true,
    }).start()
  }, [visible, progress, motion])

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onRequestClose}>
      <Animated.View style={[styles.backdrop, { backgroundColor: colors.overlay, opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} />
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing[5],
              transform: [
                {
                  scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }),
                },
              ],
            },
            style,
          ]}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 400 },
})
