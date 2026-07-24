'use client'

import { useState, useTransition } from 'react'
import { startCheckout } from '../../checkout/actions'

type Product = 'season_pass' | 'teams_pilot'

type Props = {
  product: Product
  label: string
  redirectingLabel: string
  errorLabel: string
  className?: string
}

export function CheckoutButton({
  product,
  label,
  redirectingLabel,
  errorLabel,
  className = '',
}: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await startCheckout(product)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={[
          'inline-flex items-center justify-center',
          'font-bold text-body rounded-lg px-6 py-4 w-full',
          'transition-opacity disabled:opacity-60',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep',
          className,
        ].join(' ')}
      >
        {isPending ? redirectingLabel : label}
      </button>

      {error && (
        <p role="alert" className="text-caption text-error bg-error-light rounded-sm px-3 py-2">
          {errorLabel}
        </p>
      )}
    </div>
  )
}
