'use client'

/**
 * Toggle primitive, web version.
 *
 * Custom on/off switch (role="switch"). The pill track and circular thumb
 * are fully round (border-radius: 9999px). Thumb position animates with a
 * CSS transition; prefers-reduced-motion is respected via
 * motion-reduce:transition-none.
 *
 * Keyboard: Space bar toggles (native button behavior).
 * Focus ring on the button itself via :focus-visible.
 */

interface ToggleProps {
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
  /** Accessible label. Required when there is no visible label nearby. */
  'aria-label'?: string
  /** ID of a visible label element. Use either this or aria-label. */
  'aria-labelledby'?: string
  className?: string
}

export function Toggle({
  value,
  onValueChange,
  disabled = false,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      disabled={disabled}
      onClick={() => onValueChange(!value)}
      className={[
        'relative inline-flex w-12 h-7 rounded-full p-0.5 cursor-pointer',
        'transition-colors duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep',
        value ? 'bg-accent' : 'bg-border',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        aria-hidden="true"
        className={[
          'block w-6 h-6 rounded-full bg-surface',
          'transition-transform duration-200 motion-reduce:transition-none',
          value ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}
