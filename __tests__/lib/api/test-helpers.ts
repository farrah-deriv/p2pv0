import type { SchemaMismatchError } from "@/lib/api/schema-mismatch-error"
import type { ApiSchemaReporter } from "@/lib/api/schema-reporter"

/**
 * Records every `reportCoercion`/`reportMismatch` call for test assertions.
 * Shared by any test exercising `ApiSchemaReporter` consumers — don't
 * redefine a local copy in individual test files.
 */
export class RecordingReporter implements ApiSchemaReporter {
  coercions: string[] = []
  mismatches: SchemaMismatchError[] = []

  reportCoercion(params: { field: string }): void {
    this.coercions.push(params.field)
  }

  reportMismatch(error: SchemaMismatchError): void {
    this.mismatches.push(error)
  }
}
