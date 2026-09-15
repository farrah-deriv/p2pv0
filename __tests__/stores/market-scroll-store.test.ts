import {
  saveMarketScrollTop,
  getMarketScrollTop,
  clearMarketScrollTop,
} from "@/stores/market-scroll-store"

describe("market-scroll-store", () => {
  // Module-level state persists across tests, so reset after each one.
  afterEach(() => {
    clearMarketScrollTop()
  })

  it("returns 0 by default", () => {
    expect(getMarketScrollTop()).toBe(0)
  })

  it("saves and retrieves a positive offset", () => {
    saveMarketScrollTop(400)
    expect(getMarketScrollTop()).toBe(400)
  })

  it("clamps negative offsets to 0", () => {
    saveMarketScrollTop(-50)
    expect(getMarketScrollTop()).toBe(0)
  })

  it("treats 0 as no saved offset", () => {
    saveMarketScrollTop(0)
    expect(getMarketScrollTop()).toBe(0)
  })

  it("overwrites a previously saved offset", () => {
    saveMarketScrollTop(200)
    saveMarketScrollTop(750)
    expect(getMarketScrollTop()).toBe(750)
  })

  it("clear resets to 0", () => {
    saveMarketScrollTop(200)
    clearMarketScrollTop()
    expect(getMarketScrollTop()).toBe(0)
  })
})
