import { mapAdError } from "@/lib/ads/ad-error-mapper"
import {
  AdErrorDestination,
  ORDER_LIMITS_STEP_INDEX,
  RATE_STEP_INDEX,
} from "@/lib/ads/ad-error-actions"

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}::${JSON.stringify(params)}` : key

const create = { mode: "create" as const }
const edit = { mode: "edit" as const }

describe("mapAdError", () => {
  // ─── Rate step (internal index 0: "Set type and price") ─────────────────────

  describe("rate errors", () => {
    it.each([
      "AdvertExchangeRateDuplicate",
      "RateTooSmall",
      "AdvertFloatRateMaximum",
      "AdvertFixedRateMaximum",
      "AdvertFixedRateMinimum",
      "InvalidExchangeRate",
    ])("sends %s to the rate step", (code) => {
      expect(mapAdError(code, t, create).primaryDestination).toBe(AdErrorDestination.RateStep)
      expect(mapAdError(code, t, edit).primaryDestination).toBe(AdErrorDestination.RateStep)
    })

    it("keeps the 'Update ad' CTA for AdvertExchangeRateDuplicate, matching mobile", () => {
      const result = mapAdError("AdvertExchangeRateDuplicate", t, create)
      expect(result.title).toBe("adForm.duplicateRateTitle")
      expect(result.message).toBe("adForm.duplicateRateMessage")
      expect(result.primaryCta).toBe("adForm.updateAd")
    })

    it.each([
      ["RateTooSmall", "adForm.rateTooSmallTitle", "adForm.rateTooSmallMessage"],
      ["AdvertFloatRateMaximum", "adForm.advertFloatRateMaximumTitle", "adForm.advertFloatRateMaximumMessage"],
      ["AdvertFixedRateMaximum", "adForm.advertFixedRateMaximumTitle", "adForm.advertFixedRateMaximumMessage"],
      ["AdvertFixedRateMinimum", "adForm.advertFixedRateMinimumTitle", "adForm.advertFixedRateMinimumMessage"],
      ["InvalidExchangeRate", "adForm.invalidValuesTitle", "adForm.invalidExchangeRateMessage"],
    ])("offers 'Update rate' for %s", (code, title, message) => {
      const result = mapAdError(code, t, create)
      expect(result.title).toBe(title)
      expect(result.message).toBe(message)
      expect(result.primaryCta).toBe("adForm.updateRate")
    })

    it("exports RATE_STEP_INDEX as the first wizard step", () => {
      expect(RATE_STEP_INDEX).toBe(0)
    })
  })

  // ─── Amount and payment step (internal index 1) ─────────────────────────────

  describe("amount and payment errors", () => {
    it.each([
      "AdvertOrderRangeOverlap",
      "AdvertTotalAmountExceeded",
      "InvalidOrderAmount",
      "InsufficientBalance",
    ])("sends %s to the amount-and-payment step", (code) => {
      expect(mapAdError(code, t, create).primaryDestination).toBe(
        AdErrorDestination.AmountAndPaymentStep,
      )
      expect(mapAdError(code, t, edit).primaryDestination).toBe(
        AdErrorDestination.AmountAndPaymentStep,
      )
    })

    it("exports ORDER_LIMITS_STEP_INDEX as the second wizard step", () => {
      expect(ORDER_LIMITS_STEP_INDEX).toBe(1)
    })

    it("labels AdvertOrderRangeOverlap 'Edit limits' and carries no baked-in secondary", () => {
      const result = mapAdError("AdvertOrderRangeOverlap", t, create)
      expect(result.title).toBe("adForm.rangeOverlapTitle")
      expect(result.message).toBe("adForm.rangeOverlapMessage")
      expect(result.primaryCta).toBe("adForm.editLimitsForRangeOverlap")
      // The "View active ad" secondary depends on resolving the conflicting advert,
      // which the pure mapper cannot do — the component adds it when it resolves.
      expect(result.secondaryDestination).toBeUndefined()
    })

    it.each([
      ["AdvertTotalAmountExceeded", "adForm.amountExceedsBalanceTitle", "adForm.amountExceedsBalanceMessage"],
      ["InvalidOrderAmount", "adForm.invalidValuesTitle", "adForm.invalidOrderAmountMessage"],
      ["InsufficientBalance", "adForm.insufficientBalanceTitle", "adForm.insufficientBalanceMessage"],
    ])("uses the 'Update ad' CTA for %s", (code, title, message) => {
      const result = mapAdError(code, t, create)
      expect(result.title).toBe(title)
      expect(result.message).toBe(message)
      expect(result.primaryCta).toBe("adForm.updateAd")
    })

    it("keeps AdvertPaymentMethodDuplicate inside the wizard rather than sending it to /profile", () => {
      const result = mapAdError("AdvertPaymentMethodDuplicate", t, create)
      expect(result.title).toBe("adForm.duplicatePaymentMethodTitle")
      expect(result.message).toBe("adForm.duplicatePaymentMethodMessage")
      expect(result.primaryCta).toBe("adForm.updatePaymentMethods")
      expect(result.primaryDestination).toBe(AdErrorDestination.AmountAndPaymentStep)
      expect(JSON.stringify(result)).not.toContain("/profile?tab=payment")
      expect(result.primaryDestination).not.toBe(AdErrorDestination.ViewProfile)
    })

    it("offers 'Add payment method' for AdvertPaymentMethodIDsRequired in create mode only", () => {
      const created = mapAdError("AdvertPaymentMethodIDsRequired", t, create)
      expect(created.title).toBe("adForm.paymentMethodIDsRequiredTitle")
      expect(created.message).toBe("adForm.paymentMethodIDsRequiredMessage")
      expect(created.primaryCta).toBe("adForm.addPaymentMethod")
      expect(created.primaryDestination).toBe(AdErrorDestination.AmountAndPaymentStep)

      // Edit mode deliberately falls through to the generic branch, so it picks up
      // that branch's mode-independent title.
      const edited = mapAdError("AdvertPaymentMethodIDsRequired", t, edit)
      expect(edited.title).toBe("adForm.adErrorGenericTitle")
      expect(edited.primaryCta).toBe("common.gotIt")
      expect(edited.primaryDestination).toBe(AdErrorDestination.Dismiss)
    })
  })

  // ─── Visibility (already on internal index 2) ───────────────────────────────

  describe("AdvertPrivateGroupNotAllowed", () => {
    it("stays on the visibility step it was raised from", () => {
      const result = mapAdError("AdvertPrivateGroupNotAllowed", t, edit)
      expect(result.primaryDestination).toBe(AdErrorDestination.Visibility)
      expect(result.primaryDestination).not.toBe(AdErrorDestination.RateStep)
      expect(result.title).toBe("adForm.privateGroupNotAllowedTitle")
      expect(result.message).toBe("adForm.privateGroupNotAllowedMessage")
      expect(result.primaryCta).toBe("adForm.updateAd")
    })
  })

  // ─── My Ads (leave the wizard) ──────────────────────────────────────────────

  describe("ad-count limits", () => {
    it.each(["AdvertActiveCountExceeded", "AdvertLimitReached"])(
      "sends %s to the My Ads list with 'Update ad' in both modes",
      (code) => {
        for (const ctx of [create, edit]) {
          const result = mapAdError(code, t, ctx)
          expect(result.primaryDestination).toBe(AdErrorDestination.MyAds)
          expect(result.primaryCta).toBe("adForm.updateAd")
        }
      },
    )

    // Mobile gives these two codes different copy. Web collapsed them onto the
    // ad-limit strings, which left AdvertActiveCountExceeded describing the wrong
    // limit and telling the user to delete an ad rather than close or edit one.
    it("gives AdvertActiveCountExceeded its own active-count copy", () => {
      for (const ctx of [create, edit]) {
        const result = mapAdError("AdvertActiveCountExceeded", t, ctx)
        expect(result.title).toBe("adForm.activeCountExceededTitle")
        expect(result.message).toBe("adForm.activeCountExceededMessage")
        expect(result.title).not.toBe("adForm.adLimitReachedTitle")
        expect(result.message).not.toBe("adForm.adLimitReachedMessage")
      }
    })

    it("keeps the ad-limit copy for AdvertLimitReached", () => {
      for (const ctx of [create, edit]) {
        const result = mapAdError("AdvertLimitReached", t, ctx)
        expect(result.title).toBe("adForm.adLimitReachedTitle")
        expect(result.message).toBe("adForm.adLimitReachedMessage")
      }
    })
  })

  // ─── Dismiss ────────────────────────────────────────────────────────────────

  describe("AdvertPaymentMethodRemoveOpenOrder", () => {
    it("dismisses without navigating or moving the wizard", () => {
      const result = mapAdError("AdvertPaymentMethodRemoveOpenOrder", t, edit)
      expect(result.title).toBe("adForm.paymentMethodRemoveOpenOrderTitle")
      expect(result.message).toBe("adForm.paymentMethodRemoveOpenOrderMessage")
      expect(result.primaryCta).toBe("common.gotIt")
      expect(result.primaryDestination).toBe(AdErrorDestination.Dismiss)
      expect(result.secondaryDestination).toBeUndefined()
    })
  })

  // ─── User-status errors ─────────────────────────────────────────────────────

  describe("user status errors", () => {
    it("offers live chat, never 'Update ad', for UserReadOnly", () => {
      const result = mapAdError("UserReadOnly", t, create)
      expect(result.title).toBe("common.readOnlyTitle")
      expect(result.message).toBe("common.readOnlyDescription")
      expect(result.primaryCta).toBe("common.readOnlyOpenChat")
      expect(result.primaryDestination).toBe(AdErrorDestination.LiveChat)
      expect(result.secondaryCta).toBe("common.readOnlyMaybeLater")
      expect(result.secondaryDestination).toBe(AdErrorDestination.Dismiss)
      expect(result.primaryCta).not.toBe("adForm.updateAd")
      expect(result.secondaryCta).not.toBe("adForm.updateAd")
    })

    // Scoped to adForm rather than the shared maintenance.* keys: those also drive
    // the site-wide maintenance banner and the orders mapper, and in ar.json they
    // hold an unrelated string with an unsubstituted {errorCode} placeholder.
    it("offers live chat, never 'Update ad', for P2PDisabled", () => {
      const result = mapAdError("P2PDisabled", t, edit)
      expect(result.title).toBe("adForm.p2pDisabledTitle")
      expect(result.message).toBe("adForm.p2pDisabledMessage")
      expect(result.primaryCta).toBe("order.openLiveChat")
      expect(result.primaryDestination).toBe(AdErrorDestination.LiveChat)
      expect(result.secondaryCta).toBe("order.maybeLater")
      expect(result.secondaryDestination).toBe(AdErrorDestination.Dismiss)
      expect(result.primaryCta).not.toBe("adForm.updateAd")
      expect(result.secondaryCta).not.toBe("adForm.updateAd")
    })

    it("no longer borrows the shared maintenance keys for P2PDisabled", () => {
      const result = mapAdError("P2PDisabled", t, create)
      expect(result.title).not.toBe("maintenance.errorTitle")
      expect(result.message).not.toBe("maintenance.errorMessage")
    })

    it("sends UserTempBan to the profile with a dismissing 'Close' secondary", () => {
      for (const ctx of [create, edit]) {
        const result = mapAdError("UserTempBan", t, ctx)
        expect(result.title).toBe("adForm.userTempBanTitle")
        expect(result.message).toBe("adForm.userTempBanMessage")
        expect(result.primaryCta).toBe("order.viewProfile")
        expect(result.primaryDestination).toBe(AdErrorDestination.ViewProfile)
        expect(result.secondaryCta).toBe("common.close")
        expect(result.secondaryDestination).toBe(AdErrorDestination.Dismiss)
      }
    })

    // The orders account-restricted strings are shared with
    // lib/orders/order-error-mapper.ts; the ad sheet must not reword the orders
    // flow by proxy, and mobile's ad sheet closes rather than offering "Maybe later".
    it("no longer borrows the orders account-restricted copy or 'Maybe later'", () => {
      const result = mapAdError("UserTempBan", t, create)
      expect(result.title).not.toBe("order.accountRestrictedTitle")
      expect(result.message).not.toBe("order.accountRestrictedMessage")
      expect(result.secondaryCta).not.toBe("order.maybeLater")
    })
  })

  // ─── Generic default ────────────────────────────────────────────────────────

  describe("generic default", () => {
    it.each<[string, string | undefined | null]>([
      ["an unrecognised code", "SomeBrandNewCode"],
      ["undefined", undefined],
      ["null", null],
      ["an empty string", ""],
    ])("dismisses without moving the wizard for %s", (_label, code) => {
      const result = mapAdError(code, t, create)
      expect(result.primaryCta).toBe("common.gotIt")
      expect(result.primaryDestination).toBe(AdErrorDestination.Dismiss)
      expect(result.primaryDestination).not.toBe(AdErrorDestination.RateStep)
      expect(result.secondaryDestination).toBeUndefined()
    })

    it("interpolates a usable code into the generic message", () => {
      const result = mapAdError("SomeBrandNewCode", t, create)
      expect(result.message).toBe(
        `adForm.adErrorGenericMessage::${JSON.stringify({ code: "SomeBrandNewCode" })}`,
      )
    })

    /**
     * Mobile renders `code ?? 'unknown'` through the same sentence rather than
     * switching to a second, code-free one. A missing code is exactly when the
     * reader most needs to be told there wasn't one.
     */
    it.each<[string, string | undefined | null]>([
      ["undefined", undefined],
      ["null", null],
      ["an empty string", ""],
    ])("renders the literal 'unknown' code for %s rather than a different sentence", (_label, code) => {
      expect(mapAdError(code, t, create).message).toBe(
        `adForm.adErrorGenericMessage::${JSON.stringify({ code: "unknown" })}`,
      )
    })

    it("uses one mode-independent title, as mobile does", () => {
      expect(mapAdError("SomeBrandNewCode", t, create).title).toBe("adForm.adErrorGenericTitle")
      expect(mapAdError("SomeBrandNewCode", t, edit).title).toBe("adForm.adErrorGenericTitle")
    })

    it("no longer resolves the mode-specific or code-free generic keys", () => {
      for (const ctx of [create, edit]) {
        for (const code of ["SomeBrandNewCode", undefined, null, ""]) {
          const serialized = JSON.stringify(mapAdError(code, t, ctx))

          expect(serialized).not.toContain("adForm.failedToCreateAd")
          expect(serialized).not.toContain("adForm.failedToUpdateAd")
          expect(serialized).not.toContain("adForm.genericErrorCodeMessage")
          expect(serialized).not.toContain("adForm.genericProcessingErrorMessage")
        }
      }
    })

    it("handles a malformed error entry that carries no code at all", () => {
      const malformed = { message: "boom" } as { code?: string; message: string }
      const result = mapAdError(malformed.code, t, edit)
      expect(result.title).toBe("adForm.adErrorGenericTitle")
      expect(result.message).toBe(
        `adForm.adErrorGenericMessage::${JSON.stringify({ code: "unknown" })}`,
      )
      expect(result.primaryCta).toBe("common.gotIt")
      expect(result.primaryDestination).toBe(AdErrorDestination.Dismiss)
    })
  })

  // ─── Whole-matrix guarantees ────────────────────────────────────────────────

  describe("matrix invariants", () => {
    it("never lands a non-rate error on the rate step", () => {
      const nonRateCodes = [
        "AdvertOrderRangeOverlap",
        "AdvertTotalAmountExceeded",
        "InvalidOrderAmount",
        "InsufficientBalance",
        "AdvertPaymentMethodDuplicate",
        "AdvertPaymentMethodIDsRequired",
        "AdvertPrivateGroupNotAllowed",
        "AdvertActiveCountExceeded",
        "AdvertLimitReached",
        "AdvertPaymentMethodRemoveOpenOrder",
        "UserReadOnly",
        "P2PDisabled",
        "UserTempBan",
        "SomeBrandNewCode",
      ]
      for (const code of nonRateCodes) {
        for (const ctx of [create, edit]) {
          expect(mapAdError(code, t, ctx).primaryDestination).not.toBe(AdErrorDestination.RateStep)
        }
      }
    })

    it("always returns a title, a message and a primary CTA", () => {
      for (const code of ["AdvertLimitReached", "UserReadOnly", undefined, "Nonsense"]) {
        const result = mapAdError(code, t, create)
        expect(result.title).toBeTruthy()
        expect(result.message).toBeTruthy()
        expect(result.primaryCta).toBeTruthy()
      }
    })
  })
})
