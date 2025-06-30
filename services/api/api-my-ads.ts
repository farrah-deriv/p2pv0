import { API, AUTH } from "@/lib/local-variables"

const API_BASE_URL = process.env.NEXT_PUBLIC_CORE_URL || "https://api.deriv.com"

// Type definitions
export interface APIAdvert {
  id: number
  user?: {
    nickname: string
    id: number
    is_favourite: boolean
    created_at: number
  }
  account_currency?: string
  actual_maximum_order_amount?: number
  available_amount: number
  created_at?: number
  description: string
  exchange_rate: number
  exchange_rate_type: string
  is_active: boolean
  maximum_order_amount: number
  minimum_order_amount: number
  order_expiry_period: number
  payment_currency?: string
  payment_methods: string[] // Fixed: This is the correct field name from API
  type?: string
}

export interface MyAd {
  id: string
  type: "Buy" | "Sell"
  rate: {
    value: string
    percentage: string
  }
  limits: {
    currency: string
    min: number
    max: number
  }
  available: {
    currency: string
    current: number
    total: number
  }
  paymentMethods: string[]
  status: "Active" | "Inactive"
  description?: string
}

export interface AdFilters {
  type?: "Buy" | "Sell"
  status?: "Active" | "Inactive"
  adId?: string
}

export interface CreateAdPayload {
  type: "buy" | "sell"
  account_currency: string
  payment_currency: string
  minimum_order_amount: number
  maximum_order_amount: number
  available_amount: number
  exchange_rate: number
  exchange_rate_type: "fixed"
  description: string
  is_active: number
  order_expiry_period: number
  payment_method_names: string[]
}

export interface CreateAdResponse {
  id: string
  type: "buy" | "sell"
  status: "active" | "inactive"
  created_at: string
}

export interface Advert {
  id: string
  name: string
  avatar: string
  rating: number
  orders: number
  completion: number
  following: boolean
  online: boolean
  rate: number
  limits: string
  minAmount: number
  maxAmount: number
  time: string
  methods: string[]
  currency: string
  type: string
}

/**
 * Get adverts for the current user (My Ads)
 */
