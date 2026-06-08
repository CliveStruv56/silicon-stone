/**
 * Shared date formatting. Replaces eight near-duplicate local `formatDate`
 * helpers. Named styles preserve each call site's previous output exactly, so
 * consolidating here changes no rendered dates.
 */
export type DateStyle = 'long' | 'medium' | 'short' | 'gb'

const DATE_STYLES: Record<DateStyle, { locale: string; options: Intl.DateTimeFormatOptions }> = {
  // "June 8, 2026" — article detail page
  long: { locale: 'en-US', options: { month: 'long', day: 'numeric', year: 'numeric' } },
  // "Jun 8, 2026" — list/card surfaces
  medium: { locale: 'en-US', options: { month: 'short', day: 'numeric', year: 'numeric' } },
  // "Jun 8" — compact briefings row
  short: { locale: 'en-US', options: { month: 'short', day: 'numeric' } },
  // "8 Jun 2026" — UK-format surfaces
  gb: { locale: 'en-GB', options: { day: 'numeric', month: 'short', year: 'numeric' } },
}

export function formatDate(dateString: string, style: DateStyle = 'medium'): string {
  if (!dateString) return ''
  const { locale, options } = DATE_STYLES[style]
  return new Date(dateString).toLocaleDateString(locale, options)
}
