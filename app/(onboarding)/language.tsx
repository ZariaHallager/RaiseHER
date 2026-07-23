/**
 * Language selection screen — shown before account creation.
 * User's choice is persisted to i18n and later to users.preferredLanguage.
 */
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SUPPORTED_LOCALES, SupportedLocale } from '../../src/i18n'
import i18n from '../../src/i18n'

const LANGUAGE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Espanol',
  fr: 'Francais',
  pt: 'Portugues',
}

export default function LanguageScreen() {
  const router = useRouter()
  const { t, i18n: i18nInstance } = useTranslation('onboarding')
  const currentLocale = i18nInstance.language as SupportedLocale

  const handleSelect = async (locale: SupportedLocale) => {
    await i18n.changeLanguage(locale)
    router.push('/(onboarding)/sign-up')
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('choose_language')}</Text>
        <FlatList
          data={[...SUPPORTED_LOCALES]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, item === currentLocale && styles.rowSelected]}
              onPress={() => handleSelect(item)}
            >
              <Text style={[styles.rowText, item === currentLocale && styles.rowTextSelected]}>
                {LANGUAGE_LABELS[item]}
              </Text>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          style={styles.list}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0EB' },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A', marginBottom: 24 },
  list: { flex: 1 },
  row: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  rowSelected: { borderColor: '#1A1A1A' },
  rowText: { fontSize: 18, color: '#444', fontWeight: '500' },
  rowTextSelected: { color: '#1A1A1A', fontWeight: '700' },
  separator: { height: 8 },
})
