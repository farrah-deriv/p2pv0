import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface AvailablePaymentMethod {
  method: string
  display_name: string
  type: string
  fields: Record<string, any>
}

export interface PaymentMethodField {
  name: string
  label: string
  type: string
  required: boolean
}

export function getPaymentMethodFields(
  method: string,
  availableMethods: AvailablePaymentMethod[],
): PaymentMethodField[] {
  const paymentMethod = availableMethods.find((m) => m.method === method)
  if (!paymentMethod || !paymentMethod.fields) return []

  return Object.entries(paymentMethod.fields).map(([key, field]: [string, any]) => ({
    name: key,
    label: field.display_name || key,
    type: field.type || "text",
    required: field.required || false,
  }))
}

export function getPaymentMethodIcon(type: string): string | null {
  const iconMap: Record<string, string> = {
    bank: "/icons/bank-transfer-icon.png",
    ewallet: "/icons/ewallet-icon.png",
  }
  return iconMap[type] || null
}

export function maskAccountNumber(accountNumber: any): string {
  // Convert to string if it's not already
  const accountStr = String(accountNumber)

  if (accountStr.length <= 4) {
    return accountStr
  }

  // Show last 4 digits with asterisks
  return "*".repeat(accountStr.length - 4) + accountStr.slice(-4)
}

export function formatPaymentMethodName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
