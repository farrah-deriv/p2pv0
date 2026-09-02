import { z } from "zod"
import { normalizeUpdateAdPayload } from "@/lib/ads/advert-edit-patch"
import { p2pFetch } from "./p2p-fetch"
import { API, AUTH } from "@/lib/local-variables"
import { useUserDataStore } from "@/stores/user-data-store"
import { parseArrayWithItemIsolation, parseWithSchema, reportedNumber } from "@/lib/api/schema-coercion"
import { schemaReporter } from "@/lib/api/schema-reporter"

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
  open_order_amount?: number
  completed_order_amount?: number
  created_at?: number
  description: string
  exchange_rate: number
  exchange_rate_type: string
  is_active: boolean
  maximum_order_amount: number
  minimum_order_amount: number
  /** Current API field for minimum account age (days). */
  minimum_join_days?: number | null
  /** @deprecated Legacy response key; prefer {@link minimum_join_days}. */
  minimum_joined_days?: number | null
  minimum_completion_rate_30day?: number | null
  minimum_trade_band?: "bronze" | "silver" | "gold" | "diamond" | null
  order_expiry_period: number
  payment_currency?: string
  payment_method_names: string[]
  type?: string
}

const MY_ADS_ENDPOINT = "p2p/v1/adverts"

// Same telemetry endpoint as api-buy-sell.ts's adverts schema — this is the
// My Ads (own-ads) view of the same `/p2p/v1/adverts` list, per-item shaped
// as `APIAdvert` rather than `Advertisement`. Validates only money fields;
// `.passthrough()` keeps everything else untouched.
const myAdvertMoneyFieldsSchema = z
  .object({
    exchange_rate: reportedNumber({
      endpoint: MY_ADS_ENDPOINT,
      field: "data[].exchange_rate",
      reporter: schemaReporter,
    }),
    minimum_order_amount: reportedNumber({
      endpoint: MY_ADS_ENDPOINT,
      field: "data[].minimum_order_amount",
      reporter: schemaReporter,
    }),
    maximum_order_amount: reportedNumber({
      endpoint: MY_ADS_ENDPOINT,
      field: "data[].maximum_order_amount",
      reporter: schemaReporter,
    }),
    actual_maximum_order_amount: reportedNumber({
      endpoint: MY_ADS_ENDPOINT,
      field: "data[].actual_maximum_order_amount",
      reporter: schemaReporter,
    })
      .nullable()
      .optional(),
    available_amount: reportedNumber({
      endpoint: MY_ADS_ENDPOINT,
      field: "data[].available_amount",
      reporter: schemaReporter,
    }),
    open_order_amount: reportedNumber({
      endpoint: MY_ADS_ENDPOINT,
      field: "data[].open_order_amount",
      reporter: schemaReporter,
    })
      .nullable()
      .optional(),
    completed_order_amount: reportedNumber({
      endpoint: MY_ADS_ENDPOINT,
      field: "data[].completed_order_amount",
      reporter: schemaReporter,
    })
      .nullable()
      .optional(),
  })
  .passthrough()

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
  account_currency?: string
  payment_currency?: string
}

export interface AdFilters {
  type?: "Buy" | "Sell"
  status?: "Active" | "Inactive"
  adId?: string
}

/**
 * One entry of an advert API `errors[]` payload. Extra fields are carried through
 * untouched so callers can act on them — see {@link AdvertApiError.detail}.
 *
 * The wire shape is `{ status, code, detail: { ... } }`: error specifics live under
 * `detail`, not flat on the entry.
 */
export interface AdvertApiError {
  code?: string
  message?: string
  /** Per-entry HTTP status, repeated from the response. */
  status?: number
  /** Where the API puts error specifics, e.g. `existing_advert_id` on an overlap rejection. */
  detail?: {
    /** The advert whose order range blocks this one. */
    existing_advert_id?: number | string
    [key: string]: unknown
  }
  /** Legacy/fallback: the same id sent flat. Prefer {@link AdvertApiError.detail}. */
  existing_advert_id?: number | string
  [key: string]: unknown
}

