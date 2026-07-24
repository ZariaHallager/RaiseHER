/**
 * Custom geometric tab-bar icon set.
 *
 * Built entirely from View primitives (borders, radii, flex layout): no
 * icon font, no SVG dependency, no default system icons, per design
 * system rules. Color is passed in by the tab bar (active/inactive tint),
 * so each icon just draws its shape with that color.
 */
import { StyleSheet, View, type ColorValue } from 'react-native'

interface IconProps {
  color: ColorValue
  size?: number
}

export function TodayIcon({ color, size = 24 }: IconProps) {
  const dotSize = size * 0.55
  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: color,
        }}
      />
    </View>
  )
}

export function WinsIcon({ color, size = 24 }: IconProps) {
  const heights = [size * 0.32, size * 0.55, size * 0.8]
  return (
    <View style={[styles.box, styles.row, { width: size, height: size }]}>
      {heights.map((barHeight, index) => (
        <View
          key={index}
          style={{
            width: 4,
            height: barHeight,
            marginHorizontal: 2,
            borderRadius: 2,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  )
}

export function RehearsalIcon({ color, size = 24 }: IconProps) {
  const heights = [size * 0.3, size * 0.55, size * 0.85, size * 0.5, size * 0.25]
  return (
    <View style={[styles.box, styles.row, styles.centeredRow, { width: size, height: size }]}>
      {heights.map((barHeight, index) => (
        <View
          key={index}
          style={{
            width: 3,
            height: barHeight,
            marginHorizontal: 1.5,
            borderRadius: 2,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  )
}

export function CaseFilesIcon({ color, size = 24 }: IconProps) {
  const width = size * 0.82
  const height = size * 0.58
  const tabWidth = width * 0.42
  const tabHeight = height * 0.3

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View style={{ width, alignItems: 'flex-start' }}>
        <View
          style={{
            width: tabWidth,
            height: tabHeight,
            borderWidth: 2,
            borderBottomWidth: 0,
            borderColor: color,
            borderTopLeftRadius: 2,
            borderTopRightRadius: 2,
          }}
        />
        <View
          style={{
            width,
            height,
            borderWidth: 2,
            borderColor: color,
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  )
}

export function CircleIcon({ color, size = 24 }: IconProps) {
  const dotSize = size * 0.22
  const radius = size * 0.26

  const dots: Array<{ x: number; y: number }> = [
    { x: size / 2, y: size / 2 - radius },
    { x: size / 2 + radius * Math.sin((2 * Math.PI) / 3), y: size / 2 - radius * Math.cos((2 * Math.PI) / 3) },
    { x: size / 2 + radius * Math.sin((4 * Math.PI) / 3), y: size / 2 - radius * Math.cos((4 * Math.PI) / 3) },
  ]

  return (
    <View style={{ width: size, height: size }}>
      {dots.map((dot, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
            left: dot.x - dotSize / 2,
            top: dot.y - dotSize / 2,
          }}
        />
      ))}
    </View>
  )
}

export function ProfileIcon({ color, size = 24 }: IconProps) {
  const headSize = size * 0.36
  const bodyWidth = size * 0.66
  const bodyHeight = size * 0.34

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <View
        style={{
          width: headSize,
          height: headSize,
          borderRadius: headSize / 2,
          borderWidth: 2,
          borderColor: color,
          marginBottom: 2,
        }}
      />
      <View
        style={{
          width: bodyWidth,
          height: bodyHeight,
          borderTopLeftRadius: bodyWidth / 2,
          borderTopRightRadius: bodyWidth / 2,
          borderWidth: 2,
          borderBottomWidth: 0,
          borderColor: color,
        }}
      />
    </View>
  )
}

export type TabIconName = 'today' | 'wins' | 'rehearsal' | 'caseFiles' | 'circle' | 'profile'

const ICON_COMPONENTS: Record<TabIconName, (props: IconProps) => ReturnType<typeof TodayIcon>> = {
  today: TodayIcon,
  wins: WinsIcon,
  rehearsal: RehearsalIcon,
  caseFiles: CaseFilesIcon,
  circle: CircleIcon,
  profile: ProfileIcon,
}

interface TabIconProps extends IconProps {
  name: TabIconName
}

export function TabIcon({ name, color, size = 24 }: TabIconProps) {
  const IconComponent = ICON_COMPONENTS[name]
  return <IconComponent color={color} size={size} />
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  centeredRow: { alignItems: 'center' },
})
