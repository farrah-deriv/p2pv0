import type { AdvertApiError } from "@/services/api/api-my-ads"

/** API rejection code for a new ad whose order range overlaps one of the user's own ads. */
export const RANGE_OVERLAP_ERROR_CODE = "AdvertOrderRangeOverlap"

/** The blocking ad, resolved from the server by id — enough to describe it to the user. */
export interface ConflictingAdvertRange {
  id: string
  minimumOrderAmount: number
  maximumOrderAmount: number
  currency: string
}

/**
 * Pull the `errors[]` payload off a rejected ad mutation. Covers both shapes the ad form
 * sees: the array the mutation hooks attach to the thrown error, and a nested response body.
 */
export function readAdvertApiErrors(error: unknown): AdvertApiError[] {
  if (!error || typeof error !== "object") return []

  const direct = (error as { errors?: unknown }).errors
  if (Array.isArray(direct)) return direct as AdvertApiError[]

  const nested = (error as { response?: { data?: { errors?: unknown } } }).response?.data?.errors
  if (Array.isArray(nested)) return nested as AdvertApiError[]

  return []
}

/** Coerce an id off the wire to a non-empty string, or null when it isn't usable. */
function normalizeAdvertId(rawId: unknown): string | null {
  if (typeof rawId === "number") {
    return Number.isFinite(rawId) ? String(rawId) : null
  }
  if (typeof rawId === "string" && rawId.trim() !== "") {
    return rawId.trim()
  }
  return null
}

/**
 * Id of the ad the backend says already occupies the requested range, or null when the
 * rejection is not an overlap or the payload omits it (older backends, generic 400s).
 * The server is the only source of truth here — the ad is never matched client-side.
 *
 * The API nests error specifics under `detail` — `{ status, code, detail: { existing_advert_id } }`
 * — so that level is read first. The flat `existing_advert_id` is kept as a fallback for any
 * caller that still sends it that way; reading only the flat one is what made this reader
 * return null on every real rejection.
 */
export function readExistingAdvertId(error: unknown): string | null {
  const overlap = readAdvertApiErrors(error).find(
    (entry) => entry?.code === RANGE_OVERLAP_ERROR_CODE,
  )
  if (!overlap) return null

  // `detail` comes off the network, so it is guarded rather than trusted to be an object.
  const detail = overlap.detail
  const nestedId = detail && typeof detail === "object" ? detail.existing_advert_id : undefined

  return normalizeAdvertId(nestedId) ?? normalizeAdvertId(overlap.existing_advert_id)
}

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Read the occupied range out of a `getAdvert` response. Returns null unless both limits and
 * the currency are present, so the caller can fall back to the generic dialog rather than
 * render a half-filled sentence or a dead link.
 */
export function readConflictingAdvertRange(
  advertId: string,
  advertResponse: unknown,
): ConflictingAdvertRange | null {
  if (!advertId) return null

  const data = (advertResponse as { data?: Record<string, unknown> } | null)?.data
  if (!data || typeof data !== "object") return null

  const minimumOrderAmount = toFiniteNumber(data.minimum_order_amount)
  const maximumOrderAmount = toFiniteNumber(data.maximum_order_amount)
  const currency = typeof data.account_currency === "string" ? data.account_currency : ""

  if (minimumOrderAmount === null || maximumOrderAmount === null || !currency) return null

  return { id: advertId, minimumOrderAmount, maximumOrderAmount, currency }
}