export interface CreateAdPayload {
  type: "buy" | "sell"
  account_currency: string
  payment_currency: string
  minimum_order_amount: number
  maximum_order_amount: number
  available_amount: number
  exchange_rate: number
  exchange_rate_type: "fixed" | "float"
  description: string
  is_active: number
  order_expiry_period: number
  payment_method_names: string[]
  minimum_join_days?: number | null
  minimum_completion_rate_30day?: number | null
}

export interface CreateAdResponse {
  id: string
  type: "buy" | "sell"
  status: "active" | "inactive"
  created_at: string
  account_currency?: string
  payment_currency?: string
  minimum_order_amount?: number
  maximum_order_amount?: number
  exchange_rate?: number
  exchange_rate_type?: "fixed" | "float"
  available_amount?: number
  description?: string
  payment_method_names?: string[]
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

export async function getMyAds(filters?: AdFilters): Promise<MyAd[]> {
  try {
    const userAdverts = await getUserAdverts()

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
    return []
  }
}

export async function toggleAdStatus(id: string, isActive: boolean, currentAd: MyAd): Promise<{ success: boolean }> {
  try {
    const adData = {
      is_active: isActive,
    }

    return await updateAd(id, adData)
  } catch (error) {
    throw error
  }
}

export async function hideMyAds(hide: boolean): Promise<{ success: boolean }> {
  try {
    const url = `${API.baseUrl}/users/${useUserDataStore.getState().userId}`
    const headers = {
      ...AUTH.getAuthHeader(),
      "Content-Type": "application/json",
    }
    const payload = {
      adverts_are_listed: !hide,
    }

    const requestData = { data: payload }
    const body = JSON.stringify(requestData)

    const response = await p2pFetch(url, {
      method: "PATCH",
      credentials: "include",
      headers,
      body,
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = {}
    }

    if (!response.ok) {
      throw new Error(`Failed to ${hide ? "hide" : "show"} ads: ${response.statusText || responseText}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Error hiding/showing ads:", error)
    throw error
  }
}

export async function getCurrencies(): Promise<string[]> {
  try {
    const url = `${API.baseUrl}${API.endpoints.settings}`
    const headers = AUTH.getAuthHeader()

    const response = await p2pFetch(url, {
      headers,
      credentials: "include",
    })
    await response.text()
  } catch (error) {}

  // TODO: Returning a default array for now until the API response structure is finalised and we have required data
  return ["USD", "BTC", "ETH", "LTC", "BRL", "VND"]
}

export async function getUserAdverts(isActive?: boolean, page = 1, per_page = 20): Promise<MyAd[]> {
  try {
    const userId = useUserDataStore.getState().userId

    const queryParams = new URLSearchParams({
      user_id: userId.toString(),
      show_inactive: "true",
      show_unorderable: "true",
      show_unlisted: "true",
      show_ineligible: "true",
      account_currency: "USD",
      page: page.toString(),
      per_page: per_page.toString(),
      sort_by: "is_active",
      sort_order: "desc",
    })

    if (isActive !== undefined) {
      queryParams.set("is_active", isActive.toString())
    }

    const url = `${API.baseUrl}${API.endpoints.ads}?${queryParams.toString()}`
    const headers = AUTH.getAuthHeader()

    const response = await p2pFetch(url, {
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch user adverts")
    }

    const responseText = await response.text()
    let apiData

    try {
      apiData = JSON.parse(responseText)
    } catch (e) {
      apiData = { data: [] }
    }

    if (!apiData || !apiData.data || !Array.isArray(apiData.data)) {
      return []
    }

    // Coerce/validate money fields before reshaping — fixes a live bug where
    // `exchangeRate.toFixed(4)` below would throw if the backend ever sent
    // `exchange_rate` as a numeric string instead of a number.
    // Cast to plain `any` (not `APIAdvert[]`) to preserve the pre-existing
    // loose typing of the `.map()` below — its return object doesn't fully
    // satisfy `MyAd` (e.g. `currency` fields are `string | undefined`), which
    // was previously masked by `apiData.data` being untyped `any`. A `U[]`
    // element type would still make TS infer the `.map()` callback's return
    // type strictly, so this needs to be `any`, not `any[]`. Confirmed by
    // testing: switching to `as unknown as APIAdvert[]` (the pattern used in
    // api-orders.ts) breaks compilation — TS2322, the `.map()` return object
    // genuinely isn't assignable to `MyAd[]`. Fixing that properly means
    // reconciling the callback's return shape with `MyAd` field-by-field, a
    // separate, larger change — not a drive-by cast swap.
    const validatedAdverts: any = parseArrayWithItemIsolation(myAdvertMoneyFieldsSchema, apiData.data, {
      endpoint: MY_ADS_ENDPOINT,
      field: "data",
      reporter: schemaReporter,
    })

    return validatedAdverts.map((advert: APIAdvert) => {
      const minAmount = advert.minimum_order_amount || 0
      const maxAmount = advert.maximum_order_amount || 0
      const exchangeRate = advert.exchange_rate || 0
      const currency = advert.payment_currency || "USD"
      const accountCurrency = advert.account_currency
      const isActive = advert.is_active !== undefined ? advert.is_active : true
      const availableAmount = advert.available_amount || 0

      const status: "Active" | "Inactive" = isActive ? "Active" : "Inactive"

      return {
        ...advert,
        id: String(advert.id || "0"),
        type: ((advert.type || "buy") as string).toLowerCase() === "buy" ? "Buy" : "Sell",
        rate: {
          value: `${exchangeRate.toFixed(4)} ${currency}`,
          percentage: "0.1%",
          currency: currency,
        },
        limits: {
          min: minAmount,
          max: maxAmount,
          currency: accountCurrency,
        },
        available: {
          current: availableAmount,
          total:
            Number(availableAmount || 0) +
            Number(advert.open_order_amount || 0) +
            Number(advert.completed_order_amount || 0),
          currency: accountCurrency,
        },
        paymentMethods: advert.payment_methods || [],
        status: status,
        description: advert.description || "",
        createdAt: new Date((advert.created_at || 0) * 1000 || Date.now()).toISOString(),
        updatedAt: new Date((advert.created_at || 0) * 1000 || Date.now()).toISOString(),
        account_currency: accountCurrency,
        user: advert.user,
      }
    })
  } catch (error) {
    return []
  }
}

export async function updateAd(
  id: string,
  adData: any,
): Promise<{ success: boolean; errors?: AdvertApiError[] }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.ads}/${id}`
    const headers = AUTH.getAuthHeader()

    const payload = normalizeUpdateAdPayload(adData)

    const requestData = { data: payload }
    const body = JSON.stringify(requestData)

    const response = await p2pFetch(url, {
      method: "PATCH",
      headers,
      credentials: "include",
      body,
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = {}
    }

    if (!response.ok) {
      let errors: AdvertApiError[] = []
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

    return {
      success: true,
      errors: responseData.errors || [],
    }
  } catch (error) {
    return {
      success: false,
      errors: [{ message: error instanceof Error ? error.message : "An unexpected error occurred" }],
    }
  }
}

export async function toggleAdActiveStatus(
  id: string,
  isActive: boolean,
): Promise<{ success: boolean; errors?: any[] }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.ads}/${id}`
    const headers = AUTH.getAuthHeader()

    const payload = {
      is_active: isActive,
    }

    const requestData = { data: payload }
    const body = JSON.stringify(requestData)

    const response = await p2pFetch(url, {
      method: "PATCH",
      headers,
      credentials: "include",
      body,
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = {}
    }

    if (!response.ok) {
      let errors = []
      if (responseData && responseData.errors) {
        errors = responseData.errors
      } else {
        errors = [
          { message: `Failed to ${isActive ? "activate" : "deactivate"} ad: ${response.statusText || responseText}` },
        ]
      }

      return {
        success: false,
        errors: errors,
      }
    }

    return {
      success: true,
      errors: responseData.errors || [],
    }
  } catch (error) {
    return {
      success: false,
      errors: [{ message: error instanceof Error ? error.message : "An unexpected error occurred" }],
    }
  }
}

export async function deleteAd(id: string): Promise<{ success: boolean; errors?: any[] }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.ads}/${id}`
    const headers = AUTH.getAuthHeader()

    const response = await p2pFetch(url, {
      method: "DELETE",
      headers,
      credentials: "include",
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = {}
    }

    if (!response.ok) {
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

    return { success: true }
  } catch (error) {
    return {
      success: false,
      errors: [{ message: error instanceof Error ? error.message : "An unexpected error occurred" }],
    }
  }
}

/** Carries the untouched API error entry across `createAd`'s internal throw/catch. */
type CreateAdError = Error & { apiError?: AdvertApiError }

export async function createAd(
  payload: CreateAdPayload,
): Promise<{ success: boolean; data: CreateAdResponse; errors?: AdvertApiError[] }> {
  try {
    const url = `${API.baseUrl}${API.endpoints.ads}`
    const headers = AUTH.getAuthHeader()

    const enhancedPayload = {
      ...payload,
      payment_method_ids: (payload as any).payment_method_ids ?? null,
      available_countries: (payload as any).available_countries ?? null,
    }

    const requestBody = { data: enhancedPayload }
    const body = JSON.stringify(requestBody)

    const response = await p2pFetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body,
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = { raw: responseText }
    }

    if (!response.ok) {
      let errorMessage = responseData.error || `Error creating advertisement: ${response.statusText}`
      let errorCode = null
      let apiError: AdvertApiError | undefined

      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        apiError = responseData.errors[0]
        if (responseData.errors[0].code) {
          errorCode = responseData.errors[0].code

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
            case "AdvertActiveCountExceeded":
              errorMessage =
                "You can only have 3 active ads for this currency pair and order type. Delete an ad to create a new one."
              break
            case "AdvertFloatRateMaximum":
              errorMessage =
                "The floating rate you entered is higher than the allowed limit. Lower the rate to continue."
              break
            default:
              errorMessage = `${errorCode}: Please try again or contact support.`
          }
        } else if (responseData.errors[0].message) {
          errorMessage = responseData.errors[0].message
        }
      }

      if (response.status === 400) {
        if (errorMessage.includes("limit") || errorCode === "AdvertLimitReached") {
          throw new Error("ad_limit_reached")
        }
      }

      const error: CreateAdError = new Error(errorMessage)
      if (errorCode) {
        error.name = errorCode
      }
      // Keep the raw entry so fields beyond `code`/`message` (e.g. existing_advert_id)
      // survive the catch below instead of being reduced away.
      error.apiError = apiError
      throw error
    }

    return {
      success: true,
      data: responseData.data,
      errors: responseData.errors || [],
    }
  } catch (error) {
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
          ...((error as CreateAdError)?.apiError ?? {}),
          message: error instanceof Error ? error.message : "An unexpected error occurred",
          code: error instanceof Error ? error.name : "UnknownError",
        },
      ],
    }
  }
}

