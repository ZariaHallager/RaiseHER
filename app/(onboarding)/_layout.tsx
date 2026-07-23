/**
 * Onboarding flow layout.
 * Redirects signed-in users away from onboarding.
 */
import { Redirect } from 'expo-router'
import { Stack } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'

export default function OnboardingLayout() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) return null

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
