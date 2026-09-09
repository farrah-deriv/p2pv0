import en from "@/lib/i18n/translations/en.json"
import { indefiniteArticleFor } from "@/lib/i18n/indefinite-article"
import { resolveTranslation } from "@/lib/i18n/translation-tree"
import type { TranslationTree } from "@/lib/i18n/translation-tree"

const englishTree = en as TranslationTree

describe("indefiniteArticleFor", () => {
  it.each(["ZAR", "USD", "BRL", "GBP", "CAD", "PHP"])(
    "returns 'a' for %s",
    (code) => {
      expect(indefiniteArticleFor(code)).toBe("a")
    },
  )

  it.each(["EUR", "IDR", "AED", "NGN", "MXN", "LKR", "HKD", "XOF"])(
    "returns 'an' for %s",
    (code) => {
      expect(indefiniteArticleFor(code)).toBe("an")
    },
  )

  it("ignores casing", () => {
    expect(indefiniteArticleFor("zar")).toBe("a")
    expect(indefiniteArticleFor("eur")).toBe("an")
  })

  it("falls back to 'a' for an empty or non-letter code", () => {
    expect(indefiniteArticleFor("")).toBe("a")
    expect(indefiniteArticleFor("1ST")).toBe("a")
  })
})

describe("market.noAdsDescription", () => {
  it("agrees with the interpolated currency code", () => {
    expect(
      resolveTranslation(englishTree, englishTree, "market.noAdsDescription", {
        article: "a",
        currency: "ZAR",
      }),
    ).toBe("Create a ZAR ad to get started, or switch to another currency.")
  })

  it("renders the markets empty-state copy for each currency", () => {
    const render = (currency: string) =>
      resolveTranslation(englishTree, englishTree, "market.noAdsDescription", {
        article: indefiniteArticleFor(currency),
        currency,
      })

    expect(render("ZAR")).toBe(
      "Create a ZAR ad to get started, or switch to another currency.",
    )
    expect(render("USD")).toBe(
      "Create a USD ad to get started, or switch to another currency.",
    )
    expect(render("EUR")).toBe(
      "Create an EUR ad to get started, or switch to another currency.",
    )
    expect(render("IDR")).toBe(
      "Create an IDR ad to get started, or switch to another currency.",
    )
  })
})
