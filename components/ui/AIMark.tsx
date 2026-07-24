/**
 * AIMark: the single AI signature badge.
 *
 * Replaces all sparkle / magic-wand / star icons for AI content.
 * "AI" is a fixed wordmark abbreviation, not translated copy.
 *
 * Server component: no state or browser APIs.
 */

interface AIMarkProps {
  size?: 'sm' | 'md'
  className?: string
}

export function AIMark({ size = 'sm', className }: AIMarkProps) {
  return (
    <span
      aria-label="AI"
      className={[
        'inline-flex items-center justify-center',
        'bg-ai-mark-light text-ai-mark font-bold tracking-[0.03em]',
        'rounded-sm',
        size === 'sm'
          ? 'px-1.5 py-0.5 text-[10px] leading-none'
          : 'px-2.5 py-1 text-[13px] leading-none',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* eslint-disable-next-line raiseher/no-hardcoded-jsx-text -- fixed AI wordmark, not translated copy */}
      {'AI'}
    </span>
  )
}
