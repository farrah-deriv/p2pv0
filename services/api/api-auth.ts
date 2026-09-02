import { useUserDataStore } from "@/stores/user-data-store"
import { useP2PMaintenanceStore } from "@/stores/p2p-maintenance-store"
import { useUserCountryInvalidStore } from "@/stores/user-country-invalid-store"
import { p2pFetch } from "./p2p-fetch"
import { useMarketFilterStore } from "@/stores/market-filter-store"
import { getQueryClient } from "@/lib/react-query-client"
import { queryKeys } from "@/hooks/use-api-queries"
import { getCoreUrl } from "@/lib/get-core-url"
import { getOryUrl } from "@/lib/get-ory-url"
import { localeToBcp47, type Locale } from "@/lib/i18n/config"
import { isP2PWebSocketEligible } from "@/lib/p2p-websocket-eligibility"
import { resetWebSocketClient } from "@/contexts/websocket-context"
import { z } from "zod"
import {
  parseArrayWithItemIsolation,
  parseWithSchema,
  reportedBoolean,
  reportedString,
} from "@/lib/api/schema-coercion"
import { schemaReporter } from "@/lib/api/schema-reporter"
import { SchemaMismatchError } from "@/lib/api/schema-mismatch-error"

export interface LoginRequest {
  email: string
}

export interface LoginResponse {
  code: string
  message: string
}

export interface VerificationRequest {
  token: string
  type: string
  email: string
}

export interface VerificationResponse {
  access_token?: string
  errors?: string[]
  user?: {
    id: string
    email?: string
  }
}

export interface Country {
  code: string
  name: string
  currency?: string
  currency_name?: string
}

export interface CurrencyItem {
  code: string
  name: string
}

export interface CurrenciesResponse {
  [currencyCode: string]: Record<string, any>
}

export interface KycStatusResponse {
  kyc_step: "poi" | "poa"
  status: string
}

// Corrected to match the actual runtime shape (previously declared as
// `{balance, currency}`, which doesn't match what the backend returns or what
// `app/wallet/page.tsx` actually reads off this — a stale/wrong interface).
export interface TotalBalanceResponse {
  wallets: {
    items: Array<{
      type: string
      total_balance: {
        approximate_total_balance: string
        converted_to: string
      }
    }>
  }
}

export interface OnboardingStatusResponse {
  kyc: {
    status: string
    poi_status?: string
    poa_status?: string
  }
  tnc?: {
    accepted?: boolean
  }
  profile?: {
    status?: string
  }
  verification: {
    email_verified: boolean
    phone_verified: boolean
  }
  p2p: {
    allowed: boolean
    criteria: Array<{
      code: string
      passed: boolean
    }>
  }
}

export interface CreateP2PUserResponse {
  id: string
  user_id: string
  created_at: string
}

const getAuthHeader = () => ({
  "Content-Type": "application/json",
})

/** Origins we are willing to follow an Ory-issued link to. */
const getAllowedOryOrigins = () =>
  [process.env.NEXT_PUBLIC_ORY_URL, process.env.NEXT_PUBLIC_ORY_ME_URL, process.env.NEXT_PUBLIC_ORY_BE_URL].flatMap(
    (url) => {
      if (!url) return []
      try {
        return [new URL(url).origin]
      } catch {
        return []
      }
    },
  )

/**
 * Rewrite an absolute Ory URL onto whatever base `getOryUrl()` resolves to.
 *
 * In local dev that base is the relative `/api/auth` proxy, so an absolute
 * `recovery_link` pointing at `staging-auth.deriv.com` has to be re-pointed at
 * the proxy — otherwise the request is blocked by CORS and the session cookie
 * would be scoped to `deriv.com` rather than localhost. Deployed builds get an
 * absolute base and the URL passes through unchanged.
 *
 * The origin allowlist keeps a manipulated link from redirecting elsewhere.
 */
