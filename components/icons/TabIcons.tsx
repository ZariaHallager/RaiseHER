/**
 * Geometric tab-bar icon set, SVG version.
 *
 * Each icon is redrawn from the exact View-geometry recipe in the original
 * React Native TabIcons.tsx. All shapes are constructed from SVG primitives
 * (rect, circle, path) with no icon font or external dependency.
 *
 * Color is driven by CSS currentColor so callers pass a Tailwind text utility
 * (e.g. "text-ink" or "text-ink-muted") and all strokes/fills inherit it.
 *
 * Every icon is aria-hidden="true" since nav items supply their own accessible
 * label via aria-label or visually-hidden text.
 *
 * Server components: no state or browser APIs.
 */

interface IconProps {
  /** Size in px, applied to both width and height. Default: 24. */
  size?: number
  /** Tailwind text utility, e.g. "text-ink" or "text-ink-muted". */
  className?: string
}

/**
 * TodayIcon.
 * Recipe: single filled circle, diameter = 55 % of size, centered.
 */
export function TodayIcon({ size = 24, className }: IconProps) {
  const r = (size * 0.55) / 2
  const c = size / 2

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      <circle cx={c} cy={c} r={r} fill="currentColor" />
    </svg>
  )
}

/**
 * WinsIcon.
 * Recipe: 3 vertical bars, bottom-aligned bar chart.
 * Bar width 4 px, marginHorizontal 2 px each side.
 * Heights: 32 %, 55 %, 80 % of size. Corner radius: 2 px.
 */
export function WinsIcon({ size = 24, className }: IconProps) {
  const barW = 4
  const slotW = barW + 4 // 2px margin on each side = 4px total gap per slot

  const heights = [0.32, 0.55, 0.8].map((r) => Math.round(r * size))
  const totalW = heights.length * slotW
  const offsetX = (size - totalW) / 2

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      {heights.map((h, i) => (
        <rect
          key={i}
          x={offsetX + i * slotW + 2}
          y={size - h}
          width={barW}
          height={h}
          rx={2}
          fill="currentColor"
        />
      ))}
    </svg>
  )
}

/**
 * RehearsalIcon.
 * Recipe: 5 vertical bars, vertically centered (waveform).
 * Bar width 3 px, gap 1.5 px between bars.
 * Heights: 30 %, 55 %, 85 %, 50 %, 25 % of size. Corner radius: 1.5 px.
 */
export function RehearsalIcon({ size = 24, className }: IconProps) {
  const barW = 3
  const gap = 1.5
  const slotW = barW + gap

  const ratios = [0.3, 0.55, 0.85, 0.5, 0.25]
  const totalW = ratios.length * slotW - gap
  const offsetX = (size - totalW) / 2

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      {ratios.map((ratio, i) => {
        const h = ratio * size
        const y = (size - h) / 2
        return (
          <rect
            key={i}
            x={offsetX + i * slotW}
            y={y}
            width={barW}
            height={h}
            rx={1.5}
            fill="currentColor"
          />
        )
      })}
    </svg>
  )
}

/**
 * CaseFilesIcon.
 * Recipe: briefcase silhouette.
 * Body: 82 % x 58 % rectangle, rounded 3 px, stroked.
 * Tab: 42 % of body width, 30 % of body height, top 3 sides only (no bottom
 *      border), top corners rounded 2 px.
 */
export function CaseFilesIcon({ size = 24, className }: IconProps) {
  const sw = 2
  const bodyW = size * 0.82
  const bodyH = size * 0.58
  const tabW = bodyW * 0.42
  const tabH = bodyH * 0.3
  const totalH = tabH + bodyH
  const bodyX = (size - bodyW) / 2
  const topY = (size - totalH) / 2
  const tabY = topY
  const bodyY = topY + tabH

  // Tab: 3-sided border (no bottom). Top corners rounded rx 2.
  const tabPath = [
    `M ${bodyX},${tabY + tabH}`,
    `L ${bodyX},${tabY + 2}`,
    `Q ${bodyX},${tabY} ${bodyX + 2},${tabY}`,
    `L ${bodyX + tabW - 2},${tabY}`,
    `Q ${bodyX + tabW},${tabY} ${bodyX + tabW},${tabY + 2}`,
    `L ${bodyX + tabW},${tabY + tabH}`,
  ].join(' ')

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      className={className}
    >
      <path d={tabPath} stroke="currentColor" strokeWidth={sw} strokeLinecap="square" />
      <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx={3} stroke="currentColor" strokeWidth={sw} />
    </svg>
  )
}

/**
 * CircleIcon.
 * Recipe: 3 filled dots in an equilateral triangle.
 * Dot diameter = 22 % of size. Triangle radius = 26 % of size.
 * Angles: 0 deg (top), 120 deg, 240 deg.
 */
export function CircleIcon({ size = 24, className }: IconProps) {
  const dotR = (size * 0.22) / 2
  const triR = size * 0.26
  const cx = size / 2
  const cy = size / 2

  const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]
  const dots = angles.map((angle) => ({
    x: cx + triR * Math.sin(angle),
    y: cy - triR * Math.cos(angle),
  }))

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={dotR} fill="currentColor" />
      ))}
    </svg>
  )
}

/**
 * ProfileIcon.
 * Recipe: person silhouette, stroked head circle plus body arc.
 * Head: diameter = 36 % of size, stroked (no fill).
 * Body: width = 66 % of size, height = 34 % of size.
 *   Top corners radius = bodyWidth / 2 (perfect arc). No bottom border.
 */
export function ProfileIcon({ size = 24, className }: IconProps) {
  const sw = 2
  const headD = size * 0.36
  const headR = headD / 2
  const headCy = headR + sw / 2
  const gap = 2

  const bodyW = size * 0.66
  const bodyX = (size - bodyW) / 2
  const bodyTopY = headCy + headR + gap
  const bodyH = size * 0.34
  const bodyArcR = bodyW / 2

  // Left bottom -> up left side -> arc over top -> down right side -> right bottom
  const bodyPath = [
    `M ${bodyX},${bodyTopY + bodyH}`,
    `L ${bodyX},${bodyTopY + bodyArcR}`,
    `A ${bodyArcR},${bodyArcR},0,0,1,${bodyX + bodyW},${bodyTopY + bodyArcR}`,
    `L ${bodyX + bodyW},${bodyTopY + bodyH}`,
  ].join(' ')

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      className={className}
    >
      <circle
        cx={size / 2}
        cy={headCy}
        r={headR - sw / 2}
        stroke="currentColor"
        strokeWidth={sw}
      />
      <path d={bodyPath} stroke="currentColor" strokeWidth={sw} />
    </svg>
  )
}

/* Composite TabIcon dispatches by name */

export type TabIconName =
  | 'today'
  | 'wins'
  | 'rehearsal'
  | 'caseFiles'
  | 'circle'
  | 'profile'

const ICON_MAP: Record<TabIconName, typeof TodayIcon> = {
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

export function TabIcon({ name, size = 24, className }: TabIconProps) {
  const Icon = ICON_MAP[name]
  return <Icon size={size} className={className} />
}
