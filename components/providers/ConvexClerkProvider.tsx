'use client'

/**
 * ConvexClerkProvider
 *
 * Client component that wires Convex to Clerk so that every Convex query,
 * mutation, and action is sent with the authenticated user's JWT.
 *
 * Uses ConvexProviderWithClerk from @clerk/nextjs instead of a plain
 * ConvexProvider, which would silently drop auth tokens.
 *
 * Place this inside <ClerkProvider> (already set in app/[locale]/layout.tsx)
 * so useAuth() is available when this component mounts.
 */
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useAuth } from '@clerk/nextjs'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function ConvexClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}
