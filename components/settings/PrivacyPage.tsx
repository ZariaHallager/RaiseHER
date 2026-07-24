'use client'

/**
 * PrivacyPage
 *
 * Client component rendered at the bottom of the Privacy & Data page.
 * Owns the data deletion request flow with a confirmation dialog.
 *
 * After the user confirms:
 *   1. Delete all user-owned Convex data via deleteUserData mutation.
 *   2. Delete the Clerk user record.
 *   3. Sign out and redirect to home.
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useClerk, useUser } from '@clerk/nextjs'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'

export function PrivacyPage() {
  const t = useTranslations('settings')
  const { signOut } = useClerk()
  const { user } = useUser()
  const router = useRouter()
  const deleteUserData = useMutation(api.users.deleteUserData)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)
    try {
      await deleteUserData({})
      await user?.delete()
      await signOut()
      router.push('/')
    } catch {
      setError('Something went wrong. Please contact support if this continues.')
      setIsDeleting(false)
    }
  }

  return (
    <div className="border-t border-border pt-6">
      <Button
        label={t('data_delete_request')}
        variant="secondary"
        onClick={() => setConfirmOpen(true)}
        className="border-error text-error hover:bg-error-light"
      />

      <Dialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setError(null) }}
        aria-labelledby="data-delete-title"
      >
        <h2 id="data-delete-title" className="text-subhead font-display font-bold text-ink mb-2">
          {t('data_delete_confirm_title')}
        </h2>
        <p className="text-body text-ink-soft mb-6">
          {t('data_delete_confirm_body')}
        </p>
        {error && (
          <p role="alert" className="text-caption text-error mb-4">{error}</p>
        )}
        <div className="flex gap-3 justify-end">
          <Button
            label="Cancel"
            variant="secondary"
            onClick={() => { setConfirmOpen(false); setError(null) }}
            disabled={isDeleting}
          />
          <Button
            label={isDeleting ? 'Submitting...' : t('data_delete_confirm_action')}
            loading={isDeleting}
            onClick={handleDelete}
            className="bg-error text-white"
          />
        </div>
      </Dialog>
    </div>
  )
}