export async function getUserAdverts(): Promise<MyAd[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/adverts?show_inactive=true&show_unlisted=true&show_unorderable=true&user_id=18`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Raw API response:", data)

    if (data.errors && data.errors.length > 0) {
      throw new Error(data.errors[0].message || "Failed to fetch user adverts")
    }

    // Transform the API response to match our interface
    const transformedAds: MyAd[] = data.data.map((advert: any) => {
      console.log("Processing advert:", advert.id, "payment_methods:", advert.payment_methods)

      return {
        id: advert.id.toString(),
        type: advert.type === "buy" ? "Buy" : "Sell",
        rate: {
          value: `${advert.payment_currency} ${advert.exchange_rate}`,
          percentage: `${advert.exchange_rate_type === "fixed" ? "Fixed" : "Floating"}`,
        },
        limits: {
          currency: advert.account_currency,
          min: Number.parseFloat(advert.minimum_order_amount),
          max: Number.parseFloat(advert.maximum_order_amount),
        },
        available: {
          currency: advert.account_currency,
          current: Number.parseFloat(advert.available_amount),
          total: Number.parseFloat(advert.maximum_order_amount),
        },
        paymentMethods: advert.payment_methods || [],
        status: advert.is_active ? "Active" : "Inactive",
        description: advert.description || "",
      }
    })

    console.log("Transformed ads:", transformedAds)
    return transformedAds
  } catch (error) {
    console.error("Error fetching user adverts:", error)
    throw error
  }
}

/**
 * Get all ads created by the current user with optional filters
 * This is now a wrapper around getUserAdverts for backward compatibility
 */
export async function getMyAds(filters?: AdFilters): Promise<MyAd[]> {
  try {
    console.group("🔍 Filter My Ads")
    console.log("Filters:", filters)

    const userAdverts = await getUserAdverts()
    console.log("Total ads before filtering:", userAdverts.length)

    // Apply filters if provided
    if (filters) {
      const filteredAds = userAdverts.filter((ad) => {
        if (filters.type && ad.type !== filters.type) return false
        if (filters.status && ad.status !== filters.status) return false
        if (filters.adId && ad.id !== filters.adId) return false
        return true
      })

      console.log("Total ads after filtering:", filteredAds.length)
      console.groupEnd()
      return filteredAds
    }

    console.groupEnd()
    return userAdverts
  } catch (error) {
    console.group("💥 Filter My Ads Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
    return []
  }
}

/**
 * Update an advertisement
 */
export async function updateAd(adId: string, updateData: any): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/adverts/${adId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error updating ad:", error)
    throw error
  }
}

/**
 * Toggle ad status (activate/deactivate)
 * This now uses the updateAd function to update all properties
 */
export async function toggleAdStatus(id: string, isActive: boolean, currentAd: MyAd): Promise<{ success: boolean }> {
  try {
    console.group(`📤 Toggle Ad Status (${isActive ? "Activate" : "Deactivate"})`)
    console.log("Ad ID:", id)
    console.log("Setting is_active to:", isActive)
    console.log("Current Ad Data:", currentAd)

    // Extract rate value from string (e.g., "IDR 14500.0000" -> 14500.0000)
    let exchangeRate = 0
    if (currentAd.rate && currentAd.rate.value) {
      const rateMatch = currentAd.rate.value.match(/([A-Z]+)\s+(\d+(?:\.\d+)?)/)
      if (rateMatch && rateMatch[2]) {
        exchangeRate = Number.parseFloat(rateMatch[2])
      }
    }

    // For the API, we need to convert boolean isActive to 1/0 for some endpoints
    // and keep it as boolean for others. Let's try with the boolean first.
    const adData = {
      is_active: isActive,
      minimum_order_amount: currentAd.limits.min,
      maximum_order_amount: currentAd.limits.max,
      available_amount: currentAd.available.current,
      exchange_rate: exchangeRate,
      exchange_rate_type: "fixed",
      order_expiry_period: 15, // Default value if not available
      description: "", // Default value if not available
      payment_method_names: currentAd.paymentMethods,
    }

    console.log("Prepared Ad Data for Update:", adData)

    // Add this line to specifically check the payment_method_names format
    console.log(
      "Payment Methods Format:",
      Array.isArray(adData.payment_method_names) ? "Array of strings ✅" : "Not an array ❌",
      adData.payment_method_names,
    )

    console.groupEnd()

    // Call the updateAd function with the prepared data
    return await updateAd(id, adData)
  } catch (error) {
    console.group("💥 Toggle Ad Status Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
    throw error
  }
}

/**
 * Delete an advertisement
 */
export async function deleteAd(adId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/adverts/${adId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.errors && data.errors.length > 0) {
      throw new Error(data.errors[0].message || "Failed to delete ad")
    }
  } catch (error) {
    console.error("Error deleting ad:", error)
    throw error
  }
}

/**
 * Create a new advertisement
 */
export async function createAd(payload: CreateAdPayload): Promise<{ success: boolean; data: CreateAdResponse }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.ads}`
    const headers = {
      ...AUTH.getAuthHeader(),
      Accept: "application/json",
      "Content-Type": "application/json",
    }

    // Format the request body exactly as expected by the API
    const requestBody = { data: payload }
    const body = JSON.stringify(requestBody)

    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    })

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
      console.log("Response Body (parsed):", data)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      data = { raw: responseText }
    }

    // Handle error responses
    if (!response.ok) {
      console.group("❌ Create Ad API Error")
      console.error("HTTP Status:", response.status, response.statusText)

      // Extract error information from the response
      let errorMessage = data.error || `Error creating advertisement: ${response.statusText}`
      let errorCode = null

      // Check for the specific error structure with errors array
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        if (data.errors[0].code) {
          errorCode = data.errors[0].code
          console.error("Error Code:", errorCode)

          // Map error codes to user-friendly messages
          switch (errorCode) {
            case "AdvertExchangeRateDuplicate":
              errorMessage = "You already have an ad with this exchange rate. Please use a different rate."
              break
            case "AdvertLimitReached":
              errorMessage = "You've reached the maximum number of ads allowed."
              break
            case "InvalidExchangeRate":
              errorMessage = "The exchange rate you provided is invalid."
              break
            case "InvalidOrderAmount":
              errorMessage = "The order amount limits are invalid."
              break
            case "InsufficientBalance":
              errorMessage = "You don't have enough balance to create this ad."
              break
            default:
              errorMessage = `Error: ${errorCode}. Please try again or contact support.`
          }
        } else if (data.errors[0].message) {
          errorMessage = data.errors[0].message
        }
      }

      // Check for specific HTTP status codes
      if (response.status === 400) {
        if (errorMessage.includes("limit") || errorCode === "AdvertLimitReached") {
          console.error("Error Type: Ad Limit Reached")
          console.groupEnd()
          throw new Error("ad_limit_reached")
        }
        console.error("Error Type: Bad Request")
      } else if (response.status === 401) {
        console.error("Error Type: Unauthorized - Check authentication token")
      } else if (response.status === 403) {
        console.error("Error Type: Forbidden - Check permissions")
      } else if (response.status === 404) {
        console.error("Error Type: Not Found - Check API endpoint")
      } else if (response.status === 500) {
        console.error("Error Type: Server Error")
      }

      console.error("Error Details:", errorMessage)
      console.groupEnd()

      // If we have an error code, include it in the error object
      if (errorCode) {
        const error = new Error(errorMessage)
        error.name = errorCode
        throw error
      } else {
        throw new Error(errorMessage)
      }
    }

    // Return success response
    console.log("✅ Create Ad API Success")
    console.groupEnd()

    return {
      success: true,
      data: {
        id: data.id || "000000",
        type: data.type || payload.type,
        status: data.status || "active",
        created_at: data.created_at || new Date().toISOString(),
      },
    }
  } catch (error) {
    // Log any exceptions
    console.group("💥 Create Ad API Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()

    throw error
  }
}

