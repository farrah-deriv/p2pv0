import { shouldShowMobileFooterNav } from "@/lib/mobile-footer-nav"

describe("shouldShowMobileFooterNav", () => {
  it("hides on order detail pages", () => {
    expect(shouldShowMobileFooterNav("/orders/abc123", false, false)).toBe(false)
  })

  it("hides when chat is visible", () => {
    expect(shouldShowMobileFooterNav("/orders", true, false)).toBe(false)
  })

  it("hides on ad create and edit pages", () => {
    expect(shouldShowMobileFooterNav("/ads/create", false, false)).toBe(false)
    expect(shouldShowMobileFooterNav("/ads/edit/1", false, false)).toBe(false)
  })

  it("hides on wallet transaction list", () => {
    expect(shouldShowMobileFooterNav("/wallet", false, true)).toBe(false)
  })

  it("shows on orders list and markets", () => {
    expect(shouldShowMobileFooterNav("/orders", false, false)).toBe(true)
    expect(shouldShowMobileFooterNav("/", false, false)).toBe(true)
  })
})
