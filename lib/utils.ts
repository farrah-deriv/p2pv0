import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface AvailablePaymentMethod {
  id: number
  method: string
  display_name: string
  type: string
  fields: Record<
    string,
    {
      display_name: string
      required: boolean
      value?: string
    }
  >
}

interface PaymentMethodField {
  name: string
  label: string
  type: string
  required: boolean
}

export function getPaymentMethodFields(
  method: string,
  availablePaymentMethods: AvailablePaymentMethod[],
): PaymentMethodField[] {
  const paymentMethod = availablePaymentMethods.find((pm) => pm.method === method)
  if (!paymentMethod) return []

  return Object.entries(paymentMethod.fields)
    .filter(([key]) => key !== "instructions")
    .map(([key, field]) => ({
      name: key,
      label: field.display_name,
      type: "text",
      required: field.required,
    }))
}

export function getPaymentMethodIcon(type: string): string {
  return type === "ewallet" ? "/icons/ewallet-icon.png" : "/icons/bank-transfer-icon.png"
}

export const maskAccountNumber = (accountNumber: string | any): string => {
  if (!accountNumber) return ""

  // Convert to string if it's not already
  const accountStr = String(accountNumber)

  if (accountStr.length <= 4) {
    return accountStr
  }

  // Show last 4 digits with asterisks
  return "*".repeat(accountStr.length - 4) + accountStr.slice(-4)
}

/**
 * Convert snake_case payment method names to proper case
 * @param methodName - The snake_case method name (e.g., "apple_pay")
 * @returns Formatted method name (e.g., "Apple Pay")
 */
export function formatPaymentMethodName(methodName: string): string {
  if (!methodName) return ""

  return methodName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}
