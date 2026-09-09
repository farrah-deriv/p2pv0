import fs from "fs"
import path from "path"
import { createGenericMutationErrorAlertConfig, getApiErrorCode } from "@/lib/errors/create-generic-mutation-alert-config"

const TRANSLATIONS_DIR = path.join(process.cwd(), "lib", "i18n", "translations")

const LIST_ERROR_KEYS = [
  "loadFailedDescription",
  "retry",
  "loadAdsFailedTitle",
  "loadOrdersFailedTitle",
  "loadOrderDetailsFailedTitle",
  "loadMyAdsFailedTitle",
  "loadAdvertiserFailedTitle",
  "loadPaymentMethodsFailedTitle",
  "loadCounterpartiesFailedTitle",
  "loadBlockedAdvertisersFailedTitle",
  "loadFollowersFailedTitle",
  "loadFollowingFailedTitle",
  "loadTransactionsFailedTitle",
  "loadWalletsFailedTitle",
]

const locales = fs
  .readdirSync(TRANSLATIONS_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => file.replace(/\.json$/, ""))

const read = (locale: string) =>
  JSON.parse(fs.readFileSync(path.join(TRANSLATIONS_DIR, `${locale}.json`), "utf-8"))

describe("list error-state copy", () => {
  it("has at least the full locale set", () => {
    expect(locales).toContain("en")
    expect(locales.length).toBeGreaterThanOrEqual(18)
  })

  it.each(locales)("%s defines every list error key with non-empty copy", (locale) => {
    const errors = read(locale).errors
    for (const key of LIST_ERROR_KEYS) {
      expect(typeof errors?.[key]).toBe("string")
      expect(errors[key].trim().length).toBeGreaterThan(0)
    }
  })

  it.each(locales.filter((l) => l !== "en"))("%s does not leave the shared body untranslated", (locale) => {
    // Copying the English value into every locale is not a translation.
    expect(read(locale).errors.loadFailedDescription).not.toBe(read("en").errors.loadFailedDescription)
  })
})

describe("createGenericMutationErrorAlertConfig", () => {
  const t = (key: string, params?: Record<string, string | number>) =>
    params ? `${key}:${JSON.stringify(params)}` : key

  it("reuses the existing default alert copy and CTA", () => {
    const config = createGenericMutationErrorAlertConfig(t)

    expect(config.title).toBe("common.somethingWentWrong")
    expect(config.confirmText).toBe("common.gotIt")
    expect(config.type).toBe("warning")
  })

  it("falls back to 'unknown' when the failure carries no backend code", () => {
    expect(createGenericMutationErrorAlertConfig(t).description).toContain("unknown")
  })

  it("surfaces the backend error code when there is one", () => {
    const error = { errors: [{ code: "SomeBackendCode" }] }

    expect(getApiErrorCode(error)).toBe("SomeBackendCode")
    expect(createGenericMutationErrorAlertConfig(t, { errorCode: getApiErrorCode(error) }).description).toContain(
      "SomeBackendCode",
    )
  })

  it("never leaks a raw exception message into the dialog", () => {
    const error = new Error("Error fetching advertisements: ")

    expect(getApiErrorCode(error)).toBeUndefined()
    expect(createGenericMutationErrorAlertConfig(t, { errorCode: getApiErrorCode(error) }).description).not.toContain(
      "Error fetching advertisements",
    )
  })
})
