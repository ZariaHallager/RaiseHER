/**
 * Wins Ledger screen — placeholder until Builder One feature sprint.
 */
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function WinsScreen() {
  const { t } = useTranslation('wins')
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>{t('title')}</Text>
        <Text style={styles.empty}>{t('empty_state')}</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  content: { flex: 1, padding: 24 },
  heading: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  empty: { fontSize: 16, color: '#666' },
})
