/**
 * Pure duration-parsing logic, free of i18n dependencies and component state.
 * Components format the returned parts using their own translation function.
 */

export type DurationParts =
  | { kind: "invalid" }
  | { kind: "zero" }
  | { kind: "minutes"; value: number }
  | { kind: "hours"; h: number; m: number }
  | { kind: "days"; d: number; h: number }

/**
 * Parse a raw minutes value (potentially fractional) into structured parts.
 *
 * - null / undefined → invalid (show "-")
 * - <= 0 after rounding → zero (show "0 mins")
 * - < 60 → minutes
 * - 60–1439 → hours + remaining minutes
 * - >= 1440 → days + remaining hours
 */
export function parseDurationMinutes(
  rawMinutes: number | null | undefined,
): DurationParts {
  if (rawMinutes == null) return { kind: "invalid" }

  const m = Math.round(rawMinutes)

  if (m <= 0) return { kind: "zero" }
  if (m < 60) return { kind: "minutes", value: m }

  const totalHours = Math.floor(m / 60)
  const remainingMins = m % 60

  if (totalHours >= 24) {
    const days = Math.floor(totalHours / 24)
    const remainingHours = totalHours % 24
    return { kind: "days", d: days, h: remainingHours }
  }

  return { kind: "hours", h: totalHours, m: remainingMins }
}