/**
 * Activate an advertisement (specific function for troubleshooting)
 */
export async function activateAd(adId: string): Promise<void> {
  try {
    // First, let's try to get the current ad data to use for activation
    console.group(`📤 Activating Ad ${adId}`)
    console.log("Fetching current ad data before activation")

    // Get the current ad data
    const currentAds = await getUserAdverts()
    const adToActivate = currentAds.find((ad) => ad.id === adId)

    if (!adToActivate) {
      console.error("Could not find ad with ID:", adId)
      throw new Error("Ad not found")
    }

    console.log("Found ad to activate:", adToActivate)

    // Extract rate value from string (e.g., "IDR 14500.0000" -> 14500.0000)
    let exchangeRate = 0
    if (adToActivate.rate && adToActivate.rate.value) {
      const rateMatch = adToActivate.rate.value.match(/([A-Z]+)\s+(\d+(?:\.\d+)?)/)
      if (rateMatch && rateMatch[2]) {
        exchangeRate = Number.parseFloat(rateMatch[2])
      }
    }

    // Prepare the payload for activation
    const payload = {
      is_active: true,
      minimum_order_amount: adToActivate.limits.min,
      maximum_order_amount: adToActivate.limits.max,
      available_amount: adToActivate.available.current,
      exchange_rate: exchangeRate,
      exchange_rate_type: "fixed",
      order_expiry_period: 15,
      description: "",
      payment_method_names: adToActivate.paymentMethods,
    }

    console.log("Activation payload:", payload)

    // Add this line to specifically check the payment_method_names format
    console.log(
      "Payment Methods Format:",
      Array.isArray(payload.payment_method_names) ? "Array of strings ✅" : "Not an array ❌",
      payload.payment_method_names,
    )

    // Use the updateAd function instead of a direct activation endpoint
    const url = `${API_BASE_URL}/api/adverts/${adId}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    console.log("Activation URL:", url)
    console.log("Headers:", headers)

    // Wrap the payload in a "data" object as expected by the API
    const body = JSON.stringify({ data: payload })
    console.log("Formatted Request Body:", body)

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body,
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
      console.log("Response Body (parsed):", responseData)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      responseData = {}
    }

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.error("Response Body:", responseText)
      console.groupEnd()
      throw new Error(`Failed to activate ad: ${response.statusText || responseText}`)
    }

    console.log("✅ Successfully activated ad")
    console.groupEnd()
  } catch (error) {
    console.group("💥 Activate Ad Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
    throw error
  }
}

// Update the MyAdsAPI namespace
export const MyAdsAPI = {
  getUserAdverts,
  getMyAds,
  toggleAdStatus,
  deleteAd,
  createAd,
  updateAd,
  activateAd, // Add the new function
}
