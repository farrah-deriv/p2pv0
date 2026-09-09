import {
  clearTranslationCacheForTests,
  getTranslationTree,
  isLocaleLoaded,
  loadLocale,
} from "@/lib/i18n/translation-loader"

describe("translation-loader", () => {
  beforeEach(() => {
    clearTranslationCacheForTests()
  })

  it("bundles English without dynamic import", () => {
    expect(isLocaleLoaded("en")).toBe(true)
    expect(getTranslationTree("en").common.buy).toBe("Buy")
  })

  it("falls back to English until a locale chunk is loaded", () => {
    expect(isLocaleLoaded("fr")).toBe(false)
    expect(getTranslationTree("fr").common.buy).toBe("Buy")
  })

  it("loads a locale chunk on demand", async () => {
    await loadLocale("fr")
    expect(isLocaleLoaded("fr")).toBe(true)
    const buy = getTranslationTree("fr").common?.buy
    expect(typeof buy).toBe("string")
    expect(buy).not.toBe("")
  })
})
