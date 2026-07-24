import Link from 'next/link'

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const params = await searchParams
  const sessionId = params.session_id

  return (
    <main id="main-content" style={styles.main}>
      <div style={styles.container}>
        <div style={styles.iconWrapper} aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="#DCFCE7" />
            <path
              d="M14 24l8 8 12-16"
              stroke="#15803D"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 style={styles.headline}>Payment confirmed</h1>
        <p style={styles.body}>
          Thank you for joining RaiseHER. You will receive a confirmation email shortly.
        </p>

        {sessionId && (
          <p style={styles.sessionId}>
            Reference:{' '}
            <code style={styles.code}>{sessionId.slice(0, 24)}...</code>
          </p>
        )}

        <div style={styles.actions}>
          <a href="https://raiseher.app" style={styles.primaryButton}>
            Open the app
          </a>
          <Link href="/checkout" style={styles.secondaryLink}>
            Back to plans
          </Link>
        </div>

        <p style={styles.supportText}>
          Questions? Email{' '}
          <a href="mailto:hello@raiseher.app">hello@raiseher.app</a>
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
  sessionId: {
    fontSize: 12,
    color: 'var(--ink-muted)',
    marginTop: 4,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 11,
    background: 'var(--surface-subtle)',
    padding: '2px 6px',
    borderRadius: 4,
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
  secondaryLink: {
    display: 'block',
    color: 'var(--ink-soft)',
    fontSize: 14,
    textAlign: 'center' as const,
  },
  supportText: {
    fontSize: 12,
    color: 'var(--ink-muted)',
    marginTop: 8,
  },
}
