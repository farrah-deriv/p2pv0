import { API, AUTH } from "@/lib/local-variables"

// Type definitions
export interface Advertisement {
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
    amount: number
    total: number
    currency: string
  }
  paymentMethods: string[]
  advertiser: {
    id: number
    nickname: string
    completionRate: string
    rating: string
  }
  createdAt: string
  updatedAt: string
}

export interface SearchParams {
  type?: "Buy" | "Sell"
  currency?: string
  paymentMethod?: string
  amount?: number
}

// API Functions
/**
 * Get all available advertisements
 */
export async function getAdvertisements(params?: SearchParams): Promise<Advertisement[]> {
  try {
    const queryParams = new URLSearchParams()

    if (params) {
      if (params.type) queryParams.append("type", params.type)
      if (params.currency) queryParams.append("currency", params.currency)
      if (params.paymentMethod) queryParams.append("paymentMethod", params.paymentMethod)
      if (params.amount) queryParams.append("amount", params.amount.toString())
    }

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
    const url = `${API.baseUrl}${API.endpoints.ads}${queryString}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    // Log request details
    console.group("📤 GET Advertisements Request")
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.log("Search Params:", params)
    console.groupEnd()

    const startTime = performance.now()
    const response = await fetch(url, { headers })
    const endTime = performance.now()

    // Log response details
    console.group("📥 GET Advertisements Response")
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
    console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error fetching advertisements: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
      console.log("Response Body (parsed):", data)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      data = []
    }

    console.log("✅ Successfully fetched advertisements")
    console.groupEnd()

    return data
  } catch (error) {
    console.group("💥 Get Advertisements Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
    throw error
  }
}

/**
 * Get advertisement details by ID
 */
export async function getAdvertisementById(id: string): Promise<Advertisement> {
  try {
    const url = `${API.baseUrl}${API.endpoints.ads}/${id}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    // Log request details
    console.group("📤 GET Advertisement By ID Request")
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.log("Advertisement ID:", id)
    console.groupEnd()

    const startTime = performance.now()
    const response = await fetch(url, { headers })
    const endTime = performance.now()

    // Log response details
    console.group("📥 GET Advertisement By ID Response")
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
    console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error fetching advertisement: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
      console.log("Response Body (parsed):", data)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      data = {}
    }

    console.log("✅ Successfully fetched advertisement details")
    console.groupEnd()

    return data
  } catch (error) {
    console.group("💥 Get Advertisement By ID Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
    throw error
  }
}

/**
 * Create a new order from an advertisement
 */
export async function createOrderFromAd(
  adId: string,
  amount: number,
  paymentMethodId: string,
): Promise<{ orderId: string }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.orders}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }
    const body = JSON.stringify({
      advertisementId: adId,
      amount,
      paymentMethodId,
    })

    // Log request details
    console.group("📤 POST Create Order Request")
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.log("Request Body:", body)
    console.log("Ad ID:", adId)
    console.log("Amount:", amount)
    console.log("Payment Method ID:", paymentMethodId)
    console.groupEnd()

    const startTime = performance.now()
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    })
    const endTime = performance.now()

    // Log response details
    console.group("📥 POST Create Order Response")
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
    console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error creating order: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
      console.log("Response Body (parsed):", data)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      data = { orderId: "unknown" }
    }

    console.log("✅ Successfully created order")
    console.groupEnd()

    return data
  } catch (error) {
    console.group("💥 Create Order Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
    throw error
  }
}

/**
 * Get available payment methods
 */
export async function getPaymentMethods(): Promise<string[]> {
  try {
    const url = `${API.baseUrl}${API.endpoints.paymentMethods}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    // Log request details
    console.group("📤 GET Payment Methods Request")
    console.log("URL:", url)
    console.log("Headers:", headers)
    console.groupEnd()

    const startTime = performance.now()
    const response = await fetch(url, { headers })
    const endTime = performance.now()

    // Log response details
    console.group("📥 GET Payment Methods Response")
    console.log("Status:", response.status, response.statusText)
    console.log("Time:", `${(endTime - startTime).toFixed(2)}ms`)
    console.log("Response Headers:", Object.fromEntries([...response.headers.entries()]))

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error fetching payment methods: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
      console.log("Response Body (parsed):", data)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      data = []
    }

    console.log("✅ Successfully fetched payment methods")
    console.groupEnd()

    return data
  } catch (error) {
    console.group("💥 Get Payment Methods Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
    throw error
  }
}

