/**
 * Amount + order-limit rules for the create/edit ad wizard, step 2.
 *
 * The wizard keeps each amount as a *string* in the step-2 form and as a
 * *number* in the parent's formData. Round-tripping between the two is what
 * corrupted the fields: a partial entry ("0", "0.", ".") was coerced to 0 on
 * the way up and then echoed back down as an empty field, erasing whatever the
 * user was typing. These helpers keep the two representations honest — the raw
 * string stays authoritative while it is being edited, and a value is only
 * turned into a number once it is complete.
 */

export interface AmountInputValues {
  totalAmount: string
  minAmount: string
  maxAmount: string
}

export interface AmountValidationErrors {
  totalAmount?: string
  minAmount?: string
  maxAmount?: string
}

export interface AmountTouchedState {
  totalAmount: boolean
  minAmount: boolean
  maxAmount: boolean
}

export type AmountTranslate = (key: string) => string

/**
 * Trailing separator or sign — a keystroke on the way to a number, not a number.
 * `+` is included because `input[type=number]` accepts a leading sign, so "+" can
 * be the entire value for one keystroke before any digit is typed.
 */
const INCOMPLETE_ENTRY = /[.\-+]$/

/**
 * The numeric value of a *complete* amount entry, or `undefined` while the entry
 * is blank or still half-typed.
 *
 * Returning `undefined` rather than 0 is the whole point: `Number.parseFloat(x) || 0`
 * made "still typing" and "the user meant zero" indistinguishable, which is how a
 * blank field reached the API as `minimum_order_amount: 0`.
 */
export function parseAmountInput(value: string | null | undefined): number | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (trimmed === "" || INCOMPLETE_ENTRY.test(trimmed)) return undefined
  // Number() rather than parseFloat() so "1abc" is rejected outright instead of
  // being silently read as 1.
  const numeric = Number(trimmed)
  return Number.isFinite(numeric) ? numeric : undefined
}

/** Same, for the number|string values the parent stores in formData. */
function toFiniteAmount(value: number | string | null | undefined): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined
  return parseAmountInput(value)
}

/**
 * Converts an amount held by the parent into the string shown in its
 * CurrencyInput. Absent values render as an empty field so the placeholder is
 * displayed; a genuine zero renders as "0" so a corrupted advert being edited
 * shows what it actually holds instead of looking unset.
 */
export function amountToInputValue(amount: number | string | null | undefined): string {
  if (amount === undefined || amount === null || amount === "") return ""
  const numeric = Number(amount)
  if (!Number.isFinite(numeric)) return ""
  return amount.toString()
}

/**
 * What an amount input should show when the parent pushes a value down.
 *
 * The parent's value only wins when it is genuinely new — an edit-mode prefill,
 * or a reset. When it merely echoes back the number this field just pushed
 * upward, the user's own string is kept, so "0" is not blanked and the trailing
 * zero of "1.50" is not deleted from under the caret.
 */
export function resolveSyncedAmountInput(
  incoming: number | string | null | undefined,
  currentInput: string,
): string {
  const current = parseAmountInput(currentInput)
  const next = toFiniteAmount(incoming)

  // Mid-keystroke: the parent cannot represent "0." or "1.", so it must not
  // overwrite them.
  if (current === undefined && currentInput.trim() !== "") return currentInput

  // The parent is echoing this field's own value back.
  if (current !== undefined && next !== undefined && current === next) return currentInput

  return amountToInputValue(incoming)
}

/**
 * Validates the three amount fields from their values alone.
 *
 * Deliberately independent of `touched`: validity is a property of the values,
 * and *display* is a separate concern (see `getVisibleAmountErrors`). Entangling
 * them meant a field the user had not blurred was treated as valid, so a zero
 * could keep the Next button enabled.
 */
export function validateAmountFields(
  values: AmountInputValues,
  t: AmountTranslate,
): AmountValidationErrors {
  const errors: AmountValidationErrors = {}
  const total = parseAmountInput(values.totalAmount)
  const min = parseAmountInput(values.minAmount)
  const max = parseAmountInput(values.maxAmount)

  if (total === undefined) {
    errors.totalAmount = t("adForm.totalAmountRequired")
  } else if (total <= 0) {
    errors.totalAmount = t("adForm.totalAmountGreaterThanZero")
  }

  if (min !== undefined && total !== undefined && min > total) {
    errors.minAmount = t("adForm.minAmountLessThanTotal")
  }

  if (max !== undefined && total !== undefined && max > total) {
    errors.maxAmount = t("adForm.maxAmountLessThanTotal")
  }

  if (min === undefined) {
    errors.minAmount = t("adForm.minAmountRequired")
  } else if (min <= 0) {
    errors.minAmount = t("adForm.minAmountGreaterThanZero")
  }

  // Both must parse — comparing a blank field as 0 invented spurious errors —
  // and the maximum must itself be usable. Without the `max > 0` guard, a
  // maximum of 0 also blamed the minimum ("must be less than maximum order")
  // when the minimum was perfectly fine.
  if (min !== undefined && max !== undefined && max > 0 && min > max) {
    errors.minAmount = t("adForm.minAmountLessThanMax")
    errors.maxAmount = t("adForm.maxAmountGreaterThanMin")
  }

  if (max === undefined) {
    errors.maxAmount = t("adForm.maxAmountRequired")
  } else if (max <= 0) {
    errors.maxAmount = t("adForm.maxAmountGreaterThanZero")
  }

  return errors
}

/**
 * Narrows validation errors to the ones the user should actually see. A field is
 * only "touched" once it has been blurred, so a half-typed "0.5" does not render
 * "Minimum order must be greater than 0." after its first character.
 */
export function getVisibleAmountErrors(
  errors: AmountValidationErrors,
  touched: AmountTouchedState,
): AmountValidationErrors {
  return {
    totalAmount: touched.totalAmount ? errors.totalAmount : undefined,
    minAmount: touched.minAmount ? errors.minAmount : undefined,
    maxAmount: touched.maxAmount ? errors.maxAmount : undefined,
  }
}

/** True when all three amounts are complete and free of errors. */
export function areAmountsValid(values: AmountInputValues, t: AmountTranslate): boolean {
  return Object.keys(validateAmountFields(values, t)).length === 0
}

/**
 * Last line of defence before the advert is posted.
 *
 * Step 2 is otherwise only consulted through a cached `paymentFormValid` flag
 * computed in an effect from one-commit-stale errors, and the payload built
 * `minimum_order_amount: finalData.minAmount || 0` — which turns "absent" into a
 * valid-looking zero. Returns the message to surface, or null when the limits
 * are safe to send.
 */
export function getAmountLimitsSubmissionError(
  amounts: {
    totalAmount?: number | string
    minAmount?: number | string
    maxAmount?: number | string
  },
  t: AmountTranslate,
): string | null {
  const total = toFiniteAmount(amounts.totalAmount)
  const min = toFiniteAmount(amounts.minAmount)
  const max = toFiniteAmount(amounts.maxAmount)

  // Total first: a corrupt total surfaced as "maximum exceeds total", which
  // points the user at the wrong field.
  if (total === undefined || total <= 0) return t("adForm.totalAmountGreaterThanZero")
  if (min === undefined || min <= 0) return t("adForm.minAmountGreaterThanZero")
  if (max === undefined || max <= 0) return t("adForm.maxAmountGreaterThanZero")
  if (min > max) return t("adForm.minAmountLessThanMax")
  if (max > total) return t("adForm.maxAmountLessThanTotal")

  return null
}
