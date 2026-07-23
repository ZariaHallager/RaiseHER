/**
 * Locale-aware currency / number formatting via Intl.NumberFormat.
 *
 * Per design system: hoist Intl object creation (don't create per-render).
 * Formatters are memoized by locale+currency key.
 */

const formatterCache = new Map<string, Intl.NumberFormat>()

function getFormatter(locale: string, currency: string): Intl.NumberFormat {
  const key = `${locale}:${currency}`
  if (!formatterCache.has(key)) {
    formatterCache.set(
      key,
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    )
  }
  return formatterCache.get(key)!
}

/**
 * Format a monetary amount for display.
 * @param amount  - Raw number (e.g. 85000)
 * @param currency - ISO 4217 code (e.g. 'USD', 'EUR', 'BRL')
 * @param locale   - BCP 47 locale tag (e.g. 'en', 'es', 'fr', 'pt')
 */
export function formatCurrency(amount: number, currency: string, locale: string): string {
  try {
    return getFormatter(locale, currency).format(amount)
  } catch {
    // Fallback for unsupported locale/currency combinations
    return `${currency} ${amount.toLocaleString()}`
  }
}

/**
 * Format a percentage gap value for display.
 */
export function formatPercent(value: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100)
  } catch {
    return `${value.toFixed(1)}%`
  }
}
