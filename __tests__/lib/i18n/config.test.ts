import {
  apiPreferredLanguageToLocale,
  isRtlLocale,
  localeToBcp47,
  locales,
  normalizeLocaleParam,
} from "@/lib/i18n/config"
import {
  getServerHtmlLocale,
  LOCALE_COOKIE_NAME,
  persistLocaleCookie,
  resolveLocaleFromCookieValue,
} from "@/lib/i18n/locale-cookie"

describe("normalizeLocaleParam", () => {
  it("handles case variations and aliases", () => {
    expect(normalizeLocaleParam("ZH-TW")).toBe("zh_TW")
    expect(normalizeLocaleParam("zh-tw")).toBe("zh_TW")
    expect(normalizeLocaleParam("zh_tw")).toBe("zh_TW")
    expect(normalizeLocaleParam("zh-CN")).toBe("zh")
    expect(normalizeLocaleParam("zh-cn")).toBe("zh")
    expect(normalizeLocaleParam("zh-Hans")).toBe("zh")
    expect(normalizeLocaleParam("zh-Hant")).toBe("zh_TW")
    expect(normalizeLocaleParam("AR")).toBe("ar")
  })

  it("returns null for invalid locales", () => {
    expect(normalizeLocaleParam("invalid")).toBeNull()
    expect(normalizeLocaleParam("<script>")).toBeNull()
    expect(normalizeLocaleParam("")).toBeNull()
  })
})

describe("isRtlLocale", () => {
  it("identifies Arabic as RTL", () => {
    expect(isRtlLocale("ar")).toBe(true)
  })

  it("identifies all other locales as LTR", () => {
    const ltrLocales = locales.filter((locale) => locale !== "ar")
    ltrLocales.forEach((locale) => {
      expect(isRtlLocale(locale)).toBe(false)
    })
  })
})

describe("localeToBcp47", () => {
  it("maps Chinese locales to BCP 47 tags", () => {
    expect(localeToBcp47("zh_TW")).toBe("zh-TW")
    expect(localeToBcp47("zh")).toBe("zh-CN")
  })
})

describe("apiPreferredLanguageToLocale", () => {
  it("maps API preferred_language values to supported locales", () => {
    expect(apiPreferredLanguageToLocale("en")).toBe("en")
    expect(apiPreferredLanguageToLocale("zh-CN")).toBe("zh")
    expect(apiPreferredLanguageToLocale("zh_tw")).toBe("zh_TW")
  })

  it("returns null for unsupported values", () => {
    expect(apiPreferredLanguageToLocale("invalid")).toBeNull()
    expect(apiPreferredLanguageToLocale("")).toBeNull()
  })
})

describe("locale-cookie", () => {
  describe("resolveLocaleFromCookieValue", () => {
    it("resolves supported locale codes", () => {
      expect(resolveLocaleFromCookieValue("ar")).toBe("ar")
      expect(resolveLocaleFromCookieValue("zh_TW")).toBe("zh_TW")
      expect(resolveLocaleFromCookieValue("zh-CN")).toBe("zh")
    })

    it("returns null for invalid values", () => {
      expect(resolveLocaleFromCookieValue("")).toBeNull()
      expect(resolveLocaleFromCookieValue("invalid")).toBeNull()
      expect(resolveLocaleFromCookieValue(undefined)).toBeNull()
    })
  })

  describe("getServerHtmlLocale", () => {
    it("falls back to English when cookie is missing or invalid", () => {
      expect(getServerHtmlLocale(undefined)).toBe("en")
      expect(getServerHtmlLocale("not-a-locale")).toBe("en")
    })

    it("uses cookie value when valid", () => {
      expect(getServerHtmlLocale("ar")).toBe("ar")
    })
  })

  describe("persistLocaleCookie", () => {
    it("writes locale to document.cookie", () => {
      persistLocaleCookie("ar")
      expect(document.cookie).toContain(`${LOCALE_COOKIE_NAME}=ar`)
    })
  })
})
