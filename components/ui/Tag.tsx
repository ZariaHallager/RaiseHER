/**
 * Tag primitive, web version.
 *
 * Small pill for badges/chips. Tone maps to the flat status colors.
 * Rendered as a span. Callers that need a semantic role (e.g. status,
 * button) can wrap or pass className overrides.
 *
 * Warning tone uses inline CSS vars since --color-warning is defined in
 * globals.css but not exported as a @theme token. All other tones use
 * Tailwind utilities generated from the @theme block.
 *
 * Server component: no state or browser APIs.
 */

export type TagTone = 'neutral' | 'accent' | 'success' | 'error' | 'warning'

interface TagProps {
  label: string
  tone?: TagTone
  className?: string
}

const TONE_CLASSES: Record<Exclude<TagTone, 'warning'>, string> = {
  neutral: 'bg-surface-subtle text-ink-soft',
  accent: 'bg-accent-light text-accent-deep',
  success: 'bg-success-light text-success',
  error: 'bg-error-light text-error',
}

export function Tag({ label, tone = 'neutral', className }: TagProps) {
  const isWarning = tone === 'warning'

  return (
    <span
      className={[
        'inline-flex items-center rounded-sm px-2 py-1',
        'text-label font-semibold tracking-wide',
        isWarning ? '' : TONE_CLASSES[tone as Exclude<TagTone, 'warning'>],
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        isWarning
          ? {
            backgroundColor: 'var(--color-warning-light)',
            color: 'var(--color-warning)',
          }
          : undefined
      }
    >
      {label}
    </span>
  )
}