const getOryBrowserUrl = (url: string) => {
  const parsedUrl = new URL(url)
  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error("Unsupported Ory URL protocol")
  }

  if (!getAllowedOryOrigins().includes(parsedUrl.origin)) {
    throw new Error("Unexpected Ory URL origin")
  }

  const oryBaseUrl = getOryUrl()
  if (oryBaseUrl.startsWith("/")) {
    return `${oryBaseUrl}${parsedUrl.pathname}${parsedUrl.search}`
  }

  return parsedUrl.toString()
}

/**
 * Initiate login with email
 */
export async function login(email: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await p2pFetch(`${getCoreUrl()}/v1/login`, {
      method: "POST",
      body: JSON.stringify(email),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    const { data } = result

    return data
  } catch (error) {
    console.error("Login error:", error)
    throw new Error("Failed to login. Please try again.")
  }
}

/**
 * Verify the code sent to email
 */
export async function verifyCode(verificationData: VerificationRequest): Promise<VerificationResponse> {
  try {
    const response = await p2pFetch(`${getCoreUrl()}/v1/verify`, {
      method: "POST",
      headers: {
        "X-Enable-Session": "true",
      },
      credentials: "include",
      body: JSON.stringify(verificationData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    const { data } = result

    return data
  } catch (error) {
    console.error("Verification error:", error)
    throw new Error("Failed to verify code. Please try again.")
  }
}

/**
 * Verify token from URL parameter
 */
export async function verifyToken(token: string): Promise<VerificationResponse> {
  const isOryEnabled = process.env.NEXT_PUBLIC_IS_ORY_ENABLED == 1

  try {
    if (isOryEnabled) {
      const response = await p2pFetch(`${getCoreUrl()}/v1/auth/redirect-url?token=${token}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const { data } = result

      if (data.recovery_link) {
        const recoveryResponse = await p2pFetch(getOryBrowserUrl(data.recovery_link), {
          method: "GET",
          redirect: "manual",
          credentials: "include",
        })

        if (recoveryResponse.ok || recoveryResponse.type === "opaqueredirect") {
          return data
        } else {
          throw new Error("Failed to process recovery link")
        }
      }

      return data
    } else {
      const response = await p2pFetch(`${getCoreUrl()}/v1/auth/token/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Enable-Session": "true",
        },
        credentials: "include",
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const { data } = result

      return data
    }
  } catch (error) {
    console.error("Token verification error:", error)
    throw new Error("Failed to verify token. Please try again.")
  }
}

/**
 * Check if user is authenticated
 */
export async function getSession(): Promise<boolean> {
  try {
    const isOryEnabled = process.env.NEXT_PUBLIC_IS_ORY_ENABLED == 1
    const sessionUrl = isOryEnabled
      ? `${getOryUrl()}/sessions/whoami`
      : `${getCoreUrl()}/session`

    const response = await p2pFetch(sessionUrl, {
      method: "GET",
      credentials: "include",
    })

    const result = await response.json()
    const externalId = result?.identity?.external_id
    if (externalId) useUserDataStore.getState().setExternalId(externalId)

    const verifiableAddresses = result?.identity?.verifiable_addresses || []
    const emailVerified = verifiableAddresses.some(
      (addr: { via: string; verified: boolean }) => addr.via === "email" && addr.verified == true
    )

    useUserDataStore.getState().setOryEmailVerified(emailVerified)

    return response.status === 200
  } catch (error) {
    return false
  }
}

// Two independent call sites (app/main.tsx auth gating, lib/i18n/language-sync.tsx
// locale-sync precondition) both call this on every initial page load for unrelated
// reasons — neither can share a React Query cache (language-sync.tsx renders outside
// ReactQueryProvider in app/layout.tsx). Share a single in-flight/short-lived result
// here instead, so whichever call fires first is the only one that hits the network.
let sessionPromise: Promise<boolean> | null = null
let sessionPromiseAt = 0
const SESSION_CACHE_MS = 1000 * 60 * 10

export function getSessionCached(): Promise<boolean> {
  const now = Date.now()
  if (sessionPromise && now - sessionPromiseAt < SESSION_CACHE_MS) {
    return sessionPromise
  }
  sessionPromiseAt = now
  sessionPromise = getSession()
  return sessionPromise
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    const response = await p2pFetch(`${getCoreUrl()}/v1/logout`, {
      method: "POST",
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    useUserDataStore.getState().clearUserData()
    useP2PMaintenanceStore.getState().clearMaintenance()
    // Defensive — the page navigation below already wipes the module
    // singleton via full reload today, but this covers the window before
    // that reload happens and guards against the navigation strategy ever
    // changing to client-side routing.
    resetWebSocketClient()
    useUserCountryInvalidStore.getState().clearUserCountryInvalid()
    localStorage.removeItem("auth_token")
    localStorage.removeItem("socket_token")
    window.location.href = "/"
  } catch (error) {
    console.error(error)
    throw new Error("User not authenticated.")
  }
}

/**
 * Fetch current user data from /users/me endpoint.
 * Returns null for 403/404 (unverified or no P2P profile yet).
 */
export async function getMe(): Promise<any> {
  const response = await p2pFetch(`${getCoreUrl()}/p2p/v1/users/me`, {
    method: "GET",
    credentials: "include",
    headers: getAuthHeader(),
  })

  if (response.status === 403 || response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch user data: ${response.status}`)
  }

  const result = await response.json()
  return result.data
}

/**
 * Fetch user data and store user_id in localStorage
 */
const P2P_USER_ME_ENDPOINT = "p2p/v1/users/me"

// The P2P balance field (CLAUDE.md gotcha: `total_account_value` — same
// field mobile reads as `myProfileProvider.totalAccountValue`, stored here
// under the `balances` store key). `.passthrough()` keeps any other field.
export const totalAccountValueSchema = z
  .object({
    amount: reportedString({
      endpoint: P2P_USER_ME_ENDPOINT,
      field: "total_account_value.amount",
      reporter: schemaReporter,
    }),
    currency: reportedString({
      endpoint: P2P_USER_ME_ENDPOINT,
      field: "total_account_value.currency",
      reporter: schemaReporter,
    }),
  })
  .passthrough()

export async function fetchUserIdAndStore(): Promise<void> {
  try {
    await getClientProfile()

    const response = await p2pFetch(`${getCoreUrl()}/p2p/v1/users/me`, {
      method: "GET",
      credentials: "include",
      headers: getAuthHeader(),
    })


    const result = await response.json()

    if (response.status === 403) {
      const errors = result?.errors || []
      const isUserDisabled = errors.some(
        (error: any) => error.code === "UserDisabled" || error.message?.includes("UserDisabled"),
      )

      if (isUserDisabled) {
        useUserDataStore.getState().updateUserData({
          balances: [{ amount: "0" }],
          signup: "v2",
          status: "disabled",
        })
        return
      }
    }

    // Get settings from React Query cache first, then fetch if needed
    // This ensures we reuse cached data from useSettings hook when available
    const qc = getQueryClient()
    let settings: any | undefined = qc.getQueryData(queryKeys.auth.settings())

    if (!settings) {
      try {
        settings = await qc.fetchQuery({
          queryKey: queryKeys.auth.settings(),
          queryFn: () => getSettings(),
          staleTime: 1000 * 60 * 30, // Match useSettings staleTime
        })
      } catch (error) {
        console.error("Error fetching settings:", error)
      }
    }

    if (!response.ok) {
      useUserDataStore.getState().updateUserData({
        balances: [{ amount: "0" }],
        signup: "v2",
      })
      useUserDataStore.getState().setUserId("")

      // Set local currency from residence country if available
      try {
        const residenceCountry = useUserDataStore.getState().residenceCountry
        if (residenceCountry && settings) {
          const countries = settings?.countries || []
          const normalizedResidenceCode = typeof residenceCountry === "string" ? residenceCountry.toLowerCase() : ""

          const matchedCountry = normalizedResidenceCode
            ? countries.find((c: any) => typeof c?.code === "string" && c.code.toLowerCase() === normalizedResidenceCode)
            : null

          const derivedCurrency =
            (matchedCountry?.currency && String(matchedCountry.currency).toUpperCase()) ||
            (countries?.[0]?.currency && String(countries[0].currency).toUpperCase()) ||
            null

          useUserDataStore.getState().setLocalCurrency(derivedCurrency)
        } else {
          useUserDataStore.getState().setLocalCurrency(null)
        }
      } catch (error) {
        console.error("Error deriving local currency from residence:", error)
        useUserDataStore.getState().setLocalCurrency(null)
      }

      return
    }

    const userId = result?.data?.id
    let userCountryCode = result?.data?.country_code
    const brandClientId = result?.data?.brand_client_id
    const brand = result?.data?.brand
    const tempBanUntil = result?.data?.temp_ban_until
    const rawTotalAccountValue = result?.data?.total_account_value
    // `any` (not `unknown`) to preserve the pre-existing loose typing this
    // value flows into (`updateUserData({ balances, ... })` etc.).
    let balances: any = rawTotalAccountValue
    if (rawTotalAccountValue) {
      try {
        balances = parseWithSchema(totalAccountValueSchema, rawTotalAccountValue, {
          endpoint: P2P_USER_ME_ENDPOINT,
          reporter: schemaReporter,
        })
      } catch (error) {
        if (!(error instanceof SchemaMismatchError)) throw error
        // Fail closed on just this field — the rest of this function's user
        // data (userId, trade band, etc.) must still get stored below.
        // Prefer the user's already-derived local currency (residence-based)
        // over a hardcoded "USD" sentinel, which would briefly render the
        // wrong currency for non-USD markets — "USD" is only the last-resort
        // default when we don't know better either.
        const fallbackCurrency = useUserDataStore.getState().localCurrency ?? "USD"
        balances = { amount: "0", currency: fallbackCurrency }
      }
    }
    const status = result?.data?.status
    const tradeBand = result?.data?.trade_band

    // If userCountryCode is not available, fallback to residence from client profile
    if (!userCountryCode) {
      const residenceCountry = useUserDataStore.getState().residenceCountry
      if (residenceCountry) {
        userCountryCode = residenceCountry
      }
    }

    // Derive user's local currency from /settings.countries using /users/me country_code.
    // Fallback to the first country currency if no match.
    try {
      if (settings) {
        const countries = settings?.countries || []
        const normalizedUserCountryCode = typeof userCountryCode === "string" ? userCountryCode.toLowerCase() : ""

        const matchedCountry = normalizedUserCountryCode
          ? countries.find((c: any) => typeof c?.code === "string" && c.code.toLowerCase() === normalizedUserCountryCode)
          : null

        const derivedLocalCurrency =
          (matchedCountry?.currency && String(matchedCountry.currency).toUpperCase()) ||
          (countries?.[0]?.currency && String(countries[0].currency).toUpperCase()) ||
          null

        useUserDataStore.getState().setLocalCurrency(derivedLocalCurrency)
      }
    } catch (error) {
      console.error("Error deriving local currency from settings:", error)
    }

    if (userId) {
      const newUserId = userId.toString()
      const previousUserId = useUserDataStore.getState().userId

      // Always store the userId once we have it (first load previousUserId is often null).
      // Only reset filters when the user actually changes between sessions.
      if (previousUserId && previousUserId !== newUserId) {
        useMarketFilterStore.getState().resetFilters()
      }

      if (previousUserId !== newUserId) {
        useUserDataStore.getState().setUserId(newUserId)
      }

      if (brandClientId) {
        useUserDataStore.getState().setBrandClientId(brandClientId)
      }
      if (brand) {
        useUserDataStore.getState().setBrand(brand)
      }

      const { userData } = useUserDataStore.getState()
      if (userData) {
        useUserDataStore.getState().updateUserData({
          adverts_are_listed: result.data.adverts_are_listed,
          signup: result.data.signup,
          wallet_id: result.data.wallet_id,
          temp_ban_until: tempBanUntil,
          balances: balances,
          status: status,
          trade_band: tradeBand,
          feedback_exist: result.data.feedback_exist ?? false,
        })
      }
    } else {
      useUserDataStore.getState().updateUserData({
        balances: { amount: "0" },
        signup: "v2",
      })
      useUserDataStore.getState().setUserId("")
      useUserDataStore.getState().setLocalCurrency(null)
      useMarketFilterStore.getState().resetFilters()
    }
  } catch (error) {
    console.error("Error fetching user ID:", error)
  }
}

export async function getClientProfile(): Promise<void> {
  try {
    const response = await p2pFetch(`${getCoreUrl()}/v1/client/profile`, {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.statusText}`)
    }

    const result = await response.json()
    const { data } = result

    const userData = {
      adverts_are_listed: true,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      nickname: data.nickname,
    }

    useUserDataStore.getState().updateUserData(userData)

    if (data.residence) {
      useUserDataStore.getState().setResidenceCountry(data.residence)
    }
  } catch (error) {
    console.error("Error fetching profile:", error)
  }
}

/**
 * Get websocket token
 */
export async function getSocketToken(): Promise<string | null> {
  try {
    if (!isP2PWebSocketEligible()) {
      useUserDataStore.getState().setSocketToken(null)
      return null
    }

    const response = await p2pFetch(`${getCoreUrl()}/p2p/v1/user-websocket-token`, {
      method: "GET",
      credentials: "include",
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch token: ${response.statusText}`)
    }

    const result = await response.json()
    const socketToken = result?.data?.token

    if (!socketToken) return null

    const value = socketToken.toString()
    useUserDataStore.getState().setSocketToken(value)
    return value
  } catch (error) {
    // Swallowed on purpose, and `null` is returned rather than rethrown: the
    // handshake still falls back to cookie auth, so a token failure must not
    // leave the query retrying and stall the connect effect that waits on it
    // settling. Returning a value (never `undefined`) also keeps React Query
    // from treating this as an errored query.
    console.error("Error fetching token:", error)
    return null
  }
}

/**
 * Get KYC status for user onboarding
 */
export async function getKycStatus(): Promise<KycStatusResponse[]> {
  try {
    const response = await p2pFetch(`${getCoreUrl()}/v1/client/kyc-status`, {
      method: "GET",
      credentials: "include",
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch KYC status: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error fetching KYC status:", error)
  }
}

/**
 * Get onboarding status for the user
 */
export async function getOnboardingStatus(): Promise<OnboardingStatusResponse> {
  try {
    const response = await p2pFetch(`${getCoreUrl()}/v1/client/onboarding-status`, {
      method: "GET",
      credentials: "include",
      // CTA guards use this endpoint to make an up-to-date onboarding decision.
      cache: "no-store",
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch onboarding status: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error fetching onboarding status:", error)
    throw error
  }
}

/**
 * Get total balance for the user
 */
const TOTAL_BALANCE_ENDPOINT = "v1/client/total-balance"

const totalBalanceEnvelopeSchema = z
  .object({
    wallets: z
      .object({
        items: z.array(z.unknown()),
      })
      .passthrough(),
  })
  .passthrough()

// Validates only the wallet item's money field — `.passthrough()` keeps
// `type`/`converted_to`/etc. untouched.
const totalBalanceWalletItemSchema = z
  .object({
    total_balance: z
      .object({
        approximate_total_balance: reportedString({
          endpoint: TOTAL_BALANCE_ENDPOINT,
          field: "wallets.items[].total_balance.approximate_total_balance",
          reporter: schemaReporter,
        }),
      })
      .passthrough(),
  })
  .passthrough()

export async function getTotalBalance(): Promise<TotalBalanceResponse> {
  try {
    const response = await p2pFetch(`${getCoreUrl()}/v1/client/total-balance`, {
      method: "GET",
      credentials: "include",
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch total balance: ${response.statusText}`)
    }

    const result = await response.json()
    const parsed = parseWithSchema(totalBalanceEnvelopeSchema, result.data, {
      endpoint: TOTAL_BALANCE_ENDPOINT,
      reporter: schemaReporter,
    })
    const items = parseArrayWithItemIsolation(totalBalanceWalletItemSchema, parsed.wallets.items, {
      endpoint: TOTAL_BALANCE_ENDPOINT,
      field: "wallets.items",
      reporter: schemaReporter,
    })

    return { ...parsed, wallets: { ...parsed.wallets, items } } as unknown as TotalBalanceResponse
  } catch (error) {
    console.error("Error fetching total balance:", error)
    throw error
  }
}

/**
 * Get balance from users/me endpoint (for V1 signup users)
 */
export async function getUserBalance(): Promise<{ amount: string; currency: string }> {
  try {
    const response = await p2pFetch(`${getCoreUrl()}/p2p/v1/users/me`, {
      method: "GET",
      credentials: "include",
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch user balance: ${response.statusText}`)
    }

    const result = await response.json()
    const balances = result?.data?.balances || []

    const firstBalance = balances[0] || {}
    return {
      amount: firstBalance.amount || "0.00",
      currency: firstBalance.currency || "USD",
    }
  } catch (error) {
    console.error("Error fetching user balance:", error)
    throw error
  }
}

/**
 * Get list of available currencies
 */
export async function getCurrencies(): Promise<CurrenciesResponse> {
  try {
    const response = await p2pFetch(`${getCoreUrl()}/v1/core/business/config/currencies`, {
      method: "POST",
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch currencies: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error fetching currencies:", error)
    throw error
  }
}

/**
 * Get user settings
 */
const P2P_SETTINGS_ENDPOINT = "p2p/v1/settings"

// Only validates the fields the web app actually reads off settings
// (`float_rate_enabled`, `order_verification_enabled`, `countries`) — the
// origin incident was `float_rate_enabled` drifting type, so this schema
// isn't restricted to money fields the way adverts/orders/wallets are.
// `.passthrough()` at every level so unlisted fields survive untouched.
const p2pSettingsSchema = z
  .object({
    float_rate_enabled: reportedBoolean({
      endpoint: P2P_SETTINGS_ENDPOINT,
      field: "data.float_rate_enabled",
      reporter: schemaReporter,
    }),
    order_verification_enabled: reportedBoolean({
      endpoint: P2P_SETTINGS_ENDPOINT,
      field: "data.order_verification_enabled",
      reporter: schemaReporter,
    }),
    countries: z.array(z.unknown()),
  })
  .passthrough()

const p2pSettingsCountrySchema = z
  .object({
    code: reportedString({
      endpoint: P2P_SETTINGS_ENDPOINT,
      field: "data.countries[].code",
      reporter: schemaReporter,
    }),
    name: reportedString({
      endpoint: P2P_SETTINGS_ENDPOINT,
      field: "data.countries[].name",
      reporter: schemaReporter,
    }),
    // `currency` stays required — `use-currency-data.ts` builds `code:
    // country.currency` and sorts on it (`.localeCompare`), which would
    // throw on `undefined`. `currency_name` only feeds display text, so it's
    // safe to drop when absent — and `Country.currency_name` is genuinely
    // optional per the interface, unlike `currency`.
    currency: reportedString({
      endpoint: P2P_SETTINGS_ENDPOINT,
      field: "data.countries[].currency",
      reporter: schemaReporter,
    }),
    currency_name: reportedString({
      endpoint: P2P_SETTINGS_ENDPOINT,
      field: "data.countries[].currency_name",
      reporter: schemaReporter,
    }).optional(),
  })
  .passthrough()

// Hand-written rather than derived via `Omit<z.infer<typeof p2pSettingsSchema>, ...>`
// — `Omit`/`Pick` over a `.passthrough()` schema's inferred type (which carries
// an index signature) collapses named properties to `unknown` (confirmed via
// isolated repro). Keep this in sync with `p2pSettingsSchema`'s validated fields.
export interface P2PSettings {
  float_rate_enabled: boolean
  order_verification_enabled: boolean
  countries: Country[]
}

export async function getSettings(): Promise<P2PSettings> {
  try {
    const response = await p2pFetch(`${getCoreUrl()}/p2p/v1/settings`, {
      method: "GET",
      credentials: "include",
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.statusText}`)
    }

    const result = await response.json()
    const parsed = parseWithSchema(p2pSettingsSchema, result.data, {
      endpoint: P2P_SETTINGS_ENDPOINT,
      reporter: schemaReporter,
    })
    const countries = parseArrayWithItemIsolation(p2pSettingsCountrySchema, parsed.countries, {
      endpoint: P2P_SETTINGS_ENDPOINT,
      field: "data.countries",
      reporter: schemaReporter,
    }) as unknown as Country[]

    // `parsed`'s inferred type loses precision on named properties when
    // spread here (generic inference through `parseWithSchema`'s `z.ZodType<T>`
    // parameter is less precise than a direct `z.infer` for a `.passthrough()`
    // schema) — the runtime shape is already validated above, so this cast is
    // safe. Keep `P2PSettings` in sync with `p2pSettingsSchema` by hand.
    return { ...parsed, countries } as P2PSettings
  } catch (error) {
    console.error("Error fetching settings:", error)
    throw error
  }
}

/**
 * Create a P2P user after verification is complete
 */
export async function createP2PUser(): Promise<CreateP2PUserResponse> {
  try {
    const response = await p2pFetch(`${getCoreUrl()}/v1/p2p/client`, {
      method: "POST",
      credentials: "include",
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error(`Failed to create P2P user: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error creating P2P user:", error)
    throw error
  }
}

let ensureP2PUserPromise: Promise<void> | null = null

/** Creates and loads the P2P profile once when concurrent onboarding guards resolve. */
export async function ensureP2PUser(): Promise<void> {
  if (useUserDataStore.getState().userId) return

  if (!ensureP2PUserPromise) {
    ensureP2PUserPromise = (async () => {
      await createP2PUser()
      await fetchUserIdAndStore()
    })().finally(() => {
      ensureP2PUserPromise = null
    })
  }

  await ensureP2PUserPromise
}

/**
 * Get advert statistics for a specific currency
 * Returns minimum and maximum exchange rates for fixed and floating adverts
 */
export async function getAdvertStatistics(accountCurrency: string): Promise<any> {
  try {
    const response = await p2pFetch(`${getCoreUrl()}/p2p/v1/advert-statistics/${accountCurrency}`, {
      method: "GET",
      credentials: "include",
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch advert statistics: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data
  } catch (error) {
    console.error("Error fetching advert statistics:", error)
    throw error
  }
}

export interface ClientPreferencesResponse {
  data?: {
    preferred_language?: string
  }
}

/**
 * Fetch client preferences (`GET /v1/client/preferences`).
 * Returns `preferred_language` when present, otherwise `null`.
 */
export async function getClientPreferences(): Promise<string | null> {
  try {
    const response = await fetch(`${getCoreUrl()}/v1/client/preferences`, {
      method: "GET",
      credentials: "include",
      headers: getAuthHeader(),
    })

    if (!response.ok) {
      return null
    }

    const result = (await response.json()) as ClientPreferencesResponse
    const raw = result?.data?.preferred_language
    if (!raw || !raw.trim()) {
      return null
    }

    return raw.trim()
  } catch (error) {
    console.error("Error fetching client preferences:", error)
    return null
  }
}

/**
 * Persist the user's preferred language (`PUT /v1/client/preferred-language`).
 */
export async function updatePreferredLanguage(locale: Locale): Promise<void> {
  const response = await fetch(`${getCoreUrl()}/v1/client/preferred-language`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeader(),
    body: JSON.stringify({ preferred_language: localeToBcp47(locale) }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update preferred language: ${response.statusText}`)
  }
}

export interface FeedbackError extends Error {
  errors?: Array<{ code?: string; message?: string }>
}

export async function submitFeedback(userId: string, payload: { nps_score: number; review_text: string }): Promise<void> {
  const response = await p2pFetch(`${getCoreUrl()}/p2p/v1/users/${userId}/feedback`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeader(),
    body: JSON.stringify({ data: { ...payload, source: "web" } }),
  })

  const responseText = await response.text()
  let responseData: any = {}
  try {
    responseData = JSON.parse(responseText)
  } catch {
    console.warn("[submitFeedback] Non-JSON response body:", responseText.slice(0, 200))
  }

  if (!response.ok) {
    const err: FeedbackError = new Error(
      responseData?.errors?.[0]?.message ?? `Feedback submission failed: ${response.statusText}`
    )
    err.errors = responseData?.errors ?? []
    throw err
  }
}
