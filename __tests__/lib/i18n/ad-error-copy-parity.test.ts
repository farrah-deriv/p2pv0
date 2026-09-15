import fs from "fs"
import path from "path"

/**
 * The create/edit ad submit-failure sheet is under a strict word-for-word parity
 * rule with the mobile app: web shows exactly what mobile shows, even where the
 * web phrasing would read better. Four copy families drifted.
 *
 * The mapper unit test stubs `t` to echo its key, so it is structurally blind to
 * copy — it can prove `RateTooSmall` resolves `adForm.rateTooSmallTitle`, but not
 * what that key says. This suite covers the other half: the actual English values,
 * and that every locale carries a genuinely translated string rather than a raw
 * key or an English fallback.
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

/** Every adForm key the ad-error sheet resolves that this change adds or rewords. */
const AD_ERROR_KEYS = [
  "rateTooSmallTitle",
  "rateTooSmallMessage",
  "activeCountExceededTitle",
  "activeCountExceededMessage",
  "userTempBanTitle",
  "userTempBanMessage",
  "p2pDisabledTitle",
  "p2pDisabledMessage",
  "adErrorGenericTitle",
  "adErrorGenericMessage",
] as const

describe("ad-error sheet copy parity with mobile", () => {
  it("finds all 18 locale files", () => {
    expect(localeFiles).toHaveLength(18)
    expect(localeFiles).toContain("en.json")
    expect(localeFiles).toContain("zh_TW.json")
  })

  describe("English values are mobile's, verbatim", () => {
    it("RateTooSmall uses mobile's generic title and exchange-rate wording", () => {
      expect(en.adForm.rateTooSmallTitle).toBe("Something went wrong")
      expect(en.adForm.rateTooSmallMessage).toBe(
        "The exchange rate you have set is too low. Please enter a different rate for your ad.",
      )
    })

    it("AdvertActiveCountExceeded gets its own copy, distinct from the ad-limit copy", () => {
      expect(en.adForm.activeCountExceededTitle).toBe("Active ads limit reached")
      expect(en.adForm.activeCountExceededMessage).toBe(
        "You already have the maximum number of active ads. Close or edit an existing ad before creating another one.",
      )

      expect(en.adForm.activeCountExceededTitle).not.toBe(en.adForm.adLimitReachedTitle)
      expect(en.adForm.activeCountExceededMessage).not.toBe(en.adForm.adLimitReachedMessage)
    })

    it("UserTempBan uses mobile's temp-ban copy, not the orders account-restricted copy", () => {
      expect(en.adForm.userTempBanTitle).toBe("Account temporarily restricted")
      expect(en.adForm.userTempBanMessage).toBe("Check your profile for details.")

      expect(en.adForm.userTempBanTitle).not.toBe(en.order.accountRestrictedTitle)
      expect(en.adForm.userTempBanMessage).not.toBe(en.order.accountRestrictedMessage)
    })

    it("P2PDisabled uses mobile's maintenance copy", () => {
      expect(en.adForm.p2pDisabledTitle).toBe("System maintenance in progress")
      expect(en.adForm.p2pDisabledMessage).toBe(
        "Deriv P2P is temporarily unavailable. For urgent queries, contact us via live chat.",
      )
    })

    it("the unrecognised-code branch uses mobile's generic title and error-code wording", () => {
      expect(en.adForm.adErrorGenericTitle).toBe("Something went wrong")
      expect(en.adForm.adErrorGenericMessage).toBe(
        "Error code: {code}. Please try again later or contact support.",
      )
    })

    it("keeps the {code} placeholder in every locale's generic message", () => {
      for (const file of localeFiles) {
        expect(readLocale(file).adForm.adErrorGenericMessage).toContain("{code}")
      }
    })

    /**
     * Mobile shows one title regardless of create vs edit, so the new key must not
     * be an alias of either mode-specific string. Those four keys keep their values
     * — the mapper simply stops resolving them.
     */
    it("does not reuse or reword the mode-specific and code-free generic keys", () => {
      expect(en.adForm.adErrorGenericTitle).not.toBe(en.adForm.failedToCreateAd)
      expect(en.adForm.adErrorGenericTitle).not.toBe(en.adForm.failedToUpdateAd)

      expect(en.adForm.failedToCreateAd).toBe("Failed to create ad")
      expect(en.adForm.failedToUpdateAd).toBe("Failed to update ad")
      expect(en.adForm.genericErrorCodeMessage).toBe(
        "An error occurred ({code}). Please try again or contact support.",
      )
      expect(en.adForm.genericProcessingErrorMessage).toBe(
        "There was an error processing your request. Please try again.",
      )
    })

    it("drops the invented rate wording entirely", () => {
      const raw = fs.readFileSync(path.join(TRANSLATIONS_DIR, "en.json"), "utf8")

      expect(raw).not.toContain("Check your rate")
      expect(raw).not.toContain("The rate you entered is too small")
    })
  })

  describe("locale coverage", () => {
    it.each(localeFiles)("%s defines every ad-error key with a non-empty string", (file) => {
      const tree = readLocale(file)

      for (const key of AD_ERROR_KEYS) {
        const value = tree.adForm?.[key]

        expect(typeof value).toBe("string")
        expect(value.trim()).not.toBe("")
      }
    })

    it.each(localeFiles.filter((file) => file !== "en.json"))(
      "%s translates every ad-error key instead of falling back to English",
      (file) => {
        const tree = readLocale(file)

        for (const key of AD_ERROR_KEYS) {
          expect(tree.adForm[key]).not.toBe(en.adForm[key])
        }
      },
    )

    it.each(localeFiles)("%s reuses a localized common.close for the temp-ban secondary", (file) => {
      const tree = readLocale(file)

      expect(typeof tree.common?.close).toBe("string")
      expect(tree.common.close.trim()).not.toBe("")

      if (file !== "en.json") {
        expect(tree.common.close).not.toBe(en.common.close)
      }
    })
  })

  describe("shared keys the ad sheet no longer borrows stay untouched", () => {
    it("leaves the orders account-restricted copy alone", () => {
      expect(en.order.accountRestrictedTitle).toBe("Account restricted")
      expect(en.order.accountRestrictedMessage).toBe(
        "Your account has been temporarily restricted. View your profile for more details.",
      )
    })

    it("leaves the site-wide maintenance copy alone", () => {
      expect(en.maintenance.errorTitle).toBe("System maintenance in progress")
      expect(en.maintenance.errorMessage).toBe(
        "Deriv P2P is temporarily unavailable. For urgent queries, contact us via live chat.",
      )
    })

    it("keeps AdvertLimitReached's own copy as mobile has it", () => {
      expect(en.adForm.adLimitReachedTitle).toBe("Ad limit reached")
    })

    /**
     * ar.json is why P2PDisabled needed scoped keys rather than a shrug: 17 locales
     * already carry mobile's maintenance wording, but Arabic carries an unrelated
     * generic error string with an {errorCode} placeholder. Both mapper call sites
     * invoke t("maintenance.errorMessage") with no params, so an Arabic user hitting
     * P2PDisabled was shown a literal, unsubstituted placeholder.
     */
    it("no longer routes the ad sheet through ar.json's placeholder-bearing maintenance string", () => {
      const ar = readLocale("ar.json")

      expect(ar.maintenance.errorMessage).toContain("{errorCode}")
      expect(ar.adForm.p2pDisabledMessage).not.toContain("{errorCode}")
    })
  })
})
