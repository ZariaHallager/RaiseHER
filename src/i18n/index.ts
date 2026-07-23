/**
 * i18n configuration
 *
 * Static UI strings live in JSON resources here.
 * AI-generated content is produced natively in the user's target language
 * by passing `targetLanguage` to Convex actions (not post-translated).
 *
 * Supported locales at launch: en, es, fr, pt
 * RTL: deliberately deferred post-launch (documented limitation)
 */
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'

// Namespace imports — one JSON file per feature namespace per locale
import enCommon from './locales/en/common.json'
import enOnboarding from './locales/en/onboarding.json'
import enWins from './locales/en/wins.json'
import enPaygap from './locales/en/paygap.json'
import enSettings from './locales/en/settings.json'

import esCommon from './locales/es/common.json'
import esOnboarding from './locales/es/onboarding.json'
import esWins from './locales/es/wins.json'
import esPaygap from './locales/es/paygap.json'
import esSettings from './locales/es/settings.json'

import frCommon from './locales/fr/common.json'
import frOnboarding from './locales/fr/onboarding.json'
import frWins from './locales/fr/wins.json'
import frPaygap from './locales/fr/paygap.json'
import frSettings from './locales/fr/settings.json'

import ptCommon from './locales/pt/common.json'
import ptOnboarding from './locales/pt/onboarding.json'
import ptWins from './locales/pt/wins.json'
import ptPaygap from './locales/pt/paygap.json'
import ptSettings from './locales/pt/settings.json'

// Detect device locale; fall back to 'en' if unsupported
const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en'
const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'pt'] as const
const initialLocale = SUPPORTED_LOCALES.includes(deviceLocale as (typeof SUPPORTED_LOCALES)[number])
  ? deviceLocale
  : 'en'

i18next.use(initReactI18next).init({
  lng: initialLocale,
  fallbackLng: 'en',
  ns: ['common', 'onboarding', 'wins', 'paygap', 'settings'],
  defaultNS: 'common',
  resources: {
    en: {
      common: enCommon,
      onboarding: enOnboarding,
      wins: enWins,
      paygap: enPaygap,
      settings: enSettings,
    },
    es: {
      common: esCommon,
      onboarding: esOnboarding,
      wins: esWins,
      paygap: esPaygap,
      settings: esSettings,
    },
    fr: {
      common: frCommon,
      onboarding: frOnboarding,
      wins: frWins,
      paygap: frPaygap,
      settings: frSettings,
    },
    pt: {
      common: ptCommon,
      onboarding: ptOnboarding,
      wins: ptWins,
      paygap: ptPaygap,
      settings: ptSettings,
    },
  },
  interpolation: {
    escapeValue: false, // React Native handles XSS natively
  },
})

export default i18next
export { SUPPORTED_LOCALES }
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
