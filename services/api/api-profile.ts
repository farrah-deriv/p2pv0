import { API, AUTH, USER } from "@/lib/local-variables"
import { p2pFetch } from "./p2p-fetch"

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

export interface TradePartner {
  nickname: string
  user_id: number
  is_blocked?: boolean
}

export interface BusinessHours {
  isOpen: boolean
  availability: string
}

export interface PaymentMethod {
  id: string
  name: string
  type: string
  details: Record<string, string>
  instructions?: string
  isDefault?: boolean
}

// API Functions
/**
 * Get current user profile
 */
export async function getUserProfile(): Promise<UserProfile> {
  try {
    const response = await p2pFetch(`${API.baseUrl}${API.endpoints.profile}`, {
      credentials: "include",
      headers: {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
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
    const response = await p2pFetch(`${API.baseUrl}${API.endpoints.profile}/business-hours`, {
      method: "PUT",
      credentials: "include",
      headers: {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
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
    const response = await p2pFetch(`${API.baseUrl}${API.endpoints.profile}/balance`, {
      credentials: "include",
      headers: {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
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
 * Toggle real name visibility
 */
export async function toggleRealNameVisibility(show: boolean): Promise<{ success: boolean }> {
  try {
    const response = await p2pFetch(`${API.baseUrl}${API.endpoints.profile}/settings/show-real-name`, {
      method: "PUT",
      credentials: "include",
      headers: {
        ...AUTH.getAuthHeader(),
        "Content-Type": "application/json",
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

export interface UserStats {
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

export type UserStatsResponse = UserStats | { error: any }

export const fetchUserStats = async (): Promise<UserStatsResponse> => {
  try {
    const userId = USER.id
    const url = `${API.baseUrl}/users/${userId}`
    const headers = AUTH.getAuthHeader()

    const response = await p2pFetch(url, {
      headers,
      credentials: "include",
      cache: "no-store",
    })

    const responseData = await response.json()

    if (responseData.errors && responseData.errors.length > 0) {
      return { error: responseData.errors }
    }

    if (!response.ok) {
      return { error: [`Failed to fetch user stats: ${response.status} ${response.statusText}`] }
    }

    if (responseData && responseData.data) {
      const data = responseData.data

      const formatTimeAverage = (minutes: number | null) => {
        if (minutes == null) return "-"
        const m = Math.round(minutes)
        if (m <= 0) return "0 min"
        if (m < 60) return `${m} min`
        const hours = Math.floor(m / 60)
        const remainingMins = m % 60
        if (hours >= 24) {
          const days = Math.floor(hours / 24)
          const remainingHours = hours % 24
          return remainingHours === 0 ? `${days}d` : `${days}d ${remainingHours}h`
        }
        return remainingMins === 0 ? `${hours}h` : `${hours}h ${remainingMins}m`
      }

      const transformedStats: UserStats = {
        buyCompletion: {
          rate: `${Number(data.completion_average_30day) || 0}% (${Number(data.buy_count_30day) || 0})`,
          period: "(30d)",
        },
        sellCompletion: {
          rate: `${Number(data.completion_average_30day) || 0}% (${Number(data.sell_count_30day) || 0})`,
          period: "(30d)",
        },
        avgPayTime: {
          time: formatTimeAverage(data.buy_time_average_30day != null ? Number(data.buy_time_average_30day) : null),
          period: "(30d)",
        },
        avgReleaseTime: {
          time: formatTimeAverage(data.release_time_average_30day != null ? Number(data.release_time_average_30day) : null),
          period: "(30d)",
        },
        tradePartners: Number(data.partner_count_lifetime) || 0,
        totalOrders30d: (Number(data.buy_count_30day) || 0) + (Number(data.sell_count_30day) || 0),
        totalOrdersLifetime: Number(data.order_count_lifetime) || 0,
        tradeVolume30d: {
          amount: ((Number(data.buy_amount_30day) || 0) + (Number(data.sell_amount_30day) || 0)).toFixed(2),
          currency: "USD",
          period: "(30d)",
        },
        tradeVolumeLifetime: {
          amount: data.order_amount_lifetime ? Number(data.order_amount_lifetime).toFixed(2) : "0.00",
          currency: "USD",
        },
      }

      return transformedStats
    }

    return { error: ["No user data found"] }
  } catch (err) {
    return { error: [`Unexpected error: ${(err as Error).message}`] }
  }
}

export async function getUserPaymentMethods(): Promise<{ data: PaymentMethod[] }> {
  try {
    const headers = AUTH.getAuthHeader()
    const response = await p2pFetch(`${API.baseUrl}/user-payment-methods`, {
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Error fetching payment methods: ${response.statusText}`)
    }

    const result = await response.json()
    return { data: result.data || [] }
  } catch (error) {
    throw error
  }
}

export async function addPaymentMethod(
  method: string,
  fields: Record<string, any>,
): Promise<{ success: boolean; data?: PaymentMethod; errors?: Array<{ code: string; message: string }> }> {
  try {
    const formattedMethod = method.toLowerCase()

    const cleanFields: Record<string, any> = {}

    Object.keys(fields).forEach((key) => {
      if (fields[key] && typeof fields[key] === "string") {
        cleanFields[key] = fields[key]
      }
    })

    const requestBody = {
      data: {
        method: formattedMethod,
        fields: cleanFields,
      },
    }

    const headers = AUTH.getAuthHeader()
    const response = await p2pFetch(`${API.baseUrl}/user-payment-methods`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()

    let responseData: any
    try {
      responseData = responseText ? JSON.parse(responseText) : { success: response.ok }
    } catch (e) {
      return {
        success: false,
        errors: [{ code: "parse_error", message: "Failed to parse server response" }],
      }
    }

    if (!response.ok) {
      const errors = responseData.errors || []

      const formattedErrors = errors.map((err: any) => ({
        code: err.code || "unknown_error",
        message: getErrorMessageFromCode(err.code),
      }))

      return {
        success: false,
        errors:
          formattedErrors.length > 0
            ? formattedErrors
            : [{ code: "api_error", message: `API Error: ${response.status} ${response.statusText}` }],
      }
    }

    return { success: true, data: responseData.data }
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          code: "exception",
          message: error instanceof Error ? error.message : "An unexpected error occurred",
        },
      ],
    }
  }
}

export async function updatePaymentMethod(
  id: string,
  fields: Record<string, any>,
): Promise<{ success: boolean; data?: PaymentMethod; errors?: Array<{ code: string; message: string }> }> {
  try {
    const requestBody = {
      data: fields,
    }

    const headers = AUTH.getAuthHeader()
    const response = await p2pFetch(`${API.baseUrl}/user-payment-methods/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()

    let responseData: any
    try {
      responseData = responseText ? JSON.parse(responseText) : { success: response.ok }
    } catch (e) {
      return {
        success: false,
        errors: [{ code: "parse_error", message: "Failed to parse server response" }],
      }
    }

    if (!response.ok) {
      const errors = responseData.errors || []

      const formattedErrors = errors.map((err: any) => ({
        code: err.code || "unknown_error",
        message: err.message || getErrorMessageFromCode(err.code),
      }))

      return {
        success: false,
        errors:
          formattedErrors.length > 0
            ? formattedErrors
            : [{ code: "api_error", message: `API Error: ${response.status} ${response.statusText}` }],
      }
    }

    return { success: true, data: responseData.data }
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          code: "exception",
          message: error instanceof Error ? error.message : "An unexpected error occurred",
        },
      ],
    }
  }
}

function getErrorMessageFromCode(code: string): string {
  const errorMessages: Record<string, string> = {
    DuplicatePaymentMethod: "You already have this payment method added to your account.",
    PaymentMethodUsedByOpenOrder:
      "This payment method is currently being used by an open order and cannot be modified.",
    InvalidPaymentMethod: "The payment method information is invalid.",
    PaymentMethodNotFound: "The payment method could not be found.",
  }

  return errorMessages[code] || `Error: ${code}`
}

export async function deletePaymentMethod(
  id: string,
): Promise<{ success: boolean; data?: PaymentMethod; errors?: Array<{ code: string; message: string }> }> {
  try {
    const headers = AUTH.getAuthHeader()
    const response = await p2pFetch(`${API.baseUrl}/user-payment-methods/${id}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        return { success: false, errors: errorData.errors }
      } catch (error) {
        return { success: false, errors: [{ code: "api_error", message: response.statusText }] }
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      errors: [{ code: "exception", message: error instanceof Error ? error.message : "An unexpected error occurred" }],
    }
  }
}

export async function getFavouriteUsers(page?: number, perPage?: number): Promise<[]> {
  try {
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }
    const queryParams = new URLSearchParams()
    if (page !== undefined) queryParams.append("page", page.toString())
    if (perPage !== undefined) queryParams.append("per_page", perPage.toString())
    
    const url = queryParams.toString() 
      ? `${API.baseUrl}/user-favourites?${queryParams.toString()}`
      : `${API.baseUrl}/user-favourites`
    
    const response = await p2pFetch(url, {
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Error fetching advertisers: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data || []
  } catch (error) {
    throw error
  }
}

export async function getFollowers(page?: number, perPage?: number): Promise<[]> {
  try {
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }
    const queryParams = new URLSearchParams()
    if (page !== undefined) queryParams.append("page", page.toString())
    if (perPage !== undefined) queryParams.append("per_page", perPage.toString())
    
    const url = queryParams.toString() 
      ? `${API.baseUrl}/user-favourited-by?${queryParams.toString()}`
      : `${API.baseUrl}/user-favourited-by`
    
    const response = await p2pFetch(url, {
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Error fetching followers: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data || []
  } catch (error) {
    throw error
  }
}

export async function getBlockedUsers(page?: number, perPage?: number): Promise<[]> {
  try {
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }
    const queryParams = new URLSearchParams()
    if (page !== undefined) queryParams.append("page", page.toString())
    if (perPage !== undefined) queryParams.append("per_page", perPage.toString())
    
    const url = queryParams.toString() 
      ? `${API.baseUrl}/user-blocks?${queryParams.toString()}`
      : `${API.baseUrl}/user-blocks`
    
    const response = await p2pFetch(url, {
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Error fetching blocked users: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data || []
  } catch (error) {
    throw error
  }
}

export async function getClosedGroup(): Promise<[]> {
  try {
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }
    const response = await p2pFetch(`${API.baseUrl}/user-group/members`, {
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Error fetching blocked users: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data || []
  } catch (error) {
    throw error
  }
}

export async function addToClosedGroup(advertiserId: string | number): Promise<{ success: boolean; errors?: Array<{ code: string; message: string }> }> {
  try {
    if (!advertiserId) {
      throw new Error("User ID is required")
    }

    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }
    const body = JSON.stringify({
      data: {
        user_id: String(advertiserId),
      },
    })
    const response = await p2pFetch(`${API.baseUrl}/user-group/members`, {
      method: "POST",
      headers,
      credentials: "include",
      body
    })

    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        return { success: false, errors: errorData.errors }
      } catch (error) {
        return { success: false, errors: [{ code: "api_error", message: response.statusText }] }
      }
    }

    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      errors: [{ code: "exception", message: error instanceof Error ? error.message : "An unexpected error occurred" }],
    }
  }
}

export async function removeFromClosedGroup(advertiserId: string | number): Promise<{ success: boolean; errors?: Array<{ code: string; message: string }> }> {
  try {
    if (!advertiserId) {
      throw new Error("User ID is required")
    }

    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await p2pFetch(`${API.baseUrl}/user-group/members/${String(advertiserId)}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        return { success: false, errors: errorData.errors }
      } catch (error) {
        return { success: false, errors: [{ code: "api_error", message: response.statusText }] }
      }
    }

    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      errors: [{ code: "exception", message: error instanceof Error ? error.message : "An unexpected error occurred" }],
    }
  }
}

export async function removeAllFromClosedGroup(): Promise<{ success: boolean; errors?: Array<{ code: string; message: string }> }> {
  try {
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await p2pFetch(`${API.baseUrl}/user-group/members`, {
      method: "DELETE",
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorData = JSON.parse(errorText)
        return { success: false, errors: errorData.errors }
      } catch (error) {
        return { success: false, errors: [{ code: "api_error", message: response.statusText }] }
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      errors: [{ code: "exception", message: error instanceof Error ? error.message : "An unexpected error occurred" }],
    }
  }
}

export async function getTradePartners(page?: number, perPage?: number): Promise<TradePartner[]> {
  try {
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }
    const queryParams = new URLSearchParams()
    if (page !== undefined) queryParams.append("page", page.toString())
    if (perPage !== undefined) queryParams.append("per_page", perPage.toString())
    
    const url = queryParams.toString() 
      ? `${API.baseUrl}/trade-partners?${queryParams.toString()}`
      : `${API.baseUrl}/trade-partners`
    
    const response = await p2pFetch(url, {
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Error fetching trade partners: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data || []
  } catch (error) {
    throw error
  }
}
