import Link from 'next/link'

export default function CancelPage() {
  return (
    <main id="main-content" style={styles.main}>
      <div style={styles.container}>
        <div style={styles.iconWrapper} aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#EDE8E2" />
            <path d="M16 24h16" stroke="#888888" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        <h1 style={styles.headline}>Payment cancelled</h1>
        <p style={styles.body}>
          No charge was made. You can return to the plans page whenever you are ready.
        </p>

        <div style={styles.actions}>
          <Link href="/checkout" style={styles.primaryButton}>
            Back to plans
          </Link>
        </div>

        <p style={styles.supportText}>
          Need help choosing?{' '}
          <a href="mailto:hello@raiseher.app">Contact us</a>
        </p>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: 'var(--canvas)',
  },
  container: {
    width: '100%',
    maxWidth: 480,
    background: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    padding: 48,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    textAlign: 'center',
  },
  iconWrapper: {
    marginBottom: 8,
  },
  headline: {
    fontSize: 26,
    fontWeight: 700,
    color: 'var(--ink)',
    letterSpacing: '-0.02em',
  },
  body: {
    fontSize: 15,
    color: 'var(--ink-soft)',
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  primaryButton: {
    display: 'block',
    background: 'var(--accent)',
    color: 'var(--on-accent)',
    borderRadius: 'var(--radius-lg)',
    padding: '14px 24px',
    fontSize: 15,
    fontWeight: 700,
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  supportText: {
    fontSize: 12,
    color: 'var(--ink-muted)',
    marginTop: 8,
  },
}
