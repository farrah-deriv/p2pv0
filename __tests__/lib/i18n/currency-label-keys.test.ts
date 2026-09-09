import fs from "fs"
import path from "path"

/**
 * The create-ad trade-type tabs and the review summary both render a
 * "<verb> <currency>" label. Building it by concatenation puts the currency code
 * in the wrong place in de/ko/mn/ta/zh, so both call sites resolve the whole
 * phrase through a single parameterised key. These keys therefore have to exist,
 * carry the {currency} placeholder, and be genuinely translated in every locale.
 */

const TRANSLATIONS_DIR = path.join(process.cwd(), "lib", "i18n", "translations")

const localeFiles = fs
  .readdirSync(TRANSLATIONS_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort()

function readLocale(file: string): Record<string, Record<string, string>> {
  return JSON.parse(fs.readFileSync(path.join(TRANSLATIONS_DIR, file), "utf8"))
}

const en = readLocale("en.json")

describe("common.buyCurrency / common.sellCurrency", () => {
  it("finds every locale file", () => {
    expect(localeFiles.length).toBeGreaterThanOrEqual(18)
    expect(localeFiles).toContain("en.json")
    expect(localeFiles).toContain("es.json")
  })

  it.each(localeFiles)("%s defines both keys with a {currency} placeholder", (file) => {
    const tree = readLocale(file)

    for (const key of ["buyCurrency", "sellCurrency"] as const) {
      const value = tree.common?.[key]

      expect(typeof value).toBe("string")
      expect(value.trim()).not.toBe("")
      expect(value).toContain("{currency}")
    }
  })

  it.each(localeFiles.filter((file) => file !== "en.json"))(
    "%s translates the labels instead of copying English",
    (file) => {
      const tree = readLocale(file)

      expect(tree.common.buyCurrency).not.toBe(en.common.buyCurrency)
      expect(tree.common.sellCurrency).not.toBe(en.common.sellCurrency)
    },
  )

  it("uses distinct wording for buy and sell in every locale", () => {
    for (const file of localeFiles) {
      const tree = readLocale(file)

      expect(tree.common.buyCurrency).not.toBe(tree.common.sellCurrency)
    }
  })

  it("keeps the English wording unchanged", () => {
    expect(en.common.buyCurrency).toBe("Buy {currency}")
    expect(en.common.sellCurrency).toBe("Sell {currency}")
  })
})
