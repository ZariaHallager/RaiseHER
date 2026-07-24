/**
 * next-intl server-side request configuration.
 *
 * Loaded once per request by the next-intl plugin.  Returns the active
 * locale (resolved by the middleware from cookie / Accept-Language / prefix)
 * together with the matching message bundle.
 *
 * Message files live in /messages/{locale}.json, each containing all eight
 * namespaces nested under their namespace key (e.g. messages.common.save).
 */
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale is the locale resolved by the middleware from the URL
  // prefix, cookie, or Accept-Language header.
  let locale = await requestLocale

  // Ensure the locale is one we support; fall back to the default.
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // next-intl 4: timeZone and now can be set here for consistent SSR formatting.
    timeZone: 'UTC',
  }
})
