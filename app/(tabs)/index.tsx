/**
 * Today / Home screen
 * Shows: total raised today, recent wins summary, AI mark badge.
 */
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function TodayScreen() {
  const { t } = useTranslation('common')

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>{t('today')}</Text>
        {/* TODO: Wire up wins summary + pay gap data from Convex */}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  content: { flex: 1, padding: 24 },
  heading: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
})
