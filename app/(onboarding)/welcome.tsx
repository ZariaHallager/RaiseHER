/**
 * Welcome screen — first screen in onboarding carousel.
 * No microphone permission requested here (store readiness requirement).
 */
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function WelcomeScreen() {
  const router = useRouter()
  const { t } = useTranslation('onboarding')

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('welcome_title')}</Text>
        <Text style={styles.subtitle}>{t('welcome_subtitle')}</Text>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.btn} onPress={() => router.push('/(onboarding)/language')}>
          <Text style={styles.btnText}>{t('continue', { ns: 'common' })}</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => router.push('/(onboarding)/sign-in')}
        >
          <Text style={styles.btnTextSecondary}>{t('sign_in')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  content: { flex: 1, justifyContent: 'center', padding: 32 },
  title: { fontSize: 36, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },
  subtitle: { fontSize: 18, color: '#444', lineHeight: 26 },
  footer: { padding: 24, gap: 12 },
  btn: { backgroundColor: '#1A1A1A', padding: 18, borderRadius: 16, alignItems: 'center' },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#1A1A1A' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnTextSecondary: { color: '#1A1A1A', fontSize: 16, fontWeight: '600' },
})
