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

export const maskAccountNumber = (accountNumber: string): string => {
  if (!accountNumber || accountNumber.length <= 4) {
    return accountNumber
  }
  const lastFour = accountNumber.slice(-4)
  const maskedPart = "".padStart(accountNumber.length - 4, "*")

  return maskedPart + lastFour
}

// Function to convert snake_case to Title Case
export const formatPaymentMethodName = (method: string): string => {
  return method
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

// Function to get payment method color based on type
export const getPaymentMethodColor = (method: string): string => {
  const lowerMethod = method.toLowerCase()
  if (lowerMethod.includes("bank") || lowerMethod === "bank_transfer") {
    return "bg-green-500"
  } else if (
    lowerMethod.includes("wallet") ||
    lowerMethod.includes("pay") ||
    lowerMethod === "alipay" ||
    lowerMethod === "apple_pay"
  ) {
    return "bg-blue-500"
  } else if (lowerMethod === "airtel") {
    return "bg-red-500"
  } else {
    return "bg-gray-500"
  }
}
