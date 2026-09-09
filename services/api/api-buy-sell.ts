import { z } from "zod"
import { API, AUTH } from "@/lib/local-variables"
import { p2pFetch } from "./p2p-fetch"
import { useUserDataStore } from "@/stores/user-data-store"
import { parseArrayWithItemIsolation, reportedNumber, reportedString } from "@/lib/api/schema-coercion"
import { schemaReporter } from "@/lib/api/schema-reporter"

// Define the Advertisement interface directly in this file
export interface Advertisement {
  id: number
  user: {
    nickname: string
    id: number
    is_favourite: boolean
    created_at: number
    rating_average?: number
    is_online?: boolean
    last_online_at?: number | null
    rating_average_lifetime?: number
    order_count_lifetime?: number
    completion_average_30day?: number
    completion_rate_all_30day?: number
    trade_band?: string
    completion_rate_buy_30day?: number | null
    completion_rate_sell_30day?: number | null
    order_count_buy_30day?: number
    order_count_sell_30day?: number
    blocked_by_count?: number
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
  payment_currency_name?: string
  payment_method_names: string[]
  payment_methods: string[]
  type: string
  user_rating_average?: number
  effective_rate?: number
  effective_rate_display?: number
  is_private?: boolean
  version?: number
}

// Define the SearchParams interface
export interface SearchParams {
  type?: string
  currency?: string
  account_currency?: string
  paymentMethod?: string[]
  amount?: number
  nickname?: string
  sortBy?: string
  following?: boolean
  favourites_only?: number
  page?: number
  per_page?: number
  is_private?: boolean
}

// Define the PaymentMethod interface
export interface PaymentMethod {
  display_name: string
  type: string
  method: string
}

const ADVERTS_ENDPOINT = "p2p/v1/adverts"

// Validates only the advert's money/decimal fields — rating/completion-rate
// fields on `user` stay out of scope, matching the mobile pass. `.passthrough()`
// keeps every other field (id, user, account_currency, ...) untouched.
const advertMoneyFieldsSchema = z
  .object({
    exchange_rate: reportedNumber({
      endpoint: ADVERTS_ENDPOINT,
      field: "data[].exchange_rate",
      reporter: schemaReporter,
    }),
    effective_rate: reportedNumber({
      endpoint: ADVERTS_ENDPOINT,
      field: "data[].effective_rate",
      reporter: schemaReporter,
    })
      .nullable()
      .optional(),
    effective_rate_display: reportedNumber({
      endpoint: ADVERTS_ENDPOINT,
      field: "data[].effective_rate_display",
      reporter: schemaReporter,
    })
      .nullable()
      .optional(),
    // These four caused a live incident: required here but apparently null/
    // absent for some real adverts, so every item in a query (e.g. Markets
    // filtered to IDR) was getting rejected -> "all items rejected" ->
    // SchemaMismatchError for the whole list. `minimum_order_amount`/
    // `maximum_order_amount`/`actual_maximum_order_amount` already render
    // with `|| "N/A"` fallbacks in market.orderLimits, and `available_amount`
    // isn't read anywhere in Markets' UI at all (only in My Ads) — none of
    // these are worth failing the whole list over. `exchange_rate` stays
    // required: `order-sidebar.tsx` does unguarded `current.exchange_rate / 100`.
    minimum_order_amount: reportedString({
      endpoint: ADVERTS_ENDPOINT,
      field: "data[].minimum_order_amount",
      reporter: schemaReporter,
    })
      .nullable()
      .optional(),
    maximum_order_amount: reportedString({
      endpoint: ADVERTS_ENDPOINT,
      field: "data[].maximum_order_amount",
      reporter: schemaReporter,
    })
      .nullable()
      .optional(),
    actual_maximum_order_amount: reportedString({
      endpoint: ADVERTS_ENDPOINT,
      field: "data[].actual_maximum_order_amount",
      reporter: schemaReporter,
    })
      .nullable()
      .optional(),
    available_amount: reportedNumber({
      endpoint: ADVERTS_ENDPOINT,
      field: "data[].available_amount",
      reporter: schemaReporter,
    })
      .nullable()
      .optional(),
  })
  .passthrough()

/**
 * Get all available advertisements
 */
export async function getAdvertisements(params?: SearchParams, signal?: AbortSignal): Promise<Advertisement[]> {
  try {
    const queryParams = new URLSearchParams()
    if (params) {
      if (params.type) queryParams.append("advert_type", params.type)
      if (params.currency) queryParams.append("payment_currency", params.currency)
      if (params.account_currency) queryParams.append("account_currency", params.account_currency)
      if (params.paymentMethod) {
        if (params.paymentMethod.length === 0) {
          queryParams.append("payment_methods", JSON.stringify([]))
        } else {
          params.paymentMethod.forEach((method) => {
            queryParams.append("payment_methods[]", method)
          })
        }
      }
      if (params.amount) queryParams.append("amount", params.amount.toString())
      if (params.nickname) queryParams.append("nickname", params.nickname)
      if (params.sortBy) queryParams.append("sort_by", params.sortBy)
      if (params.favourites_only) queryParams.append("favourites_only", params.favourites_only.toString())
      if (params.is_private) queryParams.append("private_only", params.is_private.toString())
      if (params.page !== undefined) queryParams.append("page", params.page.toString())
      if (params.per_page !== undefined) queryParams.append("per_page", params.per_page.toString())
    }

    const auth_country_code = useUserDataStore.getState().residenceCountry
    if (auth_country_code) queryParams.append("auth_country_code", auth_country_code)

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ""

    const url = `${API.baseUrl}${API.endpoints.ads}${queryString}`
    const headers = AUTH.getAuthHeader()
    const response = await p2pFetch(url, {
      headers,
      credentials: "include",
      signal,
    })

    if (!response.ok) {
      console.error("Error Response:", response.status, response.statusText)
      throw new Error(`Error fetching advertisements: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
    } catch (e) {
      data = { data: [] }
    }

    const rawItems: unknown[] =
      data && data.data && Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []

    // zod's `.passthrough()` preserves every field at runtime (id, user,
    // account_currency, ...) beyond the money fields it validates/coerces —
    // `z.infer` just doesn't reflect passthrough keys in its type, hence the cast.
    return parseArrayWithItemIsolation(advertMoneyFieldsSchema, rawItems, {
      endpoint: ADVERTS_ENDPOINT,
      field: "data",
      reporter: schemaReporter,
    }) as unknown as Advertisement[]
  } catch (error) {
    console.error("Error fetching advertisements:", error)
    throw error
  }
}

/**
 * Get advertiser profile by ID
 */
export async function getAdvertiserById(id: string | number): Promise<any> {
  try {
    // First try to get user data from the users endpoint
    const url = `${API.baseUrl}${API.endpoints.advertisers}/${id}`
    const headers = AUTH.getAuthHeader()
    const response = await p2pFetch(url, {
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      console.warn(`Error Response: ${response.status} ${response.statusText}`)
      console.groupEnd()

      // If the user endpoint fails, try to get user data from their ads
      return await getAdvertiserFromAds(id)
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.warn("⚠️ Could not parse response as JSON:", e)
      data = {}
    }

    return data
  } catch (error) {
    console.error("Error:", error)

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
        is_online: user.is_online,
        joined_date: `Joined ${Math.floor((Date.now() / 1000 - user.created_at) / (60 * 60 * 24))} days ago`,
        rating: user.rating_average || 0,
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
export async function getAdvertiserAds(advertiserId: string | number, page?: number, perPage?: number): Promise<Advertisement[]> {
  try {
    const queryParams = new URLSearchParams({
      user_id: advertiserId.toString(),
      account_currency: "USD",
    })
    if (page !== undefined) queryParams.append("page", page.toString())
    if (perPage !== undefined) queryParams.append("per_page", perPage.toString())

    const url = `${API.baseUrl}${API.endpoints.ads}?${queryParams.toString()}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }

    const response = await p2pFetch(url, {
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Error fetching advertiser ads: ${response.statusText}`)
    }

    const responseText = await response.text()
    let data

    try {
      data = responseText ? JSON.parse(responseText) : {}
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
): Promise<{ success: boolean; message: string; code?: string }> {
  try {
    const url = isFavourite
      ? `${API.baseUrl}${API.endpoints.userFavourites}`
      : `${API.baseUrl}${API.endpoints.userFavourites}/${advertiserId}`
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

    const response = await p2pFetch(url, {
      method,
      credentials: "include",
      headers,
      ...(isFavourite && { body }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData: any
      try {
        errorData = errorText ? JSON.parse(errorText) : {}
      } catch (e) {
        errorData = {}
      }
      const code = errorData?.errors?.[0]?.code

      return {
        success: false,
        message: `Failed to ${isFavourite ? "follow" : "unfollow"} advertiser: ${response.statusText}`,
        code,
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
    const url = isBlocked
      ? `${API.baseUrl}${API.endpoints.userBlocks}`
      : `${API.baseUrl}${API.endpoints.userBlocks}/${advertiserId}`
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

    const response = await p2pFetch(url, {
      method,
      credentials: "include",
      headers,
      ...(isBlocked && { body }),
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
    const headers = AUTH.getAuthHeader()

    const response = await p2pFetch(url, {
      headers,
      credentials: "include",
    })

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
    } else return []
  } catch (error) {
    // Return empty array on error to prevent map errors
    return []
  }
}

