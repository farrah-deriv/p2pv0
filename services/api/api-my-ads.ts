import { USER, API, AUTH } from "@/lib/local-variables"

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
  payment_methods: string[]
  type?: string
}

export interface MyAd {
  id: string
  type: "Buy" | "Sell"
  rate: {
    value: string
    percentage: string
    currency: string
  }
  limits: {
    min: number
    max: number
    currency: string
  }
  available: {
    current: number
    total: number
    currency: string
  }
  paymentMethods: string[]
  status: "Active" | "Inactive"
  createdAt: string
  updatedAt: string
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
    // Use the user ID from local variables
    const userId = USER.id

    // Fetch adverts for this specific user
    const queryParams = new URLSearchParams({
      user_id: userId.toString(),
      show_inactive: "true", // Show inactive ads
    })

    const url = `${API.baseUrl}${API.endpoints.ads}?${queryParams.toString()}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "X-Data-Source": "live",
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      throw new Error("Failed to fetch user adverts")
    }

    const responseText = await response.text()
    let apiData

    try {
      apiData = JSON.parse(responseText)
      console.log("API Response:", apiData)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      apiData = { data: [] }
    }

    if (!apiData || !apiData.data || !Array.isArray(apiData.data)) {
      console.warn("Invalid API response format for user adverts")
      return []
    }

    // Transform API data to match our MyAd interface
    return apiData.data.map((advert: any) => {
      // Add null checks and default values
      const minAmount = Number(advert.minimum_order_amount) || 0
      const maxAmount = Number(advert.maximum_order_amount) || 0
      const exchangeRate = Number(advert.exchange_rate) || 0
      const currency = advert.payment_currency || "USD"
      const isActive = advert.is_active !== undefined ? advert.is_active : true

      // Determine status based on is_active flag
      const status: "Active" | "Inactive" = isActive ? "Active" : "Inactive"

      // Debug payment methods processing
      console.log(`Processing Ad ${advert.id}:`)
      console.log("  - Raw payment_methods:", advert.payment_methods)
      console.log("  - Is Array:", Array.isArray(advert.payment_methods))

      // Ensure payment methods is always an array
      let paymentMethods: string[] = []
      if (advert.payment_methods && Array.isArray(advert.payment_methods)) {
        paymentMethods = advert.payment_methods.filter((method: any) => method && typeof method === "string")
        console.log("  - Processed payment methods:", paymentMethods)
      } else {
        console.log("  - No valid payment methods found")
      }

      const transformedAd = {
        id: String(advert.id || "0"),
        type: ((advert.type || "buy") as string).toLowerCase() === "buy" ? "Buy" : "Sell",
        rate: {
          value: `${currency} ${exchangeRate.toFixed(4)}`,
          percentage: "0.1%", // Placeholder, replace with actual data when available
          currency: currency,
        },
        limits: {
          min: minAmount,
          max: maxAmount,
          currency: "USD",
        },
        available: {
          current: Number(advert.available_amount) || minAmount,
          total: maxAmount,
          currency: "USD",
        },
        paymentMethods: paymentMethods,
        status: status,
        createdAt: new Date(advert.created_at || Date.now()).toISOString(),
        updatedAt: new Date(advert.created_at || Date.now()).toISOString(),
      }

      console.log(`Final Ad ${advert.id} paymentMethods:`, transformedAd.paymentMethods)

      return transformedAd
    })
  } catch (error) {
    console.error("GET User Adverts Error:", error)
    return [] // Return empty array on error
  }
}

/**
 * Get all ads created by the current user with optional filters
 * This is now a wrapper around getUserAdverts for backward compatibility
 */
export async function getMyAds(filters?: AdFilters): Promise<MyAd[]> {
  try {
    const userAdverts = await getUserAdverts()

    // Apply filters if provided
    if (filters) {
      const filteredAds = userAdverts.filter((ad) => {
        if (filters.type && ad.type !== filters.type) return false
        if (filters.status && ad.status !== filters.status) return false
        if (filters.adId && ad.id !== filters.adId) return false
        return true
      })

      return filteredAds
    }

    return userAdverts
  } catch (error) {
    console.error("Filter My Ads Error:", error)
    return []
  }
}

/**
 * Update an advertisement
 */
export async function updateAd(id: string, adData: any): Promise<{ success: boolean }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.ads}/${id}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    // Ensure payment_method_names is an array of strings
    if (adData.payment_method_names) {
      // If it's not an array, convert it to an array with a single string
      if (!Array.isArray(adData.payment_method_names)) {
        adData.payment_method_names = [String(adData.payment_method_names)]
      } else {
        // If it is an array, ensure all elements are strings
        adData.payment_method_names = adData.payment_method_names.map((method) => String(method))
      }
    } else {
      // If it's undefined or null, set it to an empty array
      adData.payment_method_names = []
    }

    // Format the request body as required by the API
    // Wrap the data in a "data" object as expected by the API
    const requestData = { data: adData }
    const body = JSON.stringify(requestData)

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body,
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      responseData = {}
    }

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.error("Response Body:", responseText)
      throw new Error(`Failed to update ad: ${response.statusText || responseText}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Update Ad Error:", error)
    throw error
  }
}

/**
 * Toggle ad status (activate/deactivate)
 * This now uses the updateAd function to update all properties
 */
export async function toggleAdStatus(id: string, isActive: boolean, currentAd: MyAd): Promise<{ success: boolean }> {
  try {
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

    // Call the updateAd function with the prepared data
    return await updateAd(id, adData)
  } catch (error) {
    console.error("Toggle Ad Status Error:", error)
    throw error
  }
}

/**
 * Delete an advertisement
 */
export async function deleteAd(id: string): Promise<{ success: boolean }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.ads}/${id}`
    const headers = {
      ...AUTH.getAuthHeader(),
      Accept: "application/json",
    }

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      responseData = {}
    }

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      throw new Error(`Failed to delete ad: ${response.statusText}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Delete Ad Error:", error)
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
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      data = { raw: responseText }
    }

    // Handle error responses
    if (!response.ok) {
      // Extract error information from the response
      let errorMessage = data.error || `Error creating advertisement: ${response.statusText}`
      let errorCode = null

      // Check for the specific error structure with errors array
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        if (data.errors[0].code) {
          errorCode = data.errors[0].code

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
          throw new Error("ad_limit_reached")
        }
      }

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
    console.error("Create Ad Error:", error)
    throw error
  }
}

/**
 * Activate an advertisement (specific function for troubleshooting)
 */
export async function activateAd(id: string): Promise<{ success: boolean }> {
  try {
    // Get the current ad data
    const currentAds = await getUserAdverts()
    const adToActivate = currentAds.find((ad) => ad.id === id)

    if (!adToActivate) {
      console.error("Could not find ad with ID:", id)
      throw new Error("Ad not found")
    }

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

    // Use the updateAd function instead of a direct activation endpoint
    const url = `${API.baseUrl}${API.endpoints.ads}/${id}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    // Wrap the payload in a "data" object as expected by the API
    const body = JSON.stringify({ data: payload })

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body,
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      responseData = {}
    }

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.error("Response Body:", responseText)
      throw new Error(`Failed to activate ad: ${response.statusText || responseText}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Activate Ad Error:", error)
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
  activateAd,
}
