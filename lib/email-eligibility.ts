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

export const P2P_EMAIL_REQUIRED_ERROR = "P2P_EMAIL_REQUIRED"
