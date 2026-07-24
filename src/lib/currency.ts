/**
 * Locale-aware currency / number formatting via Intl.NumberFormat.
 *
 * Per design system: hoist Intl object creation (never create per-render).
 * All formatters are memoized by a composite key so the same object is reused
 * across calls with identical parameters.
 */

// ---------------------------------------------------------------------------
// Formatter cache
// ---------------------------------------------------------------------------
const formatterCache = new Map<string, Intl.NumberFormat>()

function getCurrencyFormatter(locale: string, currency: string): Intl.NumberFormat {
  const key = `currency:${locale}:${currency}`
  if (!formatterCache.has(key)) {
    formatterCache.set(
      key,
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    )
  }
  return formatterCache.get(key)!
}

function getPercentFormatter(locale: string): Intl.NumberFormat {
  const key = `percent:${locale}`
  if (!formatterCache.has(key)) {
    formatterCache.set(
      key,
      new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    )
  }
  return formatterCache.get(key)!
}

function getCompactFormatter(locale: string): Intl.NumberFormat {
  const key = `compact:${locale}`
  if (!formatterCache.has(key)) {
    formatterCache.set(
      key,
      new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
    )
  }
  return formatterCache.get(key)!
}

function getDecimalFormatter(locale: string, fractionDigits: number): Intl.NumberFormat {
  const key = `decimal:${locale}:${fractionDigits}`
  if (!formatterCache.has(key)) {
    formatterCache.set(
      key,
      new Intl.NumberFormat(locale, {
        style: 'decimal',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }),
    )
  }
  return formatterCache.get(key)!
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Format a monetary amount for display.
 *
 * @param amount   - Raw number (e.g. 85000)
 * @param currency - ISO 4217 code (e.g. 'USD', 'EUR', 'BRL')
 * @param locale   - BCP 47 locale tag (e.g. 'en', 'es', 'fr', 'pt')
 */
export function formatCurrency(amount: number, currency: string, locale: string): string {
  try {
    return getCurrencyFormatter(locale, currency).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

/**
 * Format a percentage gap value for display.
 * Pass the raw percentage value (e.g. 18.5 for 18.5%, NOT 0.185).
 */
export function formatPercent(value: number, locale: string): string {
  try {
    return getPercentFormatter(locale).format(value / 100)
  } catch {
    return `${value.toFixed(1)}%`
  }
}

/**
 * Format a large number in compact notation (e.g. 85000 -> "85K").
 * Useful for the "Total Raised" and "Annual Potential" displays.
 */
export function formatCompact(value: number, locale: string): string {
  try {
    return getCompactFormatter(locale).format(value)
  } catch {
    return value.toLocaleString()
  }
}

/**
 * Format a plain decimal number with the given number of fraction digits,
 * using locale-aware grouping separators.
 */
export function formatNumber(value: number, locale: string, fractionDigits = 0): string {
  try {
    return getDecimalFormatter(locale, fractionDigits).format(value)
  } catch {
    return value.toFixed(fractionDigits)
  }
}
