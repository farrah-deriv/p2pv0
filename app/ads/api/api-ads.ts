import { API, AUTH } from "@/lib/local-variables"
import type { APIAdvert, MyAd, AdFilters, CreateAdPayload, CreateAdResponse } from "../types"

/**
 * Get user's advertisements
 */
export async function getUserAdverts(filters?: AdFilters): Promise<MyAd[]> {
  try {
    console.group("📡 Get User Adverts")
    console.log("Filters:", filters)

    const queryParams = new URLSearchParams()

    if (filters?.type) {
      queryParams.append("type", filters.type.toLowerCase())
    }
    if (filters?.status) {
      queryParams.append("status", filters.status.toLowerCase())
    }
    if (filters?.adId) {
      queryParams.append("id", filters.adId)
    }

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
    const url = `${API.baseUrl}${API.endpoints.ads}${queryString}`

    console.log("Request URL:", url)

    const headers = {
      ...AUTH.getAuthHeader(),
      "X-Data-Source": "live",
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error fetching user adverts: ${response.statusText}`)
    }

    const responseText = await response.text()
    let apiData

    try {
      apiData = JSON.parse(responseText)
      console.log("Response Body (parsed):", apiData)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      apiData = { data: [] }
    }

    if (!apiData || !apiData.data || !Array.isArray(apiData.data)) {
      console.warn("⚠️ API response is not in the expected format")
      console.groupEnd()
      return []
    }

    // Transform API response to UI format
    const transformedAdverts: MyAd[] = apiData.data.map((advert: APIAdvert) => {
      console.log("Processing advert payment methods:", advert.payment_methods)

      return {
        id: advert.id.toString(),
        type: advert.type === "buy" ? "Buy" : "Sell",
        rate: {
          value: advert.payment_currency + " " + advert.exchange_rate.toFixed(4),
          percentage: "0.1%", // Placeholder, replace with actual data when available
          currency: advert.payment_currency,
        },
        limits: {
          min: advert.minimum_order_amount || 0,
          max: advert.maximum_order_amount || 0,
          currency: "USD",
        },
        available: {
          current: advert.available_amount || 0,
          total: advert.maximum_order_amount || 0,
          currency: "USD",
        },
        paymentMethods: advert.payment_methods || [], // Use payment_methods directly
        status: advert.is_active ? "Active" : "Inactive",
        description: advert.description || "",
        createdAt: new Date(advert.created_at * 1000 || Date.now()).toISOString(),
        updatedAt: new Date(advert.updated_at * 1000 || Date.now()).toISOString(),
      }
    })

    console.log("✅ Successfully fetched and transformed user adverts")
    console.log("Transformed adverts:", transformedAdverts)
    console.groupEnd()

    return transformedAdverts
  } catch (error) {
    console.group("💥 Get User Adverts Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
    return []
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
    console.error("Error:", error)
    return []
  }
}

/**
 * Create a new advertisement
 */
export async function createAd(
  payload: CreateAdPayload,
): Promise<{ success: boolean; data: CreateAdResponse; errors?: any[] }> {
  try {
    console.group("📡 Create Advert")
    console.log("Payload:", payload)

    const url = `${API.baseUrl}${API.endpoints.ads}`
    console.log("Request URL:", url)

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

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error creating advert: ${response.statusText}`)
    }

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
      console.log("Response Body (parsed):", responseData)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      responseData = { raw: responseText }
    }

    console.log("✅ Successfully created advert")
    console.groupEnd()

    return {
      success: true,
      data: {
        id: responseData.data?.id || "000000",
        type: responseData.data?.type || payload.type,
        status: responseData.data?.status || "active",
        created_at: responseData.data?.created_at || new Date().toISOString(),
      },
      errors: responseData.errors || [],
    }
  } catch (error) {
    console.group("💥 Create Advert Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()

    // Return error in a structured format
    return {
      success: false,
      data: {
        id: "",
        type: payload.type,
        status: "inactive",
        created_at: new Date().toISOString(),
      },
      errors: [
        {
          message: error instanceof Error ? error.message : "An unexpected error occurred",
          code: error instanceof Error ? error.name : "UnknownError",
        },
      ],
    }
  }
}

/**
 * Update an existing advertisement
 */
