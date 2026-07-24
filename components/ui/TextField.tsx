'use client'

/**
 * TextField primitive, web version.
 *
 * Label then input then inline error pattern.
 * useId generates a stable id so the label htmlFor and input id always match.
 * aria-invalid plus aria-describedby wire the error message to the input.
 * Error uses role="alert" so it is announced on update.
 * Focus ring uses accent-deep to pass the 3:1 non-text contrast floor.
 *
 * Accepts a ref (React 19 ref-as-prop, no forwardRef wrapper needed).
 */
import { useId, useState, type InputHTMLAttributes, type Ref } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label?: string
  error?: string
  hint?: string
  id?: string
  ref?: Ref<HTMLInputElement>
}

export function TextField({
  label,
  error,
  hint,
  id: idProp,
  className,
  onFocus,
  onBlur,
  ref,
  ...props
}: TextFieldProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const [isFocused, setIsFocused] = useState(false)

  const describedBy =
    [error ? errorId : null, hint && !error ? hintId : null]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className="text-label font-semibold tracking-wide text-ink-soft"
        >
          {label}
        </label>
      )}

      <input
        ref={ref}
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        onFocus={(e) => {
          setIsFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocused(false)
          onBlur?.(e)
        }}
        className={[
          'text-body bg-surface text-ink',
          'border-[1.5px] rounded-lg px-4 py-3',
          'placeholder:text-ink-muted',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep',
          error
            ? 'border-error'
            : isFocused
              ? 'border-accent-deep'
              : 'border-border',
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />

      {hint && !error && (
        <p id={hintId} className="text-caption text-ink-muted">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-caption text-error">
          {error}
        </p>
      )}
    </div>
  )
}
