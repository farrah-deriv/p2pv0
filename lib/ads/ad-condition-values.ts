/** Supported chip values for optional ad conditions on create/edit step 3. */
export const AD_JOINED_DAYS_OPTIONS = [15, 30, 60] as const

export const AD_COMPLETION_RATE_OPTIONS = [50, 70, 90] as const

/** API field for minimum account age (create/update payload and responses). */
export const MINIMUM_JOIN_DAYS_API_KEY = "minimum_join_days"

/** Legacy response key kept for backwards-compatible reads. */
export const MINIMUM_JOINED_DAYS_LEGACY_API_KEY = "minimum_joined_days"

const RESTRICTED_TRADE_BANDS = new Set(["silver", "gold", "diamond"])

/** Reads joined-days from BE responses that may use either key name. */
export function readMinimumJoinDaysFromApi(
  data: Record<string, unknown>,
): number | null | undefined {
  const value = data[MINIMUM_JOIN_DAYS_API_KEY] ?? data[MINIMUM_JOINED_DAYS_LEGACY_API_KEY]
  if (value == null) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

/** Maps BE "no restriction" values to `null` so the **Any** chip is selected. */
export function normalizeMinimumJoinedDaysFromApi(value: number | null | undefined): number | null {
  if (value == null || value <= 0) return null
  return value
}

/** Maps BE "no restriction" values to `null` so the **Any** chip is selected. */
export function normalizeMinimumCompletionRateFromApi(
  value: number | null | undefined,
): number | null {
  if (value == null || value <= 0) return null
  return value
}

/** Whether the API band is a legacy restricted tier (silver/gold/diamond). */
export function isRestrictedTradeBand(band: string | null | undefined): boolean {
  return band != null && RESTRICTED_TRADE_BANDS.has(band)
}

/** Edit prefill: legacy tier thresholds (e.g. 45 days, 80%) are not chip options. */
export function normalizeMinimumJoinedDaysForEditPrefill(
  value: number | null | undefined,
  minimumTradeBand?: string | null,
): number | null {
  if (isRestrictedTradeBand(minimumTradeBand)) return null
  const normalized = normalizeMinimumJoinedDaysFromApi(value)
  if (normalized != null && !AD_JOINED_DAYS_OPTIONS.includes(normalized as (typeof AD_JOINED_DAYS_OPTIONS)[number])) {
    return null
  }
  return normalized
}

/** Edit prefill: legacy tier thresholds are not chip options — default to Any. */
export function normalizeMinimumCompletionRateForEditPrefill(
  value: number | null | undefined,
  minimumTradeBand?: string | null,
): number | null {
  if (isRestrictedTradeBand(minimumTradeBand)) return null
  const normalized = normalizeMinimumCompletionRateFromApi(value)
  if (
    normalized != null &&
    !AD_COMPLETION_RATE_OPTIONS.includes(normalized as (typeof AD_COMPLETION_RATE_OPTIONS)[number])
  ) {
    return null
  }
  return normalized
}

export function isJoinedDaysAny(days: number | null | undefined): boolean {
  return days == null
}

export function isCompletionRateAny(rate: number | null | undefined): boolean {
  return rate == null
}

/** Edit PATCH: BE treats `0` as **Any**; `null` omits the field and leaves the old value. */
export function minimumJoinedDaysForEditPatch(value: number | null | undefined): number {
  return value ?? 0
}

/** Edit PATCH: BE treats `0` as **Any**; `null` omits the field and leaves the old value. */
export function minimumCompletionRateForEditPatch(value: number | null | undefined): number {
  return value ?? 0
}
