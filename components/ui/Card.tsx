/**
 * Card primitive, web version.
 *
 * Flat surface container: no shadow, no glow, a single hairline border and
 * the large corner radius reserved for cards. Accepts any HTML div props so
 * callers can add role="article", aria-label, etc. as needed.
 *
 * Server component: no state or browser APIs.
 */
import { type HTMLAttributes, type Ref } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>
}

export function Card({ className, children, ref, ...props }: CardProps) {
  return (
    <div
      ref={ref}
      className={[
        'bg-surface border border-border rounded-lg p-5',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
