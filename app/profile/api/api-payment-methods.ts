import { API, AUTH } from "@/lib/local-variables"

export interface PaymentMethod {
  id: string
  name: string
  type: string
  details: Record<string, string>
  instructions?: string
  isDefault?: boolean
}

/**
 * Get user payment methods
 */
export async function getUserPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const url = `${API.baseUrl}/user-payment-methods`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    console.group("📤 GET User Payment Methods Request")
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.groupEnd()

    const response = await fetch(url, { headers })

    if (!response.ok) {
      throw new Error(`Error fetching payment methods: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error("Failed to fetch payment methods:", error)
    return []
  }
}

/**
 * Add a new payment method
 */
export async function addPaymentMethod(method: string, fields: Record<string, any>) {
  try {
    // Format method name to match API expectations (lowercase, no spaces)
    const formattedMethod = method.toLowerCase().replace(/\s+/g, "_")

    const response = await fetch(`${API.baseUrl}/user-payment-methods`, {
      method: "POST",
      headers: {
        ...AUTH.getAuthHeader(),
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          method: formattedMethod,
          fields: fields, // Pass fields directly as they're already properly structured
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error("Error adding payment method:", error)
    return {
      success: false,
      errors: [
        {
          message: error instanceof Error ? error.message : "Failed to add payment method",
        },
      ],
    }
  }
}

/**
 * Delete a payment method
 */
export async function deletePaymentMethod(id: string): Promise<{ success: boolean; errors?: any[] }> {
  try {
    const url = `${API.baseUrl}/user-payment-methods/${id}`
    const headers = {
      ...AUTH.getAuthHeader(),
      Accept: "application/json",
    }

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    })

    if (!response.ok) {
      return {
        success: false,
        errors: [{ message: `Failed to delete payment method: ${response.statusText}` }],
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to delete payment method:", error)
    return {
      success: false,
      errors: [{ message: error instanceof Error ? error.message : "An unexpected error occurred" }],
    }
  }
}

/**
 * Set a payment method as default
 */
export async function setDefaultPaymentMethod(id: string): Promise<{ success: boolean; errors?: any[] }> {
  try {
    const url = `${API.baseUrl}/user-payment-methods/${id}/default`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await fetch(url, {
      method: "PUT",
      headers,
    })

    if (!response.ok) {
      return {
        success: false,
        errors: [{ message: `Failed to set default payment method: ${response.statusText}` }],
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to set default payment method:", error)
    return {
      success: false,
      errors: [{ message: error instanceof Error ? error.message : "An unexpected error occurred" }],
    }
  }
}

export const PaymentMethodsAPI = {
  getUserPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
}

