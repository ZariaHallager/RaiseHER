'use client'

import { useState, useTransition } from 'react'
import { startCheckout } from './actions'

const PRODUCTS = [
  {
    id: 'season_pass' as const,
    name: 'Season Pass',
    tagline: 'Full individual access for one year',
    features: [
      'Personalized pay gap analysis',
      'Unlimited wins ledger entries',
      'AI-powered negotiation coaching',
      'Priority customer support',
    ],
  },
  {
    id: 'teams_pilot' as const,
    name: 'Teams Pilot',
    tagline: 'RaiseHER for your organization',
    features: [
      'Up to 25 team members',
      'Aggregate pay gap reporting',
      'Custom onboarding session',
      'Dedicated account manager',
    ],
  },
]

export default function CheckoutForm() {
  const [selected, setSelected] = useState<'season_pass' | 'teams_pilot'>('season_pass')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await startCheckout(selected)
      if (result.error) {
        setError(result.error)
      }
    })
  }

  return (
    <main id="main-content" style={styles.main}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.wordmark}>RaiseHER</div>
          <h1 style={styles.headline}>Choose your plan</h1>
          <p style={styles.subhead}>Secure checkout powered by Stripe. Cancel anytime.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.cardGrid}>
            {PRODUCTS.map((product) => {
              const isSelected = selected === product.id
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelected(product.id)}
                  style={{
                    ...styles.card,
                    ...(isSelected ? styles.cardSelected : {}),
                  }}
                  aria-pressed={isSelected}
                >
                  <div style={styles.cardHeader}>
                    <div style={styles.radioRow}>
                      <div
                        style={{
                          ...styles.radio,
                          ...(isSelected ? styles.radioSelected : {}),
                        }}
                        aria-hidden="true"
                      >
                        {isSelected && <div style={styles.radioDot} />}
                      </div>
                      <span style={styles.productName}>{product.name}</span>
                    </div>
                    <p style={styles.tagline}>{product.tagline}</p>
                  </div>
                  <ul style={styles.featureList}>
                    {product.features.map((f) => (
                      <li key={f} style={styles.featureItem}>
                        <span style={styles.checkmark} aria-hidden="true">
                          +
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              )
            })}
          </div>

          {error && (
            <p role="alert" style={styles.errorText}>
              {error}
            </p>
          )}

          <button type="submit" disabled={isPending} style={styles.ctaButton}>
            {isPending ? 'Redirecting...' : 'Continue to payment'}
          </button>
        </form>

        <p style={styles.trustText}>
          Payments processed by Stripe. Your card details are never stored on our servers.
        </p>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 64,
    paddingBottom: 64,
    paddingLeft: 16,
    paddingRight: 16,
    background: 'var(--canvas)',
  },
  container: {
    width: '100%',
    maxWidth: 680,
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  wordmark: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--ink-muted)',
    marginBottom: 8,
  },
  headline: {
    fontSize: 30,
    fontWeight: 700,
    lineHeight: 1.2,
    color: 'var(--ink)',
    letterSpacing: '-0.02em',
  },
  subhead: {
    fontSize: 15,
    color: 'var(--ink-soft)',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    background: 'var(--surface)',
    border: '2px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 24,
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    transition: 'border-color 0.15s, box-shadow 0.15s',
    appearance: 'none',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: 'inherit',
  },
  cardSelected: {
    borderColor: 'var(--accent)',
    boxShadow: '0 0 0 3px var(--accent-light)',
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  radioRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: '2px solid var(--border-strong)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'border-color 0.15s',
  },
  radioSelected: {
    borderColor: 'var(--accent)',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: 'var(--accent)',
  },
  productName: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--ink)',
  },
  tagline: {
    fontSize: 13,
    color: 'var(--ink-muted)',
    paddingLeft: 30,
  },
  featureList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    color: 'var(--ink-soft)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkmark: {
    color: 'var(--accent)',
    fontWeight: 700,
    flexShrink: 0,
    lineHeight: 1.4,
  },
  errorText: {
    fontSize: 14,
    color: 'var(--error)',
    background: 'var(--error-light)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    marginBottom: 16,
  },
  ctaButton: {
    width: '100%',
    background: 'var(--accent)',
    color: 'var(--on-accent)',
    border: 'none',
    borderRadius: 'var(--radius-lg)',
    padding: '16px 24px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.01em',
    transition: 'opacity 0.15s',
  },
  trustText: {
    fontSize: 12,
    color: 'var(--ink-muted)',
    textAlign: 'center' as const,
  },
}
