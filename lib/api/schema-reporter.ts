import { datadogRum } from "@datadog/browser-rum"
import type { SchemaMismatchError } from "./schema-mismatch-error"

/**
 * Sanitized telemetry for API JSON representation drift / schema mismatch.
 *
 * Implementations must never log field values, response bodies, tokens, or PII.
 */
export interface ApiSchemaReporter {
  /** Representation coercion succeeded (e.g. string "10" -> number). */
  reportCoercion(params: {
    endpoint: string
    field: string
    expected: string
    actual: string
    requestId?: string
  }): void

  /** Value could not be coerced; parse failed closed. */
  reportMismatch(error: SchemaMismatchError): void
}

/**
 * Forwards schema drift telemetry to Datadog RUM.
 *
 * SSR-safe: no-ops on the server (mirrors the guard in `lib/datadog.ts`) and
 * is always safe to call regardless of whether Datadog has been initialized —
 * `datadogRum` methods are no-ops before `init()` is called.
 */
export class DatadogApiSchemaReporter implements ApiSchemaReporter {
  reportCoercion(params: {
    endpoint: string
    field: string
    expected: string
    actual: string
    requestId?: string
  }): void {
    if (typeof window === "undefined") return
    try {
      datadogRum.addAction("api.schema_coercion", {
        endpoint: params.endpoint,
        field: params.field,
        expected: params.expected,
        actual: params.actual,
        ...(params.requestId ? { request_id: params.requestId } : {}),
      })
    } catch (error) {
      console.warn("DatadogApiSchemaReporter: reportCoercion failed", error)
    }
  }

  reportMismatch(error: SchemaMismatchError): void {
    if (typeof window === "undefined") return
    try {
      // A synthetic error keeps the RUM grouping name/message stable
      // ("api.schema_mismatch" — SchemaMismatchError's own `.message` is the
      // user-facing generic copy, not a useful grouping key), but its stack
      // would otherwise point at this reporter rather than the original
      // parse call site — copy the real stack over.
      const reportedError = new Error("api.schema_mismatch")
      reportedError.stack = error.stack
      datadogRum.addError(reportedError, {
        endpoint: error.endpoint,
        field: error.field,
        expected: error.expected,
        actual: error.actual,
        ...(error.requestId ? { request_id: error.requestId } : {}),
        ...(error.itemIndex !== undefined ? { item_index: error.itemIndex } : {}),
      })
    } catch (reportError) {
      console.warn("DatadogApiSchemaReporter: reportMismatch failed", reportError)
    }
  }
}

/** No-op reporter for tests that assert silence. */
export class NoOpApiSchemaReporter implements ApiSchemaReporter {
  reportCoercion(): void {}
  reportMismatch(): void {}
}

/**
 * App-wide schema reporter singleton. No DI container on web, so this is a
 * plain module-level export — mirrors mobile's `apiSchemaReporterProvider`.
 */
export const schemaReporter: ApiSchemaReporter = new DatadogApiSchemaReporter()
