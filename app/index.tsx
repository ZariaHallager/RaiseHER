/**
 * Root index — immediate redirect based on auth state.
 * Expo Router renders this before the tab/onboarding layouts mount.
 */
import { Redirect } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { ActivityIndicator, View } from 'react-native'

export default function RootIndex() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0EB' }}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    )
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />
  }

  return <Redirect href="/(onboarding)/welcome" />
}
