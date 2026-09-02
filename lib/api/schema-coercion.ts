import { z } from "zod"
import { SchemaMismatchError } from "./schema-mismatch-error"
import type { ApiSchemaReporter } from "./schema-reporter"

export interface CoercionContext {
  endpoint: string
  field: string
  reporter?: ApiSchemaReporter
}

/**
 * Accepts a number as-is, or a numeric string (coerces + reports). Anything
 * else falls through to `z.number()`'s own validation, producing a normal
 * zod issue that `parseWithSchema` converts into a `SchemaMismatchError`.
 *
 * Mirrors the mobile `jsonReportedDouble` absorb-and-log contract.
 */
export function reportedNumber(ctx: CoercionContext): z.ZodType<number, z.ZodTypeDef, unknown> {
  return z.preprocess((value) => {
    if (typeof value === "number") return value
    if (typeof value === "string") {
      const parsed = Number(value)
      if (value.trim() !== "" && !Number.isNaN(parsed)) {
        ctx.reporter?.reportCoercion({
          endpoint: ctx.endpoint,
          field: ctx.field,
          expected: "number|string(number)",
          actual: "string",
        })
        return parsed
      }
    }
    return value
  }, z.number())
}

/**
 * Accepts a string as-is, or a number/boolean (coerces via `String()` +
 * reports). Anything else falls through to `z.string()`'s own validation.
 *
 * Mirrors the mobile `jsonReportedString` absorb-and-log contract.
 */
export function reportedString(ctx: CoercionContext): z.ZodType<string, z.ZodTypeDef, unknown> {
  return z.preprocess((value) => {
    if (typeof value === "string") return value
    if (typeof value === "number" || typeof value === "boolean") {
      ctx.reporter?.reportCoercion({
        endpoint: ctx.endpoint,
        field: ctx.field,
        expected: "string|scalar",
        actual: typeof value,
      })
      return String(value)
    }
    return value
  }, z.string())
}

/**
 * Accepts a boolean as-is, or `0`/`1`/`"true"`/`"false"`/`"0"`/`"1"`
 * (case-insensitive) (coerces + reports). Anything else falls through to
 * `z.boolean()`'s own validation.
 */
export function reportedBoolean(ctx: CoercionContext): z.ZodType<boolean, z.ZodTypeDef, unknown> {
  return z.preprocess((value) => {
    if (typeof value === "boolean") return value
    if (typeof value === "number") {
      if (value === 1 || value === 0) {
        ctx.reporter?.reportCoercion({
          endpoint: ctx.endpoint,
          field: ctx.field,
          expected: 'bool|0|1|"true"|"false"',
          actual: "number",
        })
        return value === 1
      }
    }
    if (typeof value === "string") {
      const lower = value.toLowerCase()
      if (lower === "true" || lower === "1" || lower === "false" || lower === "0") {
        ctx.reporter?.reportCoercion({
          endpoint: ctx.endpoint,
          field: ctx.field,
          expected: 'bool|0|1|"true"|"false"',
          actual: "string",
        })
        return lower === "true" || lower === "1"
      }
    }
    return value
  }, z.boolean())
}

function describeZodIssue(issue: z.ZodIssue): { expected: string; actual: string } {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    return { expected: issue.expected, actual: issue.received }
  }
  return { expected: issue.code, actual: "invalid" }
}

/**
 * Parses `json` against `schema`. On success returns the parsed value. On
 * failure, builds a sanitized `SchemaMismatchError` from the first zod issue,
 * reports it via `reporter.reportMismatch`, and throws — fail-closed, mirrors
 * mobile's `failureFromParseError`.
 */
export function parseWithSchema<T>(
  schema: z.ZodType<T>,
  json: unknown,
  options: { endpoint: string; reporter?: ApiSchemaReporter; requestId?: string },
): T {
  const result = schema.safeParse(json)
  if (result.success) return result.data

  // Report first issue only — mirrors mobile's failureFromParseError, which
  // also surfaces a single ApiSchemaException per parse failure rather than
  // every field that failed.
  const issue = result.error.issues[0]
  const field = issue.path.length > 0 ? issue.path.join(".") : "(root)"
  const { expected, actual } = describeZodIssue(issue)

  const error = new SchemaMismatchError({
    endpoint: options.endpoint,
    field,
    expected,
    actual,
    requestId: options.requestId,
  })
  options.reporter?.reportMismatch(error)
  throw error
}

/**
 * Parses each item in `items` against `itemSchema` independently. Bad items
 * are skipped and reported with their index; good items are kept. Throws
 * (fail-closed) only when every item in a non-empty list is rejected.
 *
 * Mirrors mobile's `parseAdvertListResponse` per-item isolation pattern.
 */
export function parseArrayWithItemIsolation<T>(
  itemSchema: z.ZodType<T>,
  items: unknown[],
  options: { endpoint: string; field: string; reporter?: ApiSchemaReporter },
): T[] {
  const results: T[] = []

  for (let index = 0; index < items.length; index++) {
    const result = itemSchema.safeParse(items[index])
    if (result.success) {
      results.push(result.data)
      continue
    }

    const issue = result.error.issues[0]
    const subField = issue.path.length > 0 ? issue.path.join(".") : ""
    const field = subField ? `${options.field}[${index}].${subField}` : `${options.field}[${index}]`
    const { expected, actual } = describeZodIssue(issue)

    options.reporter?.reportMismatch(
      new SchemaMismatchError({
        endpoint: options.endpoint,
        field,
        expected,
        actual,
        itemIndex: index,
      }),
    )
  }

  if (items.length > 0 && results.length === 0) {
    throw new SchemaMismatchError({
      endpoint: options.endpoint,
      field: options.field,
      expected: "array(item)",
      actual: "array(all_items_rejected)",
    })
  }

  return results
}
