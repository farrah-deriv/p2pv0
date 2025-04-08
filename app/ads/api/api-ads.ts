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

    // Log request details
    console.group("📤 GET User Adverts Request")
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.log("User ID:", userId)
    console.log("Show Inactive:", true)
    console.groupEnd()

    const startTime = performance.now()
    const response = await fetch(url, { headers })
    const endTime = performance.now()

    // Log response details
    console.group("📥 GET User Adverts Response")
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
    console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error("Failed to fetch user adverts")
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
    console.groupEnd()

    if (!apiData || !apiData.data || !Array.isArray(apiData.data)) {
      console.warn("Invalid API response format for user adverts")
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
        paymentMethods: advert.payment_method_names || [],
        status: status,
        description: advert.description || "", // Make sure to include the description field
        createdAt: new Date((advert.created_at || 0) * 1000 || Date.now()).toISOString(),
        updatedAt: new Date((advert.created_at || 0) * 1000 || Date.now()).toISOString(),
      }
    })
  } catch (error) {
    console.group("💥 GET User Adverts Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
    return [] // Return empty array on error
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
export async function updateAd(id: string, adData: any): Promise<{ success: boolean; errors?: any[] }> {
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

    // Log request details
    console.group(`📤 PATCH Update Ad Request`)
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.log("Ad ID:", id)
    console.log("Request Data:", requestData) // Log the actual object before stringification
    console.log("Request Body:", body)
    // Add this line to specifically check the payment_method_names format
    console.log(
      "Payment Methods Format:",
      Array.isArray(adData.payment_method_names) ? "Array of strings ✅" : "Not an array ❌",
      adData.payment_method_names,
    )
    console.groupEnd()

    const startTime = performance.now()
    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body,
    })
    const endTime = performance.now()

    // Log response details
    console.group(`📥 PATCH Update Ad Response`)
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
    console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

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
      payment_method_names: currentAd.type === "Buy" ? currentAd.paymentMethods : [],
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

    const startTime = performance.now()
    const response = await fetch(url, {
      method: "DELETE",
      headers,
    })
    const endTime = performance.now()

    // Log response details
    console.group("📥 DELETE Ad Response")
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
    console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

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

    const startTime = performance.now()
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    })
    const endTime = performance.now()

    // Log response details
    console.group("📥 POST Create Ad Response")
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
    console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

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
      payment_method_names: adToActivate.type === "Buy" ? adToActivate.paymentMethods : [],
    }

    console.log("Activation payload:", payload)

    // Add this line to specifically check the payment_method_names format
    console.log(
      "Payment Methods Format:",
      Array.isArray(payload.payment_method_names) ? "Array of strings ✅" : "Not an array ❌",
      payload.payment_method_names,
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
    console.log("Formatted Request Body:", body)

    const startTime = performance.now()
    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body,
    })
    const endTime = performance.now()

    // Log response details
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)

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
