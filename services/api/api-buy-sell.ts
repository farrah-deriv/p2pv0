import { API, AUTH } from "@/lib/local-variables"

// Define the Advertisement interface directly in this file
export interface Advertisement {
  id: number
  user: {
    nickname: string
    id: number
    is_favourite: boolean
    created_at: number
    rating_average?: number
  }
  account_currency: string
  actual_maximum_order_amount: string
  available_amount: number
  created_at: number
  description: string
  exchange_rate: number
  exchange_rate_type: string
  is_active: boolean
  maximum_order_amount: string
  minimum_order_amount: string
  order_expiry_period: number
  payment_currency: string
  payment_method_names: string[]
  type: string
  user_rating_average?: number
}

// Define the SearchParams interface
export interface SearchParams {
  type?: string
  currency?: string
  paymentMethod?: string
  amount?: number
  nickname?: string
  sortBy?: string
  following?: boolean
  favourites_only?: number // Add this parameter for filtering by favourites
}

// Define the PaymentMethod interface
export interface PaymentMethod {
  display_name: string
  type: string
  method: string
}

/**
 * Get all available advertisements
 */
export async function getAdvertisements(params?: SearchParams): Promise<Advertisement[]> {
  try {
    const queryParams = new URLSearchParams()

    if (params) {
      if (params.type) queryParams.append("advert_type", params.type)
      if (params.currency) queryParams.append("payment_currency", params.currency)
      if (params.paymentMethod) queryParams.append("paymentMethod", params.paymentMethod)
      if (params.amount) queryParams.append("amount", params.amount.toString())
      if (params.nickname) queryParams.append("nickname", params.nickname)
      if (params.sortBy) queryParams.append("sort_by", params.sortBy)
      if (params.favourites_only) queryParams.append("favourites_only", params.favourites_only.toString())
    }

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""
    const url = `${API.baseUrl}${API.endpoints.ads}${queryString}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }
    const response = await fetch(url, { headers })

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
      data = { data: [] }
    }

    // Check if the response has a data property that is an array
    if (data && data.data && Array.isArray(data.data)) {
      console.log("✅ Successfully fetched advertisements")
      console.groupEnd()
      return data.data
    } else if (Array.isArray(data)) {
      console.log("✅ Successfully fetched advertisements")
      console.groupEnd()
      return data
    } else {
      console.warn("⚠️ API response is not in the expected format")
      console.log("Returning empty array")
      console.groupEnd()
      return []
    }
  } catch (error) {
    console.group("💥 Get Advertisements Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()
    // Return empty array on error to prevent map errors
    return []
  }
}

/**
 * Get advertiser profile by ID
 */
export async function getAdvertiserById(id: string | number): Promise<any> {
  try {
    // First try to get user data from the users endpoint
    const url = `${API.baseUrl}${API.endpoints.advertisers}/${id}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }
    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.warn(`Error Response: ${response.status} ${response.statusText}`)
      console.log("Falling back to getting advertiser data from ads...")
      console.groupEnd()

      // If the user endpoint fails, try to get user data from their ads
      return await getAdvertiserFromAds(id)
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

    console.log("✅ Successfully fetched advertiser details")
    console.groupEnd()

    return data
  } catch (error) {
    console.group("💥 Get Advertiser By ID Exception")
    console.error("Error:", error)
    console.error("Stack:", error instanceof Error ? error.stack : "No stack trace available")
    console.groupEnd()

    // Return a mock profile as a fallback
    return createMockAdvertiser(id)
  }
}

/**
 * Fallback function to get advertiser info from their ads
 */
async function getAdvertiserFromAds(advertiserId: string | number): Promise<any> {
  try {
    // Get the advertiser's ads
    const ads = await getAdvertiserAds(advertiserId)

    // If we have ads, extract the user info from the first ad
    if (ads && ads.length > 0 && ads[0].user) {
      const user = ads[0].user

      // Return a profile object with data from the ad
      return {
        id: user.id,
        nickname: user.nickname || "Unknown",
        is_online: true,
        joined_date: `Joined ${Math.floor((Date.now() / 1000 - user.created_at) / (60 * 60 * 24))} days ago`,
        rating: user.user_rating_average || 0,
        rating_count: 0,
        completion_rate: 100,
        orders_count: 0,
        is_verified: {
          id: true,
          address: false,
          phone: false,
        },
        is_favourite: user.is_favourite || false,
        stats: {
          buy_completion: { rate: 100, count: 0 },
          sell_completion: { rate: 100, count: 0 },
          avg_pay_time: "N/A",
          avg_release_time: "N/A",
          trade_partners: 0,
          trade_volume: { amount: 0, currency: "USD" },
        },
      }
    }

    // If no ads or no user info, return a mock profile
    return createMockAdvertiser(advertiserId)
  } catch (error) {
    console.error("Error getting advertiser from ads:", error)
    return createMockAdvertiser(advertiserId)
  }
}

