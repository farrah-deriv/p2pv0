import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format payment method name from snake_case to Title Case
export function formatPaymentMethodName(method: string): string {
  return method
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Get color for payment method indicator
export function getPaymentMethodColor(method: string): string {
  if (method.toLowerCase().includes("bank")) {
    return "#008832" // Green for bank transfers
  }
  return "#377CFC" // Blue for all others
}

// Format payment methods for display (keeping for backward compatibility)
export function formatPaymentMethods(methods: string[]): string {
  if (!methods || methods.length === 0) {
    return "No payment methods"
  }

  return methods.map((method) => formatPaymentMethodName(method)).join(", ")
}
