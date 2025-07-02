import { USER, API, AUTH } from "@/lib/local-variables"
import type { APIAdvert, MyAd, AdFilters, CreateAdPayload, CreateAdResponse } from "../types"

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
      show_unorderable: "true", // Show unorderable ads
      show_unlisted: "true", // Show unlisted ads
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
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      apiData = { data: [] }
    }
    console.groupEnd()

    if (!apiData || !apiData.data || !Array.isArray(apiData.data)) {
      return []
    }

    // Transform API data to match our MyAd interface
    return apiData.data.map((advert: APIAdvert) => {
      // Add null checks and default values
      const minAmount = advert.minimum_order_amount || 0
      const maxAmount = advert.maximum_order_amount || 0
      const exchangeRate = advert.exchange_rate || 0
      const currency = advert.payment_currency || "USD"
      const isActive = advert.is_active !== undefined ? advert.is_active : true
      const availableAmount = advert.available_amount || 0
      const actualMaxAmount = advert.actual_maximum_order_amount || maxAmount

      // Determine status based on is_active flag
      const status: "Active" | "Inactive" = isActive ? "Active" : "Inactive"

      return {
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
          current: availableAmount,
          total: actualMaxAmount,
          currency: "USD",
        },
        paymentMethods: advert.payment_methods || [],
        status: status,
        description: advert.description || "", // Make sure to include the description field
        createdAt: new Date((advert.created_at || 0) * 1000 || Date.now()).toISOString(),
        updatedAt: new Date((advert.created_at || 0) * 1000 || Date.now()).toISOString(),
      }
    })
  } catch (error) {
    console.error("Error:", error)
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
    console.error("Error:", error)
    return []
  }
}

/**
 * Update an advertisement
 */
