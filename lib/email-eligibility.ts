import type { EmailEligibility } from "@/stores/user-data-store"

/** Normalizes `/v1/client/profile` email into a non-empty string or null. */
export function normalizeClientProfileEmail(email: unknown): string | null {
  if (typeof email !== "string") return null
  const trimmed = email.trim()
  return trimmed.length > 0 ? trimmed : null
}

/** Derives eligibility from a successful client-profile payload. */
export function emailEligibilityFromProfileEmail(email: unknown): EmailEligibility {
  return normalizeClientProfileEmail(email) ? "eligible" : "missing"
}

export function isEmailEligibleForP2P(eligibility: EmailEligibility): boolean {
  return eligibility === "eligible"
}

/** True when `/p2p/v1/users/me` resolved to an existing P2P profile id. */
export function isExistingP2PUser(userId: string | null | undefined): boolean {
  return typeof userId === "string" && userId.length > 0
}

/**
 * True only when `/p2p/v1/users/me` has positively answered "no P2P profile" —
 * `fetchUserIdAndStore()` stores `""` in that case, and `null` while it is still
 * in flight (the store hydrates asynchronously).
 *
 * Deliberately not `!isExistingP2PUser(userId)`: that is also true for `null`, and
 * treating "not known yet" as "no profile" makes a funded user flash a zero-state
 * before the store resolves. Use this to skip calls we know will fail, never to
 * decide that a user owns nothing.
 */
export function isKnownNonP2PUser(userId: string | null | undefined): boolean {
  return userId === ""
}

export const P2P_EMAIL_REQUIRED_ERROR = "P2P_EMAIL_REQUIRED"
