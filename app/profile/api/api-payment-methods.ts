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
export async function addPaymentMethod(
  method: string,
  fields: Record<string, string>,
): Promise<{ success: boolean; data?: PaymentMethod; errors?: any[] }> {
  try {
    const url = `${API.baseUrl}/user-payment-methods`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    // Restructure the request body to match expected API format
    const requestBody = {
      data: {
        method: method.toLowerCase(),
        fields: fields,
      },
    }

    const body = JSON.stringify(requestBody)

    console.group("📤 POST Add Payment Method Request")
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.log("Request Body:", body)
    console.groupEnd()

    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    })

    const responseText = await response.text()
    let responseData = {}

    // Only try to parse as JSON if there's content and it looks like JSON
    if (responseText && (responseText.startsWith("{") || responseText.startsWith("["))) {
      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        console.warn("⚠️ Could not parse response as JSON:", e)
      }
    }

    if (!response.ok) {
      return {
        success: false,
        errors: responseData.errors || [{ message: `Failed to add payment method: ${response.statusText}` }],
      }
    }

    return {
      success: true,
      data: responseData.data,
    }
  } catch (error) {
    console.error("Failed to add payment method:", error)
    return {
      success: false,
      errors: [{ message: error instanceof Error ? error.message : "An unexpected error occurred" }],
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