export async function activateAd(id: string): Promise<{ success: boolean; errors?: any[] }> {
  try {
    const payload = {
      is_active: true,
    }

    const url = `${API.baseUrl}${API.endpoints.ads}/${id}`
    const headers = AUTH.getAuthHeader()

    const body = JSON.stringify({ data: payload })

    const response = await p2pFetch(url, {
      method: "PATCH",
      headers,
      credentials: "include",
      body,
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = {}
    }

    if (!response.ok) {
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

    return { success: true }
  } catch (error) {
    return {
      success: false,
      errors: [{ message: error instanceof Error ? error.message : "An unexpected error occurred" }],
    }
  }
}

export async function getAdvert(id: string): Promise<MyAd> {
  try {
    const url = `${API.baseUrl}${API.endpoints.ads}/${id}`
    const headers = AUTH.getAuthHeader()

    const response = await p2pFetch(url, {
      headers,
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch user adverts")
    }

    const responseText = await response.text()
    let data

    try {
      data = JSON.parse(responseText)
    } catch (e) {
      data = {}
    }

    if (data && data.data && typeof data.data === "object") {
      data.data = parseWithSchema(myAdvertMoneyFieldsSchema, data.data, {
        endpoint: MY_ADS_ENDPOINT,
        reporter: schemaReporter,
      })
    }

    return data
  } catch (error) {
    return {}
  }
}
