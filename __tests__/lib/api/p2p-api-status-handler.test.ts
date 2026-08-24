import { extractP2PErrorCode, handleP2PApiStatusCode } from "@/lib/api/p2p-api-status-handler"
import { useP2PMaintenanceStore } from "@/stores/p2p-maintenance-store"
import { useUserCountryInvalidStore } from "@/stores/user-country-invalid-store"

describe("p2p-api-status-handler", () => {
  beforeEach(() => {
    useP2PMaintenanceStore.getState().clearMaintenance()
    useUserCountryInvalidStore.getState().clearUserCountryInvalid()
  })

  describe("extractP2PErrorCode", () => {
    it("returns null for non-object bodies", () => {
      expect(extractP2PErrorCode(null)).toBeNull()
      expect(extractP2PErrorCode("error")).toBeNull()
    })

    it("returns the first error code when present", () => {
      expect(
        extractP2PErrorCode({ errors: [{ code: "P2PDisabled" }] }),
      ).toBe("P2PDisabled")
    })
  })

  describe("handleP2PApiStatusCode", () => {
    it("latches maintenance when code is P2PDisabled", () => {
      handleP2PApiStatusCode("P2PDisabled")
      expect(useP2PMaintenanceStore.getState().isApiMaintenanceActive).toBe(true)
    })

    it("latches region-not-supported when code is UserCountryInvalid", () => {
      handleP2PApiStatusCode("UserCountryInvalid")
      expect(useUserCountryInvalidStore.getState().isUserCountryInvalid).toBe(true)
    })

    it("ignores unknown codes", () => {
      handleP2PApiStatusCode("UserTempBan")
      expect(useP2PMaintenanceStore.getState().isApiMaintenanceActive).toBe(false)
      expect(useUserCountryInvalidStore.getState().isUserCountryInvalid).toBe(false)
    })
  })
})
