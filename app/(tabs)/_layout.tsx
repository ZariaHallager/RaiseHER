/**
 * Authenticated tabs layout.
 * Protected: redirects to onboarding if the user is not signed in.
 */
import { Redirect } from 'expo-router'
import { Tabs } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'

export default function TabsLayout() {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) return null

  if (!isSignedIn) {
    return <Redirect href="/(onboarding)/welcome" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          // Design system tab bar — custom styling applied in design-system/theme.ts
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          // TODO: replace with custom geometric icon from design system
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="wins/index"
        options={{
          title: 'Wins',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="rehearsal/index"
        options={{
          title: 'Rehearsal',
          tabBarIcon: () => null,
          // Builder Two feature — accessible but placeholder content
        }}
      />
      <Tabs.Screen
        name="casefiles/index"
        options={{
          title: 'Case Files',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  )
}
