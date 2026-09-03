import { assertP2PEmailEligibleForMutation, wrapWithP2PEmailMutationGate } from "@/lib/p2p-email-mutation-guard"
import { P2P_EMAIL_REQUIRED_ERROR } from "@/lib/email-eligibility"
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

describe("p2p-email-mutation-guard", () => {
  const mockSetEmailEligibility = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetState.mockReturnValue({
      userId: "p2p-user-1",
      emailEligibility: "unknown",
      setEmailEligibility: mockSetEmailEligibility,
    } as ReturnType<typeof useUserDataStore.getState>)
  })

  describe("assertP2PEmailEligibleForMutation", () => {
    it("skips the gate when the user has no P2P profile yet", async () => {
      mockGetState.mockReturnValue({
        userId: "",
        emailEligibility: "missing",
        setEmailEligibility: mockSetEmailEligibility,
      } as ReturnType<typeof useUserDataStore.getState>)

      await assertP2PEmailEligibleForMutation()

      expect(mockGetClientProfile).not.toHaveBeenCalled()
    })

    it("skips profile fetch when store already marks the user eligible", async () => {
      mockGetState.mockReturnValue({
        userId: "p2p-user-1",
        emailEligibility: "eligible",
        setEmailEligibility: mockSetEmailEligibility,
      } as ReturnType<typeof useUserDataStore.getState>)

      await assertP2PEmailEligibleForMutation()

      expect(mockGetClientProfile).not.toHaveBeenCalled()
      expect(mockSetEmailEligibility).not.toHaveBeenCalled()
    })

    it("fails open when the client profile cannot be fetched", async () => {
      mockGetClientProfile.mockResolvedValue(null)

      await expect(assertP2PEmailEligibleForMutation()).resolves.toBeUndefined()

      expect(mockSetEmailEligibility).not.toHaveBeenCalled()
    })

    it("throws when the profile has no email", async () => {
      mockGetClientProfile.mockResolvedValue({ email: "" } as Awaited<ReturnType<typeof AuthAPI.getClientProfile>>)

      await expect(assertP2PEmailEligibleForMutation()).rejects.toMatchObject({
        code: P2P_EMAIL_REQUIRED_ERROR,
      })
      expect(mockSetEmailEligibility).toHaveBeenCalledWith("missing")
    })

    it("allows the mutation when the profile has an email", async () => {
      mockGetClientProfile.mockResolvedValue({ email: "user@example.com" } as Awaited<
        ReturnType<typeof AuthAPI.getClientProfile>
      >)

      await expect(assertP2PEmailEligibleForMutation()).resolves.toBeUndefined()
      expect(mockSetEmailEligibility).toHaveBeenCalledWith("eligible")
    })
  })

  describe("wrapWithP2PEmailMutationGate", () => {
    it("runs the wrapped mutation after eligibility passes", async () => {
      mockGetState.mockReturnValue({
        userId: "p2p-user-1",
        emailEligibility: "eligible",
        setEmailEligibility: mockSetEmailEligibility,
      } as ReturnType<typeof useUserDataStore.getState>)
      const mutation = jest.fn().mockResolvedValue("ok")
      const gated = wrapWithP2PEmailMutationGate(mutation)

      await expect(gated("arg")).resolves.toBe("ok")
      expect(mutation).toHaveBeenCalledWith("arg")
    })
  })
})
