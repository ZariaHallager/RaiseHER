/**
 * Agent Ops Dashboard — founder-gated.
 * Live scrolling activity feed, per-agent counts, P&L tracker.
 * Styled to design system.
 */
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Redirect } from 'expo-router'
import { useQuery } from 'convex/react'
import { useUser } from '@clerk/clerk-expo'
// import { api } from '../../../convex/_generated/api'

export default function AgentDashboardScreen() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) return <ActivityIndicator style={{ flex: 1 }} />

  // Founder gate — isFounder flag set via Convex users table
  // TODO: replace with real Convex query once provisioned
  const isFounder = (user?.publicMetadata as { isFounder?: boolean })?.isFounder === true
  if (!isFounder) {
    return <Redirect href="/(tabs)" />
  }

  // TODO: const activity = useQuery(api.agentActivityLog.recentActivity, {})
  // TODO: const counts = useQuery(api.agentActivityLog.agentCounts, {})

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agent Ops</Text>
        <Text style={styles.subtitle}>Live activity feed</Text>
      </View>

      {/* Activity feed placeholder */}
      <FlatList
        data={[]}
        keyExtractor={(item) => String(item)}
        renderItem={() => null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No agent activity yet. Agents run on cron schedule.</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  header: { padding: 24, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  list: { padding: 24 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { color: '#aaa', fontSize: 15, textAlign: 'center' },
})
