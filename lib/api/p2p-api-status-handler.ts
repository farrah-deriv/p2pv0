import { useP2PMaintenanceStore } from "@/stores/p2p-maintenance-store"
import { SchemaMismatchError } from "@/lib/api/schema-mismatch-error"
import type { ApiSchemaReporter } from "@/lib/api/schema-reporter"
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
 * Reports when an error response body matches neither of the two error
 * envelope shapes the app knows how to parse: singular `{"error": {...}}` or
 * plural `{"errors": [{...}]}`. Mirrors the mobile Dio interceptor's
 * `reportUnrecognizedErrorEnvelope`.
 *
 * Sanitized like `SchemaMismatchError` elsewhere: only the sorted top-level
 * key names (or the runtime type for a non-object body) are reported, never
 * the actual code/message values.
 */
export function reportUnrecognizedErrorEnvelope(
  reporter: ApiSchemaReporter,
  endpoint: string,
  body: unknown,
): void {
  if (!body || typeof body !== "object") {
    reporter.reportMismatch(
      new SchemaMismatchError({
        endpoint,
        field: "(error_envelope)",
        expected: "error{code,message}|errors[{code}]",
        actual: body === null ? "null" : typeof body,
      }),
    )
    return
  }

  const hasSingularWrapper = typeof (body as { error?: unknown }).error === "object" &&
    (body as { error?: unknown }).error !== null
  const errors = (body as { errors?: unknown }).errors
  const hasPluralWrapper = Array.isArray(errors) && errors.length > 0
  if (hasSingularWrapper || hasPluralWrapper) return

  reporter.reportMismatch(
    new SchemaMismatchError({
      endpoint,
      field: "(error_envelope)",
      expected: "error{code,message}|errors[{code}]",
      actual: Object.keys(body).sort().join(","),
    }),
  )
}

/**
 * Latches system-maintenance mode when any P2P API returns `P2PDisabled`.
 * Intentionally session-scoped with no timeout — mirrors mobile. Cleared on
 * logout (`clearMaintenance`) or full page reload. User-country invalid is
 * likewise session-scoped and cleared on logout.
 */
export function handleP2PApiStatusCode(code: string | null | undefined): void {
  if (code === "P2PDisabled") {
    useP2PMaintenanceStore.getState().setApiMaintenanceActive(true)
  }
  if (code === "UserCountryInvalid") {
    useUserCountryInvalidStore.getState().setUserCountryInvalid(true)
  }
}
