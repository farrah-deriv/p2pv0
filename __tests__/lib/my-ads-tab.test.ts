import {
  MY_ADS_FROM_TAB_QUERY,
  MY_ADS_TAB_QUERY,
  editAdPath,
  myAdsPath,
  parseMyAdsTab,
} from "@/lib/ads/my-ads-tab"

describe("my-ads-tab", () => {
  it("parses tab query values", () => {
    expect(parseMyAdsTab("inactive")).toBe("inactive")
    expect(parseMyAdsTab("active")).toBe("active")
    expect(parseMyAdsTab(null)).toBeUndefined()
  })

  it("builds list paths with inactive tab query", () => {
    expect(myAdsPath()).toBe("/ads")
    expect(myAdsPath("inactive")).toBe(`/ads?${MY_ADS_TAB_QUERY}=inactive`)
  })

  it("builds edit paths preserving fromTab", () => {
    expect(editAdPath("42")).toBe("/ads/edit/42")
    expect(editAdPath("42", "inactive")).toBe(
      `/ads/edit/42?${MY_ADS_FROM_TAB_QUERY}=inactive`,
    )
  })
})