export async function updateAd(
  id: string,
  adData: any,
  adType?: string,
): Promise<{ success: boolean; errors?: any[] }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.ads}/${id}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    // Determine ad type from parameter or data
    const type = adType || adData.type || "buy"
    const isBuyAd = type.toLowerCase() === "buy"

    // Handle payment methods based on ad type
    if (isBuyAd) {
      // For Buy ads: use payment_method_names (array of strings)
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

      // Remove payment_method_ids if it exists (shouldn't be used for buy ads)
      delete adData.payment_method_ids
    } else {
      // For Sell ads: use payment_method_ids (array of numbers)
      if (adData.payment_method_ids) {
        // Ensure it's an array of numbers
        if (!Array.isArray(adData.payment_method_ids)) {
          adData.payment_method_ids = [Number(adData.payment_method_ids)]
        } else {
          adData.payment_method_ids = adData.payment_method_ids.map((id) => Number(id))
        }
      } else if (adData.payment_method_names) {
        // If payment_method_names is provided for sell ads, convert to IDs
        // This is a fallback - ideally payment_method_ids should be provided directly
        adData.payment_method_ids = []
      } else {
        adData.payment_method_ids = []
      }

      // Remove payment_method_names for sell ads
      delete adData.payment_method_names
    }

    // Format the request body as required by the API
    // Wrap the data in a "data" object as expected by the API
    const requestData = { data: adData }
    const body = JSON.stringify(requestData)

    console.group(`📤 PATCH Update Ad Request (${isBuyAd ? "Buy" : "Sell"} Ad)`)
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.log("Ad ID:", id)
    console.log("Ad Type:", type)
    console.log("Request Data:", requestData)
    console.log("Request Body:", body)

    if (isBuyAd) {
      console.log(
        "Payment Methods (Names):",
        Array.isArray(adData.payment_method_names) ? "Array of strings ✅" : "Not an array ❌",
        adData.payment_method_names,
      )
    } else {
      console.log(
        "Payment Methods (IDs):",
        Array.isArray(adData.payment_method_ids) ? "Array of numbers ✅" : "Not an array ❌",
        adData.payment_method_ids,
      )
    }

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
        errors = [{ message: `Failed to update ad: ${response.statusText || responseText}` }]
      }

      return {
        success: false,
        errors: errors,
      }
    }

    console.log("✅ Successfully updated ad")
    console.groupEnd()

    return {
      success: true,
      errors: responseData.errors || [],
    }
  } catch (error) {
    console.group("💥 Update Ad Exception")
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
 * Toggle ad status (activate/deactivate)
 * This now uses the updateAd function to update all properties
 */
export async function toggleAdStatus(
  id: string,
  isActive: boolean,
  currentAd: MyAd,
): Promise<{ success: boolean; errors?: any[] }> {
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

    // Prepare ad data based on ad type
    const isBuyAd = currentAd.type === "Buy"
    const adData: any = {
      is_active: isActive,
      minimum_order_amount: currentAd.limits.min,
      maximum_order_amount: currentAd.limits.max,
      available_amount: currentAd.available.current,
      exchange_rate: exchangeRate,
      exchange_rate_type: "fixed",
      order_expiry_period: 15, // Default value if not available
      description: "", // Default value if not available
    }

    // Add payment methods based on ad type
    if (isBuyAd) {
      adData.payment_method_names = currentAd.paymentMethods
    } else {
      // For sell ads, we need payment method IDs
      // If we only have names, we'll need to convert them or pass empty array
      adData.payment_method_ids = []
    }

    console.log("Prepared Ad Data for Update:", adData)
    console.groupEnd()

    // Call the updateAd function with the prepared data and ad type
    return await updateAd(id, adData, currentAd.type)
  } catch (error) {
    console.group("💥 Toggle Ad Status Exception")
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
    const url = `${API.baseUrl}${API.endpoints.ads}/${id}`
    const headers = {
      ...AUTH.getAuthHeader(),
      Accept: "application/json",
    }

    // Log request details
    console.group("📤 DELETE Ad Request")
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.log("Ad ID:", id)
    console.groupEnd()

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

    console.log("✅ Successfully deleted ad")
    console.groupEnd()

    return { success: true }
  } catch (error) {
    console.group("💥 Delete Ad Exception")
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
 * Create a new advertisement
 */
export async function createAd(
  payload: CreateAdPayload,
): Promise<{ success: boolean; data: CreateAdResponse; errors?: any[] }> {
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

    // Log request details
    console.group("📤 POST Create Ad Request")
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
    let responseData

    try {
      responseData = JSON.parse(responseText)
      console.log("Response Body (parsed):", responseData)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      responseData = { raw: responseText }
    }

    // Handle error responses
    if (!response.ok) {
      console.group("❌ Create Ad API Error")
      console.error("HTTP Status:", response.status, response.statusText)

      // Extract error information from the response
      let errorMessage = responseData.error || `Error creating advertisement: ${response.statusText}`
      let errorCode = null

      // Check for the specific error structure with errors array
      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        if (responseData.errors[0].code) {
          errorCode = responseData.errors[0].code
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
            case "AdvertTotalAmountExceeded":
              errorMessage = "The total amount exceeds your available balance. Please enter a smaller amount."
              break
            default:
              errorMessage = `Error: ${errorCode}. Please try again or contact support.`
          }
        } else if (responseData.errors[0].message) {
          errorMessage = responseData.errors[0].message
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

      // Create an error object with the appropriate name/code
      const error = new Error(errorMessage)
      if (errorCode) {
        error.name = errorCode
      }
      throw error
    }

    // Return success response
    console.log("✅ Create Ad API Success")
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
    // Log any exceptions
    console.group("💥 Create Ad API Exception")
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
 * Activate an advertisement (specific function for troubleshooting)
 */
export async function activateAd(id: string): Promise<{ success: boolean; errors?: any[] }> {
  try {
    // First, let's try to get the current ad data to use for activation
    console.group(`📤 Activating Ad ${id}`)
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

    // Prepare the payload for activation based on ad type
    const isBuyAd = adToActivate.type === "Buy"
    const payload: any = {
      is_active: true,
      minimum_order_amount: adToActivate.limits.min,
      maximum_order_amount: adToActivate.limits.max,
      available_amount: adToActivate.available.current,
      exchange_rate: exchangeRate,
      exchange_rate_type: "fixed",
      order_expiry_period: 15,
      description: "",
    }

    // Add payment methods based on ad type
    if (isBuyAd) {
      payload.payment_method_names = adToActivate.paymentMethods
    } else {
      // For sell ads, we need payment method IDs
      payload.payment_method_ids = []
    }

    console.log("Activation payload:", payload)

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