export async function updateAd(id: string, adData: any): Promise<{ success: boolean; errors?: any[] }> {
  try {
    console.group("📡 Update Advert")
    console.log("ID:", id)
    console.log("Payload:", adData)

    const url = `${API.baseUrl}${API.endpoints.ads}/${id}`
    console.log("Request URL:", url)

    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    // Ensure payment_methods is an array of strings (updated field name)
    if (adData.payment_method_names) {
      // Convert old field name to new field name
      adData.payment_methods = adData.payment_method_names
      delete adData.payment_method_names
    }

    if (adData.payment_methods) {
      // If it's not an array, convert it to an array with a single string
      if (!Array.isArray(adData.payment_methods)) {
        adData.payment_methods = [String(adData.payment_methods)]
      } else {
        // If it is an array, ensure all elements are strings
        adData.payment_methods = adData.payment_methods.map((method) => String(method))
      }
    } else {
      // If it's undefined or null, set it to an empty array
      adData.payment_methods = []
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
      console.log("Response Body (parsed):", responseData)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      responseData = {}
    }

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.error("Response Body:", responseText)

      // Extract error information
      let errors = []
      if (responseData && responseData.errors) {
        errors = responseData.errors
      } else {
        errors = [{ message: `Failed to update ad: ${response.statusText || responseText}` }]
      }

      return {
        success: false,
        errors: errors,
      }
    }

    console.log("✅ Successfully updated advert")
    console.groupEnd()

    return {
      success: true,
      errors: responseData.errors || [],
    }
  } catch (error) {
    console.group("💥 Update Advert Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()

    // Return error in a structured format
    return {
      success: false,
      errors: [{ message: error instanceof Error ? error.message : "An unexpected error occurred" }],
    }
  }
}

/**
 * Delete an advertisement
 */
export async function deleteAd(id: string): Promise<{ success: boolean; errors?: any[] }> {
  try {
    console.group("📡 Delete Advert")
    console.log("ID:", id)

    const url = `${API.baseUrl}${API.endpoints.ads}/${id}`
    console.log("Request URL:", url)

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
      console.log("Response Body (parsed):", responseData)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      responseData = {}
    }

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()

      // Extract error information
      let errors = []
      if (responseData && responseData.errors) {
        errors = responseData.errors
      } else {
        errors = [{ message: `Failed to delete ad: ${response.statusText}` }]
      }

      return {
        success: false,
        errors: errors,
      }
    }

    console.log("✅ Successfully deleted advert")
    console.groupEnd()

    return { success: true }
  } catch (error) {
    console.group("💥 Delete Advert Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()

    // Return error in a structured format
    return {
      success: false,
      errors: [{ message: error instanceof Error ? error.message : "An unexpected error occurred" }],
    }
  }
}

/**
 * Toggle advertisement status (activate/deactivate)
 */
export async function toggleAdStatus(id: string, isActive: boolean): Promise<{ success: boolean; errors?: any[] }> {
  try {
    console.group(`📡 Toggle Ad Status (${isActive ? "Activate" : "Deactivate"})`)
    console.log("Ad ID:", id)
    console.log("Setting is_active to:", isActive)

    // Use the updateAd function instead of a direct activation endpoint
    const url = `${API.baseUrl}${API.endpoints.ads}/${id}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ data: { is_active: isActive } }),
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

      // Extract error information
      let errors = []
      if (responseData && responseData.errors) {
        errors = responseData.errors
      } else {
        errors = [{ message: `Failed to toggle ad status: ${response.statusText || responseText}` }]
      }

      return {
        success: false,
        errors: errors,
      }
    }

    console.log("✅ Successfully toggled advert status")
    console.groupEnd()

    return { success: true }
  } catch (error) {
    console.group("💥 Toggle Advert Status Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()

    // Return error in a structured format
    return {
      success: false,
      errors: [{ message: error instanceof Error ? error.message : "An unexpected error occurred" }],
    }
  }
}

/**
 * Activate an advertisement (specific function for troubleshooting)
 */
export async function activateAd(id: string): Promise<{ success: boolean; errors?: any[] }> {
  try {
    console.group(`📡 Activating Ad ${id}`)
    console.log("Fetching current ad data before activation")

    // Get the current ad data
    const currentAds = await getUserAdverts()
    const adToActivate = currentAds.find((ad) => ad.id === id)

    if (!adToActivate) {
      console.error("Could not find ad with ID:", id)
      return {
        success: false,
        errors: [{ message: "Ad not found" }],
      }
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
      payment_methods: adToActivate.type === "Buy" ? adToActivate.paymentMethods : [], // Updated field name
    }

    console.log("Activation payload:", payload)

    // Add this line to specifically check the payment_methods format
    console.log(
      "Payment Methods Format:",
      Array.isArray(payload.payment_methods) ? "Array of strings ✅" : "Not an array ❌",
      payload.payment_methods,
    )

    // Use the updateAd function instead of a direct activation endpoint
    const url = `${API.baseUrl}${API.endpoints.ads}/${id}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    console.log("Activation URL:", url)
    console.log("Headers:", headers)

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

      // Extract error information
      let errors = []
      if (responseData && responseData.errors) {
        errors = responseData.errors
      } else {
        errors = [{ message: `Failed to activate ad: ${response.statusText || responseText}` }]
      }

      return {
        success: false,
        errors: errors,
      }
    }

    console.log("✅ Successfully activated ad")
    console.groupEnd()

    return { success: true }
  } catch (error) {
    console.group("💥 Activate Ad Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()

    // Return error in a structured format
    return {
      success: false,
      errors: [{ message: error instanceof Error ? error.message : "An unexpected error occurred" }],
    }
  }
}

// Export all functions as a single object for easier imports
export const AdsAPI = {
  getUserAdverts,
  getMyAds,
  toggleAdStatus,
  deleteAd,
  createAd,
  updateAd,
  activateAd,
}
