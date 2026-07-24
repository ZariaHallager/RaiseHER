'use client'

/**
 * Button primitive, web version.
 *
 * Variants: primary (filled ink), secondary (outlined), ghost (text-only).
 * Press feedback via CSS active:scale. Loading state shows an inline spinner
 * and sets aria-busy. Disabled state sets both HTML disabled and aria-disabled.
 *
 * Accepts a ref (React 19 ref-as-prop, no forwardRef wrapper needed).
 */
import { type ButtonHTMLAttributes, type Ref } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  variant?: ButtonVariant
  loading?: boolean
  ref?: Ref<HTMLButtonElement>
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-ink-inverse',
  secondary: 'border-[1.5px] border-ink text-ink bg-transparent',
  ghost: 'text-ink bg-transparent',
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  className,
  ref,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      type="button"
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center gap-2',
        'font-bold text-body rounded-lg px-6 py-4',
        'transition-transform active:scale-[0.97]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep',
        'cursor-pointer',
        VARIANT_CLASSES[variant],
        isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? (
        <>
          <span
            aria-hidden="true"
            className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          />
          <span className="sr-only">{label}</span>
        </>
      ) : (
        label
      )}
    </button>
  )
}
