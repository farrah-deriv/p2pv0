import { refreshClientProfileEmailEligibility } from "@/lib/refresh-client-profile-email-eligibility"
import * as AuthAPI from "@/services/api/api-auth"
import { useUserDataStore } from "@/stores/user-data-store"
import jest from "jest"

jest.mock("@/services/api/api-auth", () => ({
  getClientProfile: jest.fn(),
}))

jest.mock("@/stores/user-data-store", () => ({
  useUserDataStore: {
    getState: jest.fn(),
  },
}))

const mockGetClientProfile = AuthAPI.getClientProfile as jest.MockedFunction<typeof AuthAPI.getClientProfile>
const mockGetState = useUserDataStore.getState as jest.MockedFunction<typeof useUserDataStore.getState>

describe("refreshClientProfileEmailEligibility", () => {
  const mockSetEmailEligibility = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetState.mockReturnValue({
      setEmailEligibility: mockSetEmailEligibility,
    } as ReturnType<typeof useUserDataStore.getState>)
  })

  it("dedupes concurrent profile fetches", async () => {
    let resolveProfile: ((value: { email: string }) => void) | undefined
    mockGetClientProfile.mockReturnValue(
      new Promise((resolve) => {
        resolveProfile = resolve
      }),
    )

    const first = refreshClientProfileEmailEligibility()
    const second = refreshClientProfileEmailEligibility()

    resolveProfile?.({ email: "user@example.com" })

    await expect(first).resolves.toBe("eligible")
    await expect(second).resolves.toBe("eligible")
    expect(mockGetClientProfile).toHaveBeenCalledTimes(1)
    expect(mockSetEmailEligibility).toHaveBeenCalledWith("loading")
    expect(mockSetEmailEligibility).toHaveBeenCalledWith("eligible")
  })

  it("marks missing email as missing", async () => {
    mockGetClientProfile.mockResolvedValue({ email: "" })

    await expect(refreshClientProfileEmailEligibility()).resolves.toBe("missing")

    expect(mockSetEmailEligibility).toHaveBeenCalledWith("missing")
  })

  it("marks profile fetch failures as error", async () => {
    mockGetClientProfile.mockResolvedValue(null)

    await expect(refreshClientProfileEmailEligibility()).resolves.toBe("error")

    expect(mockSetEmailEligibility).toHaveBeenCalledWith("error")
  })
})
