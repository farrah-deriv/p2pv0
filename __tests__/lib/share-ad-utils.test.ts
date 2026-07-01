import {
  buildAdUrl,
  buildShareAdRateValue,
  buildShareAdShareMessage,
} from "@/lib/share-ad-utils"

const baseAd = {
  id: "42",
  type: "Sell",
  rate: { value: "16,000.00", percentage: "0", currency: "IDR" },
  limits: { min: 10, max: 100, currency: "IDR" },
  available: { current: 50, total: 50, currency: "USD" },
  paymentMethods: [],
  status: "Active",
  description: "",
  account_currency: "USD",
  exchange_rate_type: "float",
  exchange_rate: 1.5,
  user: { id: "user-99" },
}

describe("buildAdUrl", () => {
  it("returns HTTPS advertiser URL", () => {
    expect(buildAdUrl(baseAd, "https://p2p.deriv.com")).toBe(
      "https://p2p.deriv.com/advertiser/user-99?adId=42",
    )
  })

  it("never returns a deep link", () => {
    const url = buildAdUrl(baseAd, "https://p2p.deriv.com")
    expect(url).not.toContain("p2pv2://")
    expect(url.startsWith("https://")).toBe(true)
  })
})

describe("buildShareAdRateValue", () => {
  it("formats float rate with plus prefix", () => {
    expect(buildShareAdRateValue(baseAd)).toBe("+1.5%")
  })

  it("uses fixed rate value when not float", () => {
    const ad = {
      ...baseAd,
      exchange_rate_type: "fixed",
      rate: { value: "16,000.00", percentage: "0", currency: "IDR" },
    }
    expect(buildShareAdRateValue(ad)).toBe("16,000.00")
  })
})

describe("buildShareAdShareMessage", () => {
  it("passes currency, rate, and HTTPS url to shareMessage", () => {
    const adUrl = "https://p2p.deriv.com/advertiser/user-99?adId=42"
    const message = buildShareAdShareMessage(baseAd, adUrl, (key, params) => {
      expect(key).toBe("shareAdPage.shareMessage")
      return `msg:${params.currency}:${params.rate}:${params.url}`
    })
    expect(message).toBe("msg:USD:+1.5%:https://p2p.deriv.com/advertiser/user-99?adId=42")
  })
})
