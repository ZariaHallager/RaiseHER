/**
 * Pay Gap intake form — collects industry, role, experience, location, salary.
 * Submits to Convex action `generatePayGap` which calls Gemini.
 */
import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
// import { useMutation } from 'convex/react'
// import { api } from '../../convex/_generated/api'

export default function PaygapIntakeScreen() {
  const router = useRouter()
  const { t } = useTranslation('onboarding')

  const [industry, setIndustry] = useState('')
  const [role, setRole] = useState('')
  const [years, setYears] = useState('')
  const [location, setLocation] = useState('')
  const [salary, setSalary] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(false)

  // TODO: wire up Convex mutation when Convex is provisioned
  // const generatePayGap = useMutation(api.payGapProfiles.generate)

  const handleSubmit = async () => {
    if (!industry || !role || !years || !location || !salary) {
      Alert.alert('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      // TODO: await generatePayGap({ industry, role, yearsExperience: Number(years), location, currentSalary: Number(salary), currency })
      router.push('/(onboarding)/paygap-result')
    } catch (err) {
      Alert.alert('Error', String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('paygap_title')}</Text>
        <Text style={styles.subtitle}>{t('paygap_subtitle')}</Text>

        <Text style={styles.label}>{t('paygap_industry')}</Text>
        <TextInput style={styles.input} value={industry} onChangeText={setIndustry} />

        <Text style={styles.label}>{t('paygap_role')}</Text>
        <TextInput style={styles.input} value={role} onChangeText={setRole} />

        <Text style={styles.label}>{t('paygap_years')}</Text>
        <TextInput style={styles.input} value={years} onChangeText={setYears} keyboardType="numeric" />

        <Text style={styles.label}>{t('paygap_location')}</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} />

        <Text style={styles.label}>{t('paygap_salary')}</Text>
        <TextInput style={styles.input} value={salary} onChangeText={setSalary} keyboardType="numeric" />

        <Pressable style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.btnText}>
            {loading ? t('loading', { ns: 'common' }) : t('quick_start')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  scroll: { padding: 24, gap: 8, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 24, lineHeight: 22 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    marginTop: 6,
  },
  btn: {
    backgroundColor: '#1A1A1A',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
