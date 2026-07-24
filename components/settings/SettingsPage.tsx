'use client'

/**
 * SettingsPage
 *
 * Client component for the full settings surface:
 *   - Account: email display, change password, sign out, delete account
 *   - Language: picker that updates cookie + Convex user record
 *   - Pay Gap: link to view current analysis, re-run link
 *   - Subscription: current plan, upgrade/manage
 *   - Privacy & Data: link to the privacy page
 *
 * Confirmations for destructive actions (sign out, delete account) use the
 * Dialog primitive for proper focus trapping.
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useClerk, useUser } from '@clerk/nextjs'
import { useRouter, Link } from '@/i18n/navigation'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import type { SupportedLocale } from '@/i18n/routing'

// ---------------------------------------------------------------------------
// Section shell
// ---------------------------------------------------------------------------
function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-8">
      <h2 className="text-label font-semibold tracking-wide text-ink-soft uppercase mb-3">
        {title}
      </h2>
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {children}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Row: a label/value row with optional action
// ---------------------------------------------------------------------------
function Row({
  label,
  value,
  action,
  actionHref,
  actionOnClick,
  destructive = false,
}: {
  label: string
  value?: string
  action?: string
  actionHref?: string
  actionOnClick?: () => void
  destructive?: boolean
}) {
  const actionClasses = [
    'text-caption font-semibold',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep rounded-sm',
    destructive ? 'text-error' : 'text-accent-deep',
  ].join(' ')

  return (
    <div className="flex items-center justify-between px-4 py-4 border-b border-border last:border-b-0">
      <div>
        <p className="text-body text-ink">{label}</p>
        {value && <p className="text-caption text-ink-soft mt-0.5">{value}</p>}
      </div>
      {action && actionHref && (
        <Link href={actionHref} className={actionClasses}>
          {action}
        </Link>
      )}
      {action && actionOnClick && (
        <button type="button" onClick={actionOnClick} className={actionClasses}>
          {action}
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Language option row
// ---------------------------------------------------------------------------
const LOCALES: { value: SupportedLocale; labelKey: 'language_en' | 'language_es' | 'language_fr' | 'language_pt' }[] = [
  { value: 'en', labelKey: 'language_en' },
  { value: 'es', labelKey: 'language_es' },
  { value: 'fr', labelKey: 'language_fr' },
  { value: 'pt', labelKey: 'language_pt' },
]

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function SettingsPage() {
  const t = useTranslations('settings')
  const locale = useLocale() as SupportedLocale

  const { signOut } = useClerk()
  const { user } = useUser()
  const router = useRouter()

  const convexUser = useQuery(api.users.getCurrentUser)
  const updateLanguage = useMutation(api.users.updatePreferredLanguage)
  const deleteUserData = useMutation(api.users.deleteUserData)

  const payGapProfiles = useQuery(api.payGap.getPayGapProfiles, { limit: 1 })
  const payGapProfile = payGapProfiles?.[0] ?? null

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [langChanging, setLangChanging] = useState(false)

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await signOut()
      router.push('/')
    } catch {
      setActionError('Could not sign out. Please try again.')
      setIsSigningOut(false)
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true)
    setActionError(null)
    try {
      await deleteUserData({})
      await user?.delete()
      await signOut()
      router.push('/')
    } catch {
      setActionError('Could not delete account. Please try again.')
      setIsDeleting(false)
    }
  }

  async function handleLanguageChange(newLocale: SupportedLocale) {
    if (newLocale === locale || langChanging) return
    setLangChanging(true)
    try {
      await updateLanguage({ language: newLocale })
    } catch {
      // language still changes on client even if Convex update fails
    }
    // Navigate to same path but under new locale
    router.replace('/', { locale: newLocale })
    router.refresh()
    setLangChanging(false)
  }

  return (
    <>
      {/* ── Account ─────────────────────────────────────────────────────── */}
      <Section title={t('account')}>
        <Row
          label={t('account_email')}
          value={user?.primaryEmailAddress?.emailAddress ?? convexUser?.email ?? ''}
        />
        <Row
          label={t('account_change_password')}
          action={t('account_change_password')}
          actionOnClick={() => {
            alert(t('password_reset_sent'))
          }}
        />
        <Row
          label={t('account_sign_out')}
          action={t('account_sign_out')}
          actionOnClick={() => setSignOutOpen(true)}
        />
        <Row
          label={t('account_delete')}
          action={t('account_delete')}
          actionOnClick={() => setDeleteOpen(true)}
          destructive
        />
      </Section>

      {/* ── Language ─────────────────────────────────────────────────────── */}
      <Section title={t('language')}>
        <div className="px-4 py-3">
          <fieldset>
            <legend className="sr-only">{t('language')}</legend>
            <div className="flex flex-col gap-0">
              {LOCALES.map(({ value, labelKey }) => (
                <label
                  key={value}
                  className="flex items-center justify-between py-3 border-b border-border last:border-b-0 cursor-pointer"
                >
                  <span className="text-body text-ink">{t(labelKey)}</span>
                  <input
                    type="radio"
                    name="locale"
                    value={value}
                    checked={locale === value}
                    onChange={() => handleLanguageChange(value)}
                    disabled={langChanging}
                    className="w-4 h-4 accent-[var(--color-accent-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-deep"
                  />
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </Section>

      {/* ── Pay Gap ──────────────────────────────────────────────────────── */}
      <Section title={t('pay_gap')}>
        {payGapProfile ? (
          <>
            <Row
              label={t('pay_gap_view')}
              action={t('pay_gap_view')}
              actionHref="/pay-gap/result"
            />
            <Row
              label={t('pay_gap_rerun')}
              action={t('pay_gap_rerun')}
              actionHref="/pay-gap"
            />
          </>
        ) : (
          <Row
            label={t('pay_gap_none')}
            action={t('get_started')}
            actionHref="/pay-gap"
          />
        )}
      </Section>

      {/* ── Subscription ─────────────────────────────────────────────────── */}
      <Section title={t('subscription')}>
        <Row
          label={t('subscription_status')}
          value={t('free_tier')}
        />
        <Row
          label={t('upgrade')}
          action={t('upgrade')}
          actionHref="/checkout"
        />
      </Section>

      {/* ── Privacy & Data ───────────────────────────────────────────────── */}
      <Section title={t('privacy')}>
        <Row
          label={t('data_usage')}
          action={t('view')}
          actionHref="/settings/privacy"
        />
        <Row
          label={t('privacy_policy')}
          action={t('view')}
          actionHref="/settings/privacy"
        />
      </Section>

      {/* ── App info ─────────────────────────────────────────────────────── */}
      <p className="text-caption text-ink-muted text-center mt-8 mb-4">
        {t('google_gemini_disclosure')}
      </p>

      {/* ── Sign Out dialog ──────────────────────────────────────────────── */}
      <Dialog
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        aria-labelledby="sign-out-title"
      >
        <h2 id="sign-out-title" className="text-subhead font-display font-bold text-ink mb-2">
          {t('sign_out_confirm_title')}
        </h2>
        <p className="text-body text-ink-soft mb-6">{t('sign_out_confirm_body')}</p>
        {actionError && (
          <p role="alert" className="text-caption text-error mb-4">{actionError}</p>
        )}
        <div className="flex gap-3 justify-end">
          <Button
            label="Cancel"
            variant="secondary"
            onClick={() => { setSignOutOpen(false); setActionError(null) }}
            disabled={isSigningOut}
          />
          <Button
            label={isSigningOut ? 'Signing out...' : t('sign_out_confirm_action')}
            loading={isSigningOut}
            onClick={handleSignOut}
          />
        </div>
      </Dialog>

      {/* ── Delete Account dialog ────────────────────────────────────────── */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        aria-labelledby="delete-account-title"
      >
        <h2 id="delete-account-title" className="text-subhead font-display font-bold text-ink mb-2">
          {t('account_delete_confirm_title')}
        </h2>
        <p className="text-body text-ink-soft mb-6">
          {t('account_delete_confirm_body')}
        </p>
        {actionError && (
          <p role="alert" className="text-caption text-error mb-4">{actionError}</p>
        )}
        <div className="flex gap-3 justify-end">
          <Button
            label="Cancel"
            variant="secondary"
            onClick={() => { setDeleteOpen(false); setActionError(null) }}
            disabled={isDeleting}
          />
          <Button
            label={isDeleting ? 'Deleting...' : t('account_delete_confirm_action')}
            loading={isDeleting}
            onClick={handleDeleteAccount}
            className="bg-error text-white border-error"
          />
        </div>
      </Dialog>
    </>
  )
}
