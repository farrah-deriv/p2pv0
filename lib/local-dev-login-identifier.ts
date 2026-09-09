export type LocalDevLoginMethod = "email" | "phone"

/** Detects phone-style input (digits-only local part, or leading +). */
export function shouldUsePhoneLoginInput(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith("+")) return true
  return /^\d+$/.test(trimmed)
}

export function normalizeDialCode(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`
}

/** Builds the Kratos login identifier for localhost dev login. */
export function buildLocalDevLoginIdentifier(options: {
  method: LocalDevLoginMethod
  email: string
  dialCode: string
  phoneNumber: string
}): string {
  if (options.method === "email") {
    return options.email.trim()
  }

  const dialCode = normalizeDialCode(options.dialCode)
  const localNumber = options.phoneNumber.trim().replace(/\s+/g, "")
  if (!dialCode || !localNumber) return ""
  return `${dialCode}${localNumber}`
}
