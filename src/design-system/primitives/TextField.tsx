/**
 * TextField primitive.
 *
 * Restyled text input: label above, accent-colored focus border, error
 * message below in the error color. Wraps the native TextInput (there is
 * no way to fully re-draw text entry) but every visual is design-system
 * controlled.
 */
import { useState } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'
import { useTheme } from '../theme'

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string
  error?: string
  containerStyle?: StyleProp<ViewStyle>
}

export function TextField({
  label,
  error,
  containerStyle,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const { colors, spacing, radii, typography } = useTheme()
  const [isFocused, setIsFocused] = useState(false)

  const borderColor = error ? colors.error : isFocused ? colors.accent : colors.border

  return (
    <View style={[{ gap: spacing[1] }, containerStyle]}>
      {label ? <Text style={[typography.label, { color: colors.inkSoft }]}>{label}</Text> : null}
      <TextInput
        {...inputProps}
        onFocus={(event) => {
          setIsFocused(true)
          onFocus?.(event)
        }}
        onBlur={(event) => {
          setIsFocused(false)
          onBlur?.(event)
        }}
        placeholderTextColor={colors.inkMuted}
        style={[
          typography.body,
          styles.input,
          {
            color: colors.ink,
            backgroundColor: colors.surface,
            borderColor,
            borderRadius: radii.lg,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
          },
        ]}
      />
      {error ? <Text style={[typography.caption, { color: colors.error }]}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  input: { borderWidth: 1.5 },
})
