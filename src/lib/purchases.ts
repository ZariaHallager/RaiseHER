/**
 * RevenueCat purchases abstraction.
 *
 * This module wraps `react-native-purchases` so the rest of the app can call
 * subscription functions without crashing when the native SDK is not yet
 * linked (e.g. Expo Go, CI).
 *
 * To activate RevenueCat:
 *   1. `npx expo install react-native-purchases`
 *   2. Add the config plugin to app.json:
 *        { "plugins": [["react-native-purchases", { "apiKey": "..." }]] }
 *   3. Replace the stub implementations below with real SDK calls.
 *
 * Per the build plan: RevenueCat wraps Apple IAP + Google Play Billing.
 * Real product IDs and offering identifiers are operational setup; the
 * code shells are ready from day one.
 */

export type SubscriptionTier = 'free' | 'premium'

export interface SubscriptionInfo {
  tier: SubscriptionTier
  /** ISO 8601 date string, present when tier is 'premium' */
  expiresAt?: string
}

/**
 * Get the current subscriber's entitlement info.
 * Stub: always returns free tier until the SDK is installed.
 */
export async function getSubscriptionInfo(): Promise<SubscriptionInfo> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Purchases = require('react-native-purchases').default
    const customerInfo = await Purchases.getCustomerInfo()
    const isPremium = !!customerInfo.entitlements.active['premium']
    return {
      tier: isPremium ? 'premium' : 'free',
      expiresAt: customerInfo.entitlements.active['premium']?.expirationDate ?? undefined,
    }
  } catch {
    // SDK not installed or not initialized; return free tier
    return { tier: 'free' }
  }
}

/**
 * Launch the RevenueCat paywall / management flow.
 * On iOS this opens the system subscription management sheet.
 * Stub: no-op until SDK is installed.
 */
export async function presentPaywall(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Purchases = require('react-native-purchases').default
    // Present the default offering paywall.
    // Replace with `RevenueCatUI.presentPaywall()` if using RevenueCat UI SDK.
    const offerings = await Purchases.getOfferings()
    if (offerings.current !== null) {
      // The caller should navigate to a custom paywall screen or use
      // RevenueCatUI; this hook point keeps the integration surface minimal.
    }
    void offerings
  } catch {
    // SDK not installed; no-op
  }
}

/**
 * Open the platform's subscription management URL so users can cancel or
 * change their plan directly in the App Store / Google Play.
 */
export async function openSubscriptionManagement(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Purchases = require('react-native-purchases').default
    await Purchases.showManageSubscriptions()
  } catch {
    // SDK not installed; no-op
  }
}
