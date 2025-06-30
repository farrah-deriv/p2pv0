import { API, AUTH } from "@/lib/local-variables"
import type { APIAdvert, MyAd, AdFilters, CreateAdPayload, CreateAdResponse } from "@/app/ads/types"

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
    const url = `${API.baseUrl}${API.endpoints.myAds}${queryString}`

    console.log("Request URL:", url)

    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error fetching user adverts: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
      console.log("Response Body (parsed):", data)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      data = { data: [] }
    }

    // Handle different response structures
    let adverts: APIAdvert[] = []
    if (data && data.data && Array.isArray(data.data)) {
      adverts = data.data
    } else if (Array.isArray(data)) {
      adverts = data
    } else {
      console.warn("⚠️ API response is not in the expected format")
      console.groupEnd()
      return []
    }

    // Transform API response to UI format
    const transformedAdverts: MyAd[] = adverts.map((advert: APIAdvert) => {
      console.log("Processing advert payment methods:", advert.payment_methods)

      return {
        id: advert.id.toString(),
        type: advert.type === "buy" ? "Buy" : "Sell",
        rate: {
          value: advert.exchange_rate.toString(),
          percentage: "0", // This might need to be calculated based on market rate
          currency: advert.payment_currency,
        },
        limits: {
          min: advert.minimum_order_amount,
          max: advert.maximum_order_amount,
          currency: advert.account_currency,
        },
        available: {
          current: advert.available_amount,
          total: advert.maximum_order_amount,
          currency: advert.account_currency,
        },
        paymentMethods: advert.payment_methods || [], // Use payment_methods directly
        status: advert.is_active ? "Active" : "Inactive",
        description: advert.description || "",
        createdAt: new Date(advert.created_at * 1000).toISOString(),
        updatedAt: advert.updated_at
          ? new Date(advert.updated_at * 1000).toISOString()
          : new Date(advert.created_at * 1000).toISOString(),
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
 * Create a new advertisement
 */
export async function createAdvert(payload: CreateAdPayload): Promise<CreateAdResponse> {
  try {
    console.group("📡 Create Advert")
    console.log("Payload:", payload)

    const url = `${API.baseUrl}${API.endpoints.createAd}`
    console.log("Request URL:", url)

    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error creating advert: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
      console.log("Response Body (parsed):", data)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      console.log("Response Body (raw):", responseText)
      throw new Error("Invalid response format")
    }

    console.log("✅ Successfully created advert")
    console.groupEnd()

    return {
      id: data.id || data.data?.id || "",
      type: payload.type,
      status: "Active",
      created_at: new Date().toISOString(),
    }
  } catch (error) {
    console.group("💥 Create Advert Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
    throw error
  }
}

/**
 * Update an existing advertisement
 */
export async function updateAdvert(id: string, payload: Partial<CreateAdPayload>): Promise<void> {
  try {
    console.group("📡 Update Advert")
    console.log("ID:", id)
    console.log("Payload:", payload)

    const url = `${API.baseUrl}${API.endpoints.updateAd}/${id}`
    console.log("Request URL:", url)

    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error updating advert: ${response.statusText}`)
    }

    console.log("✅ Successfully updated advert")
    console.groupEnd()
  } catch (error) {
    console.group("💥 Update Advert Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
    throw error
  }
}

/**
 * Delete an advertisement
 */
export async function deleteAdvert(id: string): Promise<void> {
  try {
    console.group("📡 Delete Advert")
    console.log("ID:", id)

    const url = `${API.baseUrl}${API.endpoints.deleteAd}/${id}`
    console.log("Request URL:", url)

    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    })

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error deleting advert: ${response.statusText}`)
    }

    console.log("✅ Successfully deleted advert")
    console.groupEnd()
  } catch (error) {
    console.group("💥 Delete Advert Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
    throw error
  }
}

/**
 * Toggle advertisement status (activate/deactivate)
 */
export async function toggleAdvertStatus(id: string, isActive: boolean): Promise<void> {
  try {
    console.group("📡 Toggle Advert Status")
    console.log("ID:", id)
    console.log("Is Active:", isActive)

    const url = `${API.baseUrl}${API.endpoints.updateAd}/${id}`
    console.log("Request URL:", url)

    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ is_active: isActive }),
    })

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      throw new Error(`Error toggling advert status: ${response.statusText}`)
    }

    console.log("✅ Successfully toggled advert status")
    console.groupEnd()
  } catch (error) {
    console.group("💥 Toggle Advert Status Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
    throw error
  }
}
