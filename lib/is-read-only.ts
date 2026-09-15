// Single source of truth for "this account is read-only".
//
// A read-only account can still view its existing P2P data but the backend
// rejects any state-changing action with the `UserReadOnly` error code (see
// lib/orders/order-error-mapper.ts). The account state is surfaced on the
// `/users/me` payload as `status: "read_only"` and stored on
// `userData.status`. Centralising the check keeps the string in one place and
// lets callers proactively disable actions instead of letting them fail.

/** Backend error code returned when a read-only account attempts a mutation. */
export const USER_READ_ONLY_ERROR_CODE = "UserReadOnly"

/** `userData.status` value for a read-only account. */
export const READ_ONLY_STATUS = "read_only"

export function isReadOnlyStatus(status: string | null | undefined): boolean {
  return typeof status === "string" && status.toLowerCase() === READ_ONLY_STATUS
}

/**
 * True when a failed API result or thrown error was rejected because the
 * account is read-only. Accepts `unknown` so it works both for typed API
 * results and for values caught in a `catch` block without a cast. Handles
 * both shapes used across P2P mutations: a flat `{ code }` (buy/sell toggles)
 * and `{ errors: [{ code }] }` (payment methods, ads, hide-ads).
 */
export function isUserReadOnlyResult(result: unknown): boolean {
  if (typeof result !== "object" || result === null) return false
  const { code, errors } = result as { code?: unknown; errors?: Array<{ code?: unknown }> }
  return (
    code === USER_READ_ONLY_ERROR_CODE ||
    errors?.[0]?.code === USER_READ_ONLY_ERROR_CODE
  )
}
