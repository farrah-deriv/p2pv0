import { getKycStatus, getOnboardingStatus } from "@/services/api/api-auth"
import * as AuthAPI from "@/services/api/api-auth"
import * as RemoteConfigAPI from "@/services/api/api-remote-config"
import { API, AUTH } from "@/lib/local-variables"
import jest from "jest" // Import jest to fix the undeclared variable error

// Mock fetch
global.fetch = jest.fn()

jest.mock("@/services/api/api-remote-config")

describe("getKycStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should fetch KYC status successfully", async () => {
    const mockResponse = {
      data: {
        profile_completed: true,
        biometrics_completed: false,
        show_onboarding: true,
      },
    }

    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const result = await getKycStatus()

    expect(fetch).toHaveBeenCalledWith(`${API.coreUrl}/client/kyc-status`, {
      method: "GET",
      credentials: "include",
      headers: AUTH.getAuthHeader(),
    })

    expect(result).toEqual(mockResponse.data)
  })

  it("should handle API errors gracefully", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: "Internal Server Error",
    } as Response)

    const result = await getKycStatus()

    expect(result).toEqual({
      profile_completed: false,
      biometrics_completed: false,
      show_onboarding: false,
    })
  })

  it("should handle network errors", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockRejectedValue(new Error("Network error"))

    const result = await getKycStatus()

    expect(result).toEqual({
      profile_completed: false,
      biometrics_completed: false,
      show_onboarding: false,
    })
  })

  it("should return default values when data is missing", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response)

    const result = await getKycStatus()

    expect(result).toEqual({
      profile_completed: false,
      biometrics_completed: false,
      show_onboarding: true,
    })
  })
})

describe("getOnboardingStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("bypasses the HTTP cache for a fresh onboarding decision", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      clone: () => ({ json: async () => ({ data: {} }) }),
      json: async () => ({ data: {} }),
    } as unknown as Response)

    await getOnboardingStatus()

    expect(fetch).toHaveBeenCalledWith(
      `${API.coreUrl}/client/onboarding-status`,
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        cache: "no-store",
      }),
    )
  })
})

