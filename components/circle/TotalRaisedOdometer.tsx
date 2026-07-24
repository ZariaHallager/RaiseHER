'use client'

/**
 * TotalRaisedOdometer
 *
 * Animates a dollar figure from 0 (or its previous value) to a target.
 * Uses requestAnimationFrame with an ease-out curve.
 *
 * Accessibility:
 *   - The live region announces the final value once animation settles.
 *   - prefers-reduced-motion: skip the count-up, jump directly to the final
 *     value so no one is locked out of the information.
 */

import { useEffect, useRef, useState } from 'react'

interface Props {
  targetUsd: number
  /** Optional label for the sr-only live region. Defaults to "Total Raised". */
  label?: string
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Ease-out cubic: starts fast, decelerates to finish. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const DURATION_MS = 2000

export function TotalRaisedOdometer({ targetUsd, label = 'Total Raised' }: Props) {
  const [displayed, setDisplayed] = useState(0)
  const [settled, setSettled] = useState(false)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const startValueRef = useRef(0)

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) {
      setDisplayed(targetUsd)
      setSettled(true)
      return
    }

    startRef.current = null
    startValueRef.current = displayed
    setSettled(false)

    function tick(timestamp: number) {
      if (startRef.current === null) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / DURATION_MS, 1)
      const easedProgress = easeOut(progress)
      const current = Math.round(
        startValueRef.current + (targetUsd - startValueRef.current) * easedProgress,
      )
      setDisplayed(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplayed(targetUsd)
        setSettled(true)
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUsd])

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        aria-hidden="true"
        className="text-display font-display font-bold text-accent-deep tabular-nums"
      >
        {formatUsd(displayed)}
      </span>
      {/* Screen readers get the stable final value once animation settles */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {settled ? `${label}: ${formatUsd(targetUsd)}` : ''}
      </span>
    </div>
  )
}
