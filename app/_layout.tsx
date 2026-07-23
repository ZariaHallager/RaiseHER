import { useAuth, ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import '../src/i18n'

// ---------------------------------------------------------------------------
// Env var validation — fail loudly at startup rather than silently at runtime
// ---------------------------------------------------------------------------
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
if (!clerkPublishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. ' +
      'Copy .env.example to .env.local and fill in your Clerk publishable key.'
  )
}

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL
if (!convexUrl) {
  throw new Error(
    'Missing EXPO_PUBLIC_CONVEX_URL. ' +
      'Run `npx convex dev` to provision a deployment and get this value.'
  )
}

// ---------------------------------------------------------------------------
// Singleton Convex client (module-level — never recreated on re-renders)
// ---------------------------------------------------------------------------
const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
})

// ---------------------------------------------------------------------------
// Root layout
//   Provider order: Clerk -> Convex (auth JWT via Clerk) -> SafeArea -> Stack
// ---------------------------------------------------------------------------
export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey!} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