describe("getSession", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should call Ory endpoint when ory flag is enabled", async () => {
    ; (RemoteConfigAPI.getFeatureFlag as jest.Mock).mockResolvedValueOnce(true)

    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      status: 200,
    } as Response)

    const result = await AuthAPI.getSession()

    expect(RemoteConfigAPI.getFeatureFlag).toHaveBeenCalledWith("ory")
    expect(fetch).toHaveBeenCalledWith(
      "https://staging-auth.deriv.com/sessions/whoami",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      })
    )
    expect(result).toBe(true)
  })

  it("should call legacy session endpoint when ory flag is disabled", async () => {
    ; (RemoteConfigAPI.getFeatureFlag as jest.Mock).mockResolvedValueOnce(false)

    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      status: 200,
    } as Response)

    const result = await AuthAPI.getSession()

    expect(RemoteConfigAPI.getFeatureFlag).toHaveBeenCalledWith("ory")
    expect(fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_CORE_URL}/v1/session`,
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      })
    )
    expect(result).toBe(true)
  })

  it("should return false when session is invalid", async () => {
    ; (RemoteConfigAPI.getFeatureFlag as jest.Mock).mockResolvedValueOnce(false)

    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      status: 401,
    } as Response)

    const result = await AuthAPI.getSession()

    expect(result).toBe(false)
  })

  it("should handle network errors gracefully", async () => {
    ; (RemoteConfigAPI.getFeatureFlag as jest.Mock).mockResolvedValueOnce(false)

    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockRejectedValue(new Error("Network error"))

    const result = await AuthAPI.getSession()

    expect(result).toBe(false)
  })
})

describe("getClientPreferences", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns preferred_language from the API", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { preferred_language: "fr" } }),
    } as Response)

    const result = await AuthAPI.getClientPreferences()

    expect(fetch).toHaveBeenCalledWith(`${API.coreUrl}/v1/client/preferences`, {
      method: "GET",
      credentials: "include",
      headers: AUTH.getAuthHeader(),
    })
    expect(result).toBe("fr")
  })

  it("returns null when the request fails", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: false,
    } as Response)

    const result = await AuthAPI.getClientPreferences()

    expect(result).toBeNull()
  })
})

describe("updatePreferredLanguage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("PUTs canonical BCP-47 preferred_language", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: true,
    } as Response)

    await AuthAPI.updatePreferredLanguage("zh_TW")

    expect(fetch).toHaveBeenCalledWith(`${API.coreUrl}/v1/client/preferred-language`, {
      method: "PUT",
      credentials: "include",
      headers: AUTH.getAuthHeader(),
      body: JSON.stringify({ preferred_language: "zh-TW" }),
    })
  })
})

/**
 * Regression coverage for the wallet list rendering "Couldn't load wallets" instead of
 * the BuyCurrencies empty state for clients with no P2P wallet (phone-only signups).
 * `/v1/client/total-balance` answers 403/404 for that cohort — a final answer, not a
 * failure — so `getTotalBalance` must resolve with zero wallets rather than throw.
 */
describe("getTotalBalance", () => {
  const jsonResponse = (status: number, body: unknown) =>
    ({
      ok: status >= 200 && status < 300,
      status,
      statusText: `status ${status}`,
      headers: { get: () => "application/json" },
      clone: () => ({ json: async () => body }),
      json: async () => body,
    }) as unknown as Response

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("resolves with zero wallets on 403 (no P2P profile yet)", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue(jsonResponse(403, { errors: [{ code: "PermissionDenied" }] }))

    await expect(AuthAPI.getTotalBalance()).resolves.toEqual({ wallets: { items: [] } })
  })

  it("resolves with zero wallets on 404 (no wallet provisioned yet)", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue(jsonResponse(404, { errors: [{ code: "NotFound" }] }))

    await expect(AuthAPI.getTotalBalance()).resolves.toEqual({ wallets: { items: [] } })
  })

  it("still throws on 5xx so the wallet list keeps its error state and Retry", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue(jsonResponse(500, { errors: [{ code: "ServerError" }] }))

    await expect(AuthAPI.getTotalBalance()).rejects.toThrow()
  })

  it("still throws on a network failure", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"))

    await expect(AuthAPI.getTotalBalance()).rejects.toThrow()
  })

  it("returns the parsed wallet items on 200", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue(
      jsonResponse(200, {
        data: {
          wallets: {
            items: [
              { type: "p2p", total_balance: { approximate_total_balance: "10.00", converted_to: "USD" } },
            ],
          },
        },
      }),
    )

    const result = await AuthAPI.getTotalBalance()

    expect(result.wallets.items).toHaveLength(1)
    expect(result.wallets.items[0].total_balance?.approximate_total_balance).toBe("10.00")
  })

  /**
   * The reporting cohort's real 200 payload, from a live network capture: an enabled p2p
   * wallet with an empty `balances[]` and NO item-level `total_balance` block. The backend
   * simply omits the block for a wallet with nothing in it. Requiring it made
   * `parseArrayWithItemIsolation` reject 1-of-1 items, trip its all-items-rejected throw,
   * and pin the list on "Couldn't load wallets" instead of the BuyCurrencies empty state.
   */
  it("resolves a 200 whose wallet item omits the item-level total_balance", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue(
      jsonResponse(200, {
        data: {
          total_balance: { amount: "0.00", currency: "USD" },
          wallets: {
            total_balance: { amount: "0.00", currency: "USD" },
            items: [
              {
                wallet_id: "fafedafa-47e5-431f-8969-b290705d04b4",
                counterparty: "dsvg",
                brand: "deriv",
                type: "p2p",
                status: "enabled",
                balances: [],
                pending_balance: [],
              },
            ],
          },
        },
      }),
    )

    const result = await AuthAPI.getTotalBalance()

    expect(result.wallets.items).toHaveLength(1)
    expect(result.wallets.items[0].total_balance).toBeUndefined()
    // `.passthrough()` must keep the rest of the item intact for `processBalanceData`.
    expect((result.wallets.items[0] as Record<string, unknown>).balances).toEqual([])
  })

  /**
   * Optional must not mean unvalidated: a `total_balance` that IS present still has to
   * carry a usable `approximate_total_balance`, and an item that fails that is still
   * rejected — which, as the only item, still throws.
   */
  it("still rejects a wallet item whose present total_balance is malformed", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue(
      jsonResponse(200, {
        data: {
          wallets: {
            items: [{ type: "p2p", total_balance: { approximate_total_balance: null } }],
          },
        },
      }),
    )

    await expect(AuthAPI.getTotalBalance()).rejects.toThrow()
  })

  it("keeps an item with no total_balance while dropping one whose total_balance is malformed", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue(
      jsonResponse(200, {
        data: {
          wallets: {
            items: [
              { type: "main", total_balance: { approximate_total_balance: { nested: "object" } } },
              { type: "p2p", balances: [] },
            ],
          },
        },
      }),
    )

    const result = await AuthAPI.getTotalBalance()

    expect(result.wallets.items).toHaveLength(1)
    expect(result.wallets.items[0].type).toBe("p2p")
  })
})
