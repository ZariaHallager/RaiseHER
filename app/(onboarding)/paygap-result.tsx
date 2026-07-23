/**
 * Pay Gap result screen — displays AI-generated analysis.
 * Hands off to quick-start -> Scenario (Builder Two seam).
 */
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function PaygapResultScreen() {
  const router = useRouter()
  const { t } = useTranslation('onboarding')
  const { t: tp } = useTranslation('paygap')

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t('result_title')}</Text>
        <Text style={styles.source}>{t('result_subtitle')}</Text>

        {/* TODO: display real payGapProfile data from Convex */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{tp('gap_label')}</Text>
          <Text style={styles.cardValue}>--</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{tp('benchmark_label')}</Text>
          <Text style={styles.cardValue}>--</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{tp('potential_label')}</Text>
          <Text style={styles.cardValue}>--</Text>
        </View>

        <Text style={styles.sourceNote}>{tp('gap_source')}</Text>

        {/* Quick-start -> handoff to Builder Two Scenario intake */}
        <Pressable style={styles.btn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.btnText}>{t('quick_start')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  scroll: { padding: 24, gap: 16, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  source: { fontSize: 14, color: '#888' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  cardLabel: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 6 },
  cardValue: { fontSize: 32, fontWeight: '800', color: '#1A1A1A' },
  sourceNote: { fontSize: 12, color: '#aaa', marginTop: 8 },
  btn: { backgroundColor: '#1A1A1A', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
