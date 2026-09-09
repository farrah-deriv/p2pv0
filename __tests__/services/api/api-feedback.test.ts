import { submitFeedback } from "@/services/api/api-auth"
import jest from "jest"

global.fetch = jest.fn()

jest.mock("@/lib/get-core-url", () => ({
  getCoreUrl: () => "https://test.api.deriv.com",
}))

jest.mock("@/stores/user-data-store", () => ({
  useUserDataStore: { getState: jest.fn() },
}))

jest.mock("@/stores/market-filter-store", () => ({
  useMarketFilterStore: { getState: jest.fn() },
}))

jest.mock("@/lib/react-query-client", () => ({
  queryClient: { getQueryData: jest.fn(), fetchQuery: jest.fn() },
}))

jest.mock("@/hooks/use-api-queries", () => ({
  queryKeys: {
    auth: { me: () => ["api", "auth", "me"], settings: () => ["api", "auth", "settings"] },
  },
}))

describe("submitFeedback", () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("sends correct POST payload", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "{}",
    } as Response)

    await submitFeedback("user-123", { nps_score: 10, review_text: "Great app experience." })

    expect(mockFetch).toHaveBeenCalledWith(
      "https://test.api.deriv.com/p2p/v1/users/user-123/feedback",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          data: { nps_score: 10, review_text: "Great app experience." },
        }),
      })
    )
  })

  it("resolves successfully on 2xx response", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "{}",
    } as Response)

    await expect(
      submitFeedback("user-123", { nps_score: 8, review_text: "Good." })
    ).resolves.toBeUndefined()
  })

  it("throws FeedbackError with errors array on HTTP error response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: "Bad Request",
      text: async () =>
        JSON.stringify({ errors: [{ code: "FeedbackAlreadyExists", message: "Already submitted." }] }),
    } as Response)

    try {
      await submitFeedback("user-123", { nps_score: 5, review_text: "Test." })
      fail("should have thrown")
    } catch (err: any) {
      expect(err.errors).toEqual([{ code: "FeedbackAlreadyExists", message: "Already submitted." }])
    }
  })

  it("throws with empty errors array when body is non-JSON on error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: "Server Error",
      text: async () => "Internal Server Error",
    } as Response)

    try {
      await submitFeedback("user-123", { nps_score: 3, review_text: "Test." })
      fail("should have thrown")
    } catch (err: any) {
      expect(err.errors).toEqual([])
    }
  })
})
