import { p2pMaintenanceRedirectFor } from "@/lib/p2p-maintenance-route-guard"

describe("p2pMaintenanceRedirectFor", () => {
  it("returns null for allowed tab roots", () => {
    expect(p2pMaintenanceRedirectFor("/")).toBeNull()
    expect(p2pMaintenanceRedirectFor("/orders")).toBeNull()
    expect(p2pMaintenanceRedirectFor("/ads")).toBeNull()
    expect(p2pMaintenanceRedirectFor("/wallet")).toBeNull()
    expect(p2pMaintenanceRedirectFor("/profile")).toBeNull()
  })

  it("redirects sub-routes to nearest tab root", () => {
    expect(p2pMaintenanceRedirectFor("/advertiser/123")).toBe("/")
    expect(p2pMaintenanceRedirectFor("/advertiser")).toBe("/")
    expect(p2pMaintenanceRedirectFor("/orders/456")).toBe("/orders")
    expect(p2pMaintenanceRedirectFor("/ads/create")).toBe("/ads")
    expect(p2pMaintenanceRedirectFor("/wallet/transfer")).toBe("/wallet")
    expect(p2pMaintenanceRedirectFor("/profile/settings")).toBe("/profile")
  })

  it("does not match /advertiser-settings as advertiser route", () => {
    expect(p2pMaintenanceRedirectFor("/advertiser-settings")).toBe("/")
  })

  it("does not match similarly named wallet or profile routes", () => {
    expect(p2pMaintenanceRedirectFor("/wallet-settings")).toBe("/")
    expect(p2pMaintenanceRedirectFor("/profile-settings")).toBe("/")
  })

  it("strips query and hash before matching", () => {
    expect(p2pMaintenanceRedirectFor("/orders/456?tab=past")).toBe("/orders")
    expect(p2pMaintenanceRedirectFor("/ads/create#step-2")).toBe("/ads")
    expect(p2pMaintenanceRedirectFor("/?currency=USD")).toBeNull()
  })

  it("falls back to markets for unknown paths", () => {
    expect(p2pMaintenanceRedirectFor("/unknown")).toBe("/")
  })
})
