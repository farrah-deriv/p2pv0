import { shouldShowP2PMaintenanceBanner } from "@/lib/p2p-maintenance-constants"

describe("shouldShowP2PMaintenanceBanner", () => {
  it("returns true for main tab roots", () => {
    expect(shouldShowP2PMaintenanceBanner("/")).toBe(true)
    expect(shouldShowP2PMaintenanceBanner("/orders")).toBe(true)
    expect(shouldShowP2PMaintenanceBanner("/ads")).toBe(true)
    expect(shouldShowP2PMaintenanceBanner("/wallet")).toBe(true)
  })

  it("returns false for profile", () => {
    expect(shouldShowP2PMaintenanceBanner("/profile")).toBe(false)
    expect(shouldShowP2PMaintenanceBanner("/profile?tab=stats")).toBe(false)
  })

  it("returns false for sub-routes and other pages", () => {
    expect(shouldShowP2PMaintenanceBanner("/orders/42")).toBe(false)
    expect(shouldShowP2PMaintenanceBanner("/login")).toBe(false)
  })
})
