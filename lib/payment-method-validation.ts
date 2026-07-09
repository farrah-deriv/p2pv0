export const MPESA_NUMERIC_ACCOUNT_METHODS = new Set([
  "mpesa_tanzania",
  "safaricom_mpesa",
  "vodacom_m_pesa",
])

export const PAYMENT_METHOD_ACCOUNT_MAX_LENGTH = 50
export const PAYMENT_METHOD_INSTRUCTIONS_MAX_LENGTH = 300
export const PAYMENT_METHOD_BANK_NAME_MAX_LENGTH = 100
export const PAYMENT_METHOD_BANK_CODE_MAX_LENGTH = 50
export const PAYMENT_METHOD_BRANCH_MAX_LENGTH = 100

export type PaymentMethodFieldName =
  | "account"
  | "instructions"
  | "bank_name"
  | "bank_code"
  | "branch"

export type PaymentMethodFieldValidationIssue = "invalidFormat" | "numbersOnly"

/** @deprecated Use PaymentMethodFieldValidationIssue */
export type PaymentMethodAccountValidationIssue = PaymentMethodFieldValidationIssue

const PAYMENT_METHOD_KEY_PATTERN = /^[a-z0-9_]+$/
// Field patterns match mobile/backend specs. Legacy inline regex also allowed `'` and `#`;
// `#` is tested below; `'` is intentionally excluded (same as mobile).
// \p{M} required for scripts that use combining marks (e.g. Devanagari vowel signs, Arabic harakat).
const ACCOUNT_PATTERN = /^[A-Za-z0-9@\-\.\s,_()+:]{0,50}$/
const INSTRUCTIONS_PATTERN = /^[\p{L}\p{M}\p{Nd}\s@\-\.!/%&,_()+:;]{0,300}$/u
const BANK_NAME_PATTERN = /^[\p{L}\p{M}\p{Nd}\s@\-\.,_()+:]{0,100}$/u
const BANK_CODE_PATTERN = /^[A-Za-z0-9@\-\.\s,_()+:]{0,50}$/
const BRANCH_PATTERN = /^[\p{L}\p{M}\p{Nd}\s@\-\.,_()+:]{0,100}$/u
const MPESA_ACCOUNT_PATTERN = /^(\+\d+|\d+)$/

export function paymentMethodFieldNameFromKey(key: string): PaymentMethodFieldName | null {
  switch (key) {
    case "account":
    case "instructions":
    case "bank_name":
    case "bank_code":
    case "branch":
      return key
    default:
      return null
  }
}

export function getPaymentMethodFieldMaxLength(fieldName: string): number | undefined {
  switch (fieldName) {
    case "account":
      return PAYMENT_METHOD_ACCOUNT_MAX_LENGTH
    case "instructions":
      return PAYMENT_METHOD_INSTRUCTIONS_MAX_LENGTH
    case "bank_name":
      return PAYMENT_METHOD_BANK_NAME_MAX_LENGTH
    case "bank_code":
      return PAYMENT_METHOD_BANK_CODE_MAX_LENGTH
    case "branch":
      return PAYMENT_METHOD_BRANCH_MAX_LENGTH
    default:
      return undefined
  }
}

export function isValidPaymentMethodKey(method: string): boolean {
  return PAYMENT_METHOD_KEY_PATTERN.test(method)
}

export function isMpesaPaymentMethod(method: string): boolean {
  return MPESA_NUMERIC_ACCOUNT_METHODS.has(method.toLowerCase())
}

export function requiresNumericAccountField(method: string, fieldName: string): boolean {
  return fieldName === "account" && isMpesaPaymentMethod(method)
}

export function sanitizeMpesaAccountInput(value: string): string {
  if (value.startsWith("+")) {
    return `+${value.slice(1).replace(/\D/g, "")}`
  }
  return value.replace(/\D/g, "")
}

/** @deprecated Use sanitizeMpesaAccountInput */
export const sanitizeNumericAccountInput = sanitizeMpesaAccountInput

export function isValidMpesaAccount(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.length > PAYMENT_METHOD_ACCOUNT_MAX_LENGTH) return false
  return MPESA_ACCOUNT_PATTERN.test(trimmed)
}

/** @deprecated Use isValidMpesaAccount */
export function isDigitsOnly(value: string): boolean {
  return /^\d+$/.test(value)
}

export function hasInvalidLegacyMpesaAccountNumber(
  method: string,
  account: string | null | undefined,
): boolean {
  if (!isMpesaPaymentMethod(method)) return false

  const trimmed = account?.trim() ?? ""
  if (!trimmed) return false

  return !isValidMpesaAccount(trimmed)
}

export function getPaymentMethodFieldValidationIssue(
  method: string,
  fieldName: string,
  value: string,
): PaymentMethodFieldValidationIssue | null {
  const field = paymentMethodFieldNameFromKey(fieldName)
  if (!field) return null

  const trimmed = value.trim()
  if (!trimmed) return null

  if (field === "account" && isMpesaPaymentMethod(method)) {
    return isValidMpesaAccount(trimmed) ? null : "numbersOnly"
  }

  const isValid = (() => {
    switch (field) {
      case "account":
        return ACCOUNT_PATTERN.test(trimmed)
      case "instructions":
        return INSTRUCTIONS_PATTERN.test(trimmed)
      case "bank_name":
        return BANK_NAME_PATTERN.test(trimmed)
      case "bank_code":
        return BANK_CODE_PATTERN.test(trimmed)
      case "branch":
        return BRANCH_PATTERN.test(trimmed)
      default:
        return true
    }
  })()

  return isValid ? null : "invalidFormat"
}

/** @deprecated Use getPaymentMethodFieldValidationIssue */
export function getPaymentMethodAccountValidationIssue(
  method: string,
  fieldName: string,
  value: string,
): PaymentMethodFieldValidationIssue | null {
  if (fieldName !== "account") return null
  return getPaymentMethodFieldValidationIssue(method, fieldName, value)
}
