import en from "@/lib/i18n/translations/en.json"
import { resolveTranslation } from "@/lib/i18n/translation-tree"
import type { TranslationTree } from "@/lib/i18n/translation-tree"

const englishTree = en as TranslationTree

describe("resolveTranslation", () => {
  it("resolves nested keys", () => {
    expect(resolveTranslation(englishTree, englishTree, "common.buy")).toBe("Buy")
  })

  it("substitutes parameters", () => {
    const tree = {
      order: {
        orderLimitError: "Order limit: {min} - {max} {currency}",
      },
    } as TranslationTree

    expect(
      resolveTranslation(tree, englishTree, "order.orderLimitError", {
        min: "10",
        max: "100",
        currency: "USD",
      }),
    ).toBe("Order limit: 10 - 100 USD")
  })

  it("falls back to English when key is missing in locale tree", () => {
    const sparse = { common: {} } as TranslationTree
    expect(resolveTranslation(sparse, englishTree, "common.buy")).toBe("Buy")
  })

  it("returns the key when missing everywhere", () => {
    expect(resolveTranslation(englishTree, englishTree, "does.not.exist")).toBe(
      "does.not.exist",
    )
  })
})
