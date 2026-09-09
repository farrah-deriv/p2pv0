import {
  extractP2PErrorCode,
  handleP2PApiStatusCode,
  reportUnrecognizedErrorEnvelope,
} from "@/lib/api/p2p-api-status-handler"
import { useP2PMaintenanceStore } from "@/stores/p2p-maintenance-store"
import { RecordingReporter } from "./test-helpers"
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

  describe("reportUnrecognizedErrorEnvelope", () => {
    let reporter: RecordingReporter

    beforeEach(() => {
      reporter = new RecordingReporter()
    })

    it("does not report a singular error{code,message} wrapper", () => {
      reportUnrecognizedErrorEnvelope(reporter, "p2p/v1/orders", {
        error: { code: "SomeCode", message: "Some message" },
      })
      expect(reporter.mismatches).toHaveLength(0)
    })

    it("does not report a plural errors[{code}] wrapper", () => {
      reportUnrecognizedErrorEnvelope(reporter, "p2p/v1/orders", {
        errors: [{ code: "SomeCode" }],
      })
      expect(reporter.mismatches).toHaveLength(0)
    })

    it("reports a flat {code,message} body with no wrapper", () => {
      reportUnrecognizedErrorEnvelope(reporter, "p2p/v1/orders", {
        code: "ERROR_FATAL",
        message: "SQL Error: 0",
      })
      expect(reporter.mismatches).toHaveLength(1)
      const mismatch = reporter.mismatches[0]
      expect(mismatch.endpoint).toBe("p2p/v1/orders")
      expect(mismatch.field).toBe("(error_envelope)")
      expect(mismatch.actual).toBe("code,message")
    })

    it("reports a non-object body with its runtime type", () => {
      reportUnrecognizedErrorEnvelope(reporter, "p2p/v1/orders", "oops")
      expect(reporter.mismatches).toHaveLength(1)
      expect(reporter.mismatches[0].actual).toBe("string")
    })

    it("reports an empty errors[] list as unrecognized", () => {
      reportUnrecognizedErrorEnvelope(reporter, "p2p/v1/orders", { errors: [] })
      expect(reporter.mismatches).toHaveLength(1)
      expect(reporter.mismatches[0].actual).toBe("errors")
    })
  })
})
