import { getRemoteConfig, getFeatureFlag } from "@/services/api/api-remote-config"

// Mock fetch globally
global.fetch = jest.fn()

describe("api-remote-config", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("getRemoteConfig", () => {
    it("should fetch remote config successfully", async () => {
      const mockConfig = { ory: true, otherFlag: false }
        ; (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockConfig }),
        })

      const result = await getRemoteConfig()

      expect(global.fetch).toHaveBeenCalledWith(
        `${process.env.NEXT_PUBLIC_CORE_URL}/v1/fe/remote-config`,
        expect.objectContaining({
          method: "GET",
          credentials: "include",
        })
      )
      expect(result).toEqual(mockConfig)
    })

    it("should return default config when fetch fails", async () => {
      ; (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      })

      const result = await getRemoteConfig()

      expect(result).toEqual({ ory: false })
    })

    it("should return default config on network error", async () => {
      ; (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"))

      const result = await getRemoteConfig()

      expect(result).toEqual({ ory: false })
    })

    it("should handle missing data in response", async () => {
      ; (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      const result = await getRemoteConfig()

      expect(result).toEqual({ ory: false })
    })
  })

  describe("getFeatureFlag", () => {
    it("should return feature flag value when it exists", async () => {
      const mockConfig = { ory: true, otherFlag: false }
        ; (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockConfig }),
        })

      const result = await getFeatureFlag("ory")

      expect(result).toBe(true)
    })

    it("should return false when feature flag does not exist", async () => {
      const mockConfig = { ory: true }
        ; (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockConfig }),
        })

      const result = await getFeatureFlag("nonExistentFlag")

      expect(result).toBe(false)
    })

    it("should return false on error", async () => {
      ; (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"))

      const result = await getFeatureFlag("ory")

      expect(result).toBe(false)
    })
  })
})
