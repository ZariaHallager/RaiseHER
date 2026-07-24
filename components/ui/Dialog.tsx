'use client'

/**
 * Dialog primitive, web version.
 *
 * Uses the native HTML dialog element with showModal() for:
 *   - Browser-native focus trapping inside the dialog
 *   - Implicit aria-modal="true" via the top-layer
 *   - Escape key to close (fires the close event natively)
 *
 * Focus is returned to the element that triggered the dialog on close.
 *
 * Clicking the backdrop (outside the card) closes the dialog. Detection
 * uses e.target === e.currentTarget since backdrop clicks bubble to the
 * dialog element itself, not to any child.
 *
 * Motion: backdrop and card animate in via CSS keyframes in globals.css.
 * Both respect prefers-reduced-motion via the media query in globals.css.
 */
import { useEffect, useRef, type ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  /** Optional dialog label. Prefer a visible h2 heading inside children. */
  'aria-label'?: string
  /** ID of a heading element inside the dialog to use as the accessible name. */
  'aria-labelledby'?: string
  children: ReactNode
  className?: string
}

export function Dialog({
  open,
  onClose,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  children,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  /** Element focused before the dialog opened; focus returns here on close. */
  const returnerRef = useRef<Element | null>(null)

  // Open / close the native dialog element.
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return

    if (open) {
      if (!el.open) {
        returnerRef.current = document.activeElement
        el.showModal()
      }
    } else {
      if (el.open) {
        el.close()
      }
    }
  }, [open])

  // The dialog close event fires on Escape or close(). Sync state and restore focus.
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return

    const handleClose = () => {
      onClose()
      const returner = returnerRef.current
      if (returner instanceof HTMLElement || returner instanceof SVGElement) {
        returner.focus()
      }
    }

    el.addEventListener('close', handleClose)
    return () => el.removeEventListener('close', handleClose)
  }, [onClose])

  // Backdrop click: the click target IS the dialog element (not a child).
  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) {
      dialogRef.current?.close()
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- <dialog> carries implicit role=dialog, an interactive widget; backdrop-click is a supplementary close path
    <dialog
      ref={dialogRef}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      onClick={handleDialogClick}
      // Escape is handled natively by the browser for <dialog>. This no-op
      // satisfies jsx-a11y/click-events-have-key-events.
      onKeyDown={() => undefined}
      className="m-auto max-w-[min(400px,calc(100vw-2rem))] w-full p-0 rounded-lg bg-transparent border-none outline-none"
    >
      <div
        className={[
          'bg-surface rounded-lg p-5',
          'animate-dialog-in motion-reduce:animate-none',
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </dialog>
  )
}
