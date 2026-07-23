/** Rehearsal screen — Builder Two placeholder */
import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
export default function RehearsalScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Rehearsal</Text>
        <Text style={styles.sub}>Coming soon — salary negotiation rehearsal.</Text>
      </View>
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  content: { flex: 1, padding: 24 },
  heading: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  sub: { fontSize: 16, color: '#666' },
})
