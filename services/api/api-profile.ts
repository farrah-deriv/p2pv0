import { API, AUTH } from "@/lib/local-variables"

// Type definitions
export interface UserProfile {
  id: number
  nickname: string
  rating: string
  completionRate: string
  joinDate: string
  blockedCount: number
  realName: string
  balance: number
  isVerified: {
    id: boolean
    address: boolean
    phone: boolean
  }
  businessHours: {
    isOpen: boolean
    availability: string
  }
  tradeLimits: {
    buy: {
      current: number
      max: number
    }
    sell: {
      current: number
      max: number
    }
  }
  stats: {
    buyCompletion: { rate: string; period: string }
    sellCompletion: { rate: string; period: string }
    avgPayTime: { time: string; period: string }
    avgReleaseTime: { time: string; period: string }
    tradePartners: number
    totalOrders30d: number
    totalOrdersLifetime: number
    tradeVolume30d: { amount: string; currency: string; period: string }
    tradeVolumeLifetime: { amount: string; currency: string }
  }
}

export interface BusinessHours {
  isOpen: boolean
  availability: string
}

export interface PaymentMethod {
  id: string
  name: string
  instructions: string
  isDefault: boolean
}

// API Functions
/**
 * Get current user profile
 */
export async function getUserProfile(): Promise<UserProfile> {
  try {
    const response = await fetch(`${API.baseUrl}${API.endpoints.profile}`, {
      headers: {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
        "X-Data-Source": "live",
      },
    })

    if (!response.ok) {
      throw new Error(`Error fetching profile: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Failed to fetch profile:", error)
    throw error
  }
}

/**
 * Update business hours
 */
export async function updateBusinessHours(data: BusinessHours): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API.baseUrl}${API.endpoints.profile}/business-hours`, {
      method: "PUT",
      headers: {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
        "X-Data-Source": "live",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Error updating business hours: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Failed to update business hours:", error)
    throw error
  }
}

/**
 * Get user balance
 */
export async function getUserBalance(): Promise<{ balance: number; currency: string }> {
  try {
    const response = await fetch(`${API.baseUrl}${API.endpoints.profile}/balance`, {
      headers: {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
        "X-Data-Source": "live",
      },
    })

    if (!response.ok) {
      throw new Error(`Error fetching balance: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Failed to fetch balance:", error)
    throw error
  }
}

/**
 * Get user payment methods
 */
export async function getUserPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const response = await fetch(`${API.baseUrl}${API.endpoints.profile}/payment-methods`, {
      headers: {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
        "X-Data-Source": "live",
      },
    })

    if (!response.ok) {
      throw new Error(`Error fetching payment methods: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Failed to fetch payment methods:", error)
    throw error
  }
}

/**
 * Add new payment method
 */
export async function addPaymentMethod(name: string, instructions: string): Promise<PaymentMethod> {
  try {
    const requestBody = { name, instructions }
    console.log("Payment Method API - Request Body:", JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${API.baseUrl}${API.endpoints.profile}/payment-methods`, {
      method: "POST",
      headers: {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
        "X-Data-Source": "live",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error adding payment method: ${response.status} ${response.statusText}`)
      console.error("Error Response Body:", errorText)
      throw new Error(`Error adding payment method: ${response.statusText}`)
    }

    const responseData = await response.json()
    console.log("Payment Method API - Response Body:", JSON.stringify(responseData, null, 2))

    return responseData
  } catch (error) {
    console.error("Failed to add payment method:", error)
    throw error
  }
}

/**
 * Delete payment method
 */
export async function deletePaymentMethod(id: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API.baseUrl}${API.endpoints.profile}/payment-methods/${id}`, {
      method: "DELETE",
      headers: {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
        "X-Data-Source": "live",
      },
    })

    if (!response.ok) {
      throw new Error(`Error deleting payment method: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Failed to delete payment method with ID ${id}:`, error)
    throw error
  }
}

/**
 * Toggle real name visibility
 */
export async function toggleRealNameVisibility(show: boolean): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API.baseUrl}${API.endpoints.profile}/settings/show-real-name`, {
      method: "PUT",
      headers: {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
        "X-Data-Source": "live",
      },
      body: JSON.stringify({ show }),
    })

    if (!response.ok) {
      throw new Error(`Error updating real name visibility: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Failed to update real name visibility:", error)
    throw error
  }
}
