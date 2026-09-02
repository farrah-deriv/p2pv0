/**
 * Thrown when an API JSON value cannot be coerced to the expected shape.
 *
 * Carries sanitized metadata only — never field values, tokens, or response
 * bodies. Safe to log and forward to RUM. Extends `Error` so it flows through
 * every existing `error instanceof Error` + `.message` + retry-button call
 * site with no new UI required.
 */
export class SchemaMismatchError extends Error {
  /** Relative API path or logical endpoint name (e.g. `p2p/v1/settings`). */
  readonly endpoint: string

  /** Dot-path of the field (e.g. `exchange_rate`, `data[2].code`). */
  readonly field: string

  /** Expected type family description (e.g. `number|string(number)`). */
  readonly expected: string

  /** Runtime type / shape description of the received value. */
  readonly actual: string

  /** Optional correlation / request id from response headers. */
  readonly requestId?: string

  /** Index of a rejected list item, when applicable. */
  readonly itemIndex?: number

  constructor(params: {
    endpoint: string
    field: string
    expected: string
    actual: string
    requestId?: string
    itemIndex?: number
    message?: string
  }) {
    super(params.message ?? 'Something went wrong. Please try again.')
    this.name = 'SchemaMismatchError'
    this.endpoint = params.endpoint
    this.field = params.field
    this.expected = params.expected
    this.actual = params.actual
    this.requestId = params.requestId
    this.itemIndex = params.itemIndex
  }
}
