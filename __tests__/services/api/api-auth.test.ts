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
