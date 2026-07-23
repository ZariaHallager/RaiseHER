/** Profile / Settings screen */
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@clerk/clerk-expo'
import { useTranslation } from 'react-i18next'
export default function ProfileScreen() {
  const { signOut } = useAuth()
  const { t } = useTranslation('settings')
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>{t('title')}</Text>
        <Pressable style={styles.btn} onPress={() => signOut()}>
          <Text style={styles.btnText}>{t('title', { ns: 'common', defaultValue: 'Sign Out' })}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  content: { flex: 1, padding: 24 },
  heading: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 24 },
  btn: { backgroundColor: '#1A1A1A', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