/**
 * Create a mock advertiser profile for fallback
 */
function createMockAdvertiser(id: string | number): any {
  return {
    id: id,
    nickname: `User_${id}`,
    is_online: true,
    joined_date: "Joined recently",
    rating: 0,
    rating_count: 0,
    completion_rate: 100,
    orders_count: 0,
    is_verified: {
      id: false,
      address: false,
      phone: false,
    },
    is_favourite: false,
    stats: {
      buy_completion: { rate: 0, count: 0 },
      sell_completion: { rate: 0, count: 0 },
      avg_pay_time: "N/A",
      avg_release_time: "N/A",
      trade_partners: 0,
      trade_volume: { amount: 0, currency: "USD" },
    },
  }
}

/**
 * Get advertiser ads by advertiser ID
 */
export async function getAdvertiserAds(advertiserId: string | number): Promise<Advertisement[]> {
  try {
    const queryParams = new URLSearchParams({
      user_id: advertiserId.toString(),
    })

    const url = `${API.baseUrl}${API.endpoints.ads}?${queryParams.toString()}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      throw new Error(`Error fetching advertiser ads: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
    } catch (e) {
      data = { data: [] }
    }

    return data.data || []
  } catch (error) {
    return []
  }
}

/**
 * Toggle favourite status for an advertiser
 * @param advertiserId - The ID of the advertiser to follow/unfollow
 * @param isFavourite - Whether to add (true) or remove (false) from favourites
 * @returns Promise with the result of the operation
 */
export async function toggleFavouriteAdvertiser(
  advertiserId: number,
  isFavourite: boolean,
): Promise<{ success: boolean; message: string }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.userFavourites}`
    const method = isFavourite ? "POST" : "DELETE"

    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const body = JSON.stringify({
      data: {
        user_id: advertiserId,
      },
    })

    const response = await fetch(url, {
      method,
      headers,
      body,
    })

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to ${isFavourite ? "follow" : "unfollow"} advertiser: ${response.statusText}`,
      }
    }

    const responseText = await response.text()
    let data

    try {
      data = responseText ? JSON.parse(responseText) : {}
    } catch (e) {
      data = {}
    }

    return {
      success: true,
      message: `Successfully ${isFavourite ? "followed" : "unfollowed"} advertiser`,
    }
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
    }
  }
}

/**
 * Toggle block status for an advertiser
 * @param advertiserId - The ID of the advertiser to block/unblock
 * @param isBlocked - Whether to block (true) or unblock (false) the advertiser
 * @returns Promise with the result of the operation
 */
export async function toggleBlockAdvertiser(
  advertiserId: number,
  isBlocked: boolean,
): Promise<{ success: boolean; message: string }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.userBlocks}`
    const method = isBlocked ? "POST" : "DELETE"

    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const body = JSON.stringify({
      data: {
        user_id: advertiserId,
      },
    })

    const response = await fetch(url, {
      method,
      headers,
      body,
    })

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      console.groupEnd()
      return {
        success: false,
        message: `Failed to ${isBlocked ? "block" : "unblock"} advertiser: ${response.statusText}`,
      }
    }

    const responseText = await response.text()
    let data

    try {
      data = responseText ? JSON.parse(responseText) : {}
    } catch (e) {
      data = {}
    }

    return {
      success: true,
      message: `Successfully ${isBlocked ? "blocked" : "unblocked"} advertiser`,
    }
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
    }
  }
}

/**
 * Get all available payment methods
 */
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const url = `${API.baseUrl}${API.endpoints.availablePaymentMethods}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      throw new Error(`Error fetching payment methods: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
    } catch (e) {
      data = { data: [] }
    }

    if (data && data.data && Array.isArray(data.data)) {
      return data.data
    } else if (Array.isArray(data)) {
      return data
    } else
      return []
  }
  catch (error) {
    // Return empty array on error to prevent map errors
    return []
  }
}
