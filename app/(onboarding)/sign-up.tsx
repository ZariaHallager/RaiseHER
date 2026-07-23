/**
 * Sign-up screen — Google and Apple social sign-in via Clerk SSO.
 * Uses useSSO (replaces useOAuth in @clerk/expo v3+).
 */
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native'
import { useSSO } from '@clerk/clerk-expo'
import * as WebBrowser from 'expo-web-browser'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'

// Required for OAuth session completion on iOS
WebBrowser.maybeCompleteAuthSession()

export default function SignUpScreen() {
  const { startSSOFlow } = useSSO()
  const router = useRouter()
  const { t } = useTranslation('onboarding')

  const handleOAuth = async (strategy: 'oauth_google' | 'oauth_apple') => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: 'raiseher://oauth-callback',
      })
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
        router.replace('/(onboarding)/paygap-intake')
      }
    } catch (err) {
      Alert.alert('Sign in error', String(err))
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('sign_up')}</Text>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.btn} onPress={() => handleOAuth('oauth_google')}>
          <Text style={styles.btnText}>{t('google_sign_in')}</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnApple]} onPress={() => handleOAuth('oauth_apple')}>
          <Text style={styles.btnText}>{t('apple_sign_in')}</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(onboarding)/sign-in')}>
          <Text style={styles.link}>{t('sign_in')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  content: { flex: 1, justifyContent: 'center', padding: 32 },
  title: { fontSize: 32, fontWeight: '800', color: '#1A1A1A' },
  footer: { padding: 24, gap: 12 },
  btn: { backgroundColor: '#1A1A1A', padding: 18, borderRadius: 16, alignItems: 'center' },
  btnApple: { backgroundColor: '#222' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', color: '#444', fontSize: 15, paddingVertical: 8 },
})
