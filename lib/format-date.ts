import { localeToBcp47, type Locale } from "@/lib/i18n/config"

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
}

/** Locale-aware date label (e.g. order list, date filter chip). */
export function formatAppDate(
  date: Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS,
): string {
  return new Intl.DateTimeFormat(localeToBcp47(locale), options).format(date)
}

/** Month + year heading in calendars. */
export function formatAppMonthYear(date: Date, locale: Locale): string {
  return formatAppDate(date, locale, { month: "short", year: "numeric" })
}

/** Monday-first short weekday headers (Mon–Sun grid). */
export function getMondayFirstWeekdayLabels(
  locale: Locale,
  weekday: "short" | "narrow" = "short",
): string[] {
  const formatter = new Intl.DateTimeFormat(localeToBcp47(locale), { weekday })
  // 1 Jan 2024 is a Monday
  return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2024, 0, 1 + i)))
}
