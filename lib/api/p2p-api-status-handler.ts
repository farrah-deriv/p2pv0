import { useP2PMaintenanceStore } from "@/stores/p2p-maintenance-store"
import { useUserCountryInvalidStore } from "@/stores/user-country-invalid-store"

/** Extracts the first P2P API error code from a response body, if present. */
export function extractP2PErrorCode(body: unknown): string | null {
  if (!body || typeof body !== "object") return null
  const errors = (body as { errors?: unknown }).errors
  if (!Array.isArray(errors) || errors.length === 0) return null
  const first = errors[0]
  if (!first || typeof first !== "object") return null
  const code = (first as { code?: unknown }).code
  return typeof code === "string" ? code : null
}

/**
 * Latches session-scoped P2P status flags from API error codes.
 * Cleared on logout or full page reload.
 */
export function handleP2PApiStatusCode(code: string | null | undefined): void {
  if (code === "P2PDisabled") {
    useP2PMaintenanceStore.getState().setApiMaintenanceActive(true)
  }
  if (code === "UserCountryInvalid") {
    useUserCountryInvalidStore.getState().setUserCountryInvalid(true)
  }
}
