import { AdErrorDestination, type AdErrorMessage } from "./ad-error-actions"

type Translator = (key: string, params?: Record<string, string | number>) => string

export interface AdErrorMapCtx {
  /**
   * Needed for the create-only payment-method case. Note this is the wizard's mode,
   * not the mutation verb: an edit submit is "edit".
   */
  mode: "create" | "edit"
}

/**
 * Maps an advert submit-failure code to its title, copy, CTA labels and recovery
 * destination. Pure — no React, no router, no `window` — so the whole destination
 * matrix is assertable without rendering the wizard.
 *
 * Follows the lib/orders/order-error-mapper.ts shape already used for orders, and
 * mirrors mobile's AdErrorSheet so create and edit recover the same way on both
 * platforms.
 *
 * The default branch is the point of the module: an unrecognised code dismisses
 * rather than silently inheriting "Update ad" and a jump to the first step.
 */
export function mapAdError(
  code: string | undefined | null,
  t: Translator,
  ctx: AdErrorMapCtx,
): AdErrorMessage {
  switch (code) {
    // ─── Rate step ────────────────────────────────────────────────────────────

    case "AdvertExchangeRateDuplicate":
      return {
        title: t("adForm.duplicateRateTitle"),
        message: t("adForm.duplicateRateMessage"),
        // Mobile keeps "Update ad" here rather than "Update rate".
        primaryCta: t("adForm.updateAd"),
        primaryDestination: AdErrorDestination.RateStep,
        tone: "warning",
      }

    case "RateTooSmall":
      return {
        title: t("adForm.rateTooSmallTitle"),
        message: t("adForm.rateTooSmallMessage"),
        primaryCta: t("adForm.updateRate"),
        primaryDestination: AdErrorDestination.RateStep,
        tone: "error",
      }

    case "AdvertFloatRateMaximum":
      return {
        title: t("adForm.advertFloatRateMaximumTitle"),
        message: t("adForm.advertFloatRateMaximumMessage"),
        primaryCta: t("adForm.updateRate"),
        primaryDestination: AdErrorDestination.RateStep,
        tone: "error",
      }

    case "AdvertFixedRateMaximum":
      return {
        title: t("adForm.advertFixedRateMaximumTitle"),
        message: t("adForm.advertFixedRateMaximumMessage"),
        primaryCta: t("adForm.updateRate"),
        primaryDestination: AdErrorDestination.RateStep,
        tone: "error",
      }

    case "AdvertFixedRateMinimum":
      return {
        title: t("adForm.advertFixedRateMinimumTitle"),
        message: t("adForm.advertFixedRateMinimumMessage"),
        primaryCta: t("adForm.updateRate"),
        primaryDestination: AdErrorDestination.RateStep,
        tone: "error",
      }

    case "InvalidExchangeRate":
      return {
        title: t("adForm.invalidValuesTitle"),
        message: t("adForm.invalidExchangeRateMessage"),
        primaryCta: t("adForm.updateRate"),
        primaryDestination: AdErrorDestination.RateStep,
        tone: "error",
      }

    // ─── Amount and payment step ──────────────────────────────────────────────

    case "AdvertOrderRangeOverlap":
      // No secondary here: "View active ad" depends on resolving the conflicting
      // advert over the network, which this pure mapper cannot do. The caller adds
      // it when the lookup succeeds.
      return {
        title: t("adForm.rangeOverlapTitle"),
        message: t("adForm.rangeOverlapMessage"),
        primaryCta: t("adForm.editLimitsForRangeOverlap"),
        primaryDestination: AdErrorDestination.AmountAndPaymentStep,
        tone: "warning",
      }

    case "AdvertTotalAmountExceeded":
      return {
        title: t("adForm.amountExceedsBalanceTitle"),
        message: t("adForm.amountExceedsBalanceMessage"),
        primaryCta: t("adForm.updateAd"),
        primaryDestination: AdErrorDestination.AmountAndPaymentStep,
        tone: "error",
      }

    case "InvalidOrderAmount":
      return {
        title: t("adForm.invalidValuesTitle"),
        message: t("adForm.invalidOrderAmountMessage"),
        primaryCta: t("adForm.updateAd"),
        primaryDestination: AdErrorDestination.AmountAndPaymentStep,
        tone: "error",
      }

    case "InsufficientBalance":
      return {
        title: t("adForm.insufficientBalanceTitle"),
        message: t("adForm.insufficientBalanceMessage"),
        primaryCta: t("adForm.updateAd"),
        primaryDestination: AdErrorDestination.AmountAndPaymentStep,
        tone: "error",
      }

    case "AdvertPaymentMethodDuplicate":
      // Back to the wizard's payment step, not /profile?tab=payment — the duplicate
      // is in this ad's selection, and mobile fixes it in place.
      return {
        title: t("adForm.duplicatePaymentMethodTitle"),
        message: t("adForm.duplicatePaymentMethodMessage"),
        primaryCta: t("adForm.updatePaymentMethods"),
        primaryDestination: AdErrorDestination.AmountAndPaymentStep,
        tone: "error",
      }

    case "AdvertPaymentMethodIDsRequired":
      // Only create mode can act on this; edit falls through to the generic dismiss,
      // which is what it does today.
      if (ctx.mode === "create") {
        return {
          title: t("adForm.paymentMethodIDsRequiredTitle"),
          message: t("adForm.paymentMethodIDsRequiredMessage"),
          primaryCta: t("adForm.addPaymentMethod"),
          primaryDestination: AdErrorDestination.AmountAndPaymentStep,
          tone: "error",
        }
      }
      break

    // ─── Visibility ───────────────────────────────────────────────────────────

    case "AdvertPrivateGroupNotAllowed":
      // The visibility control is on the step the user is already on, so this must
      // not move the wizard — least of all to the first step, which is what the old
      // implicit fallback did.
      return {
        title: t("adForm.privateGroupNotAllowedTitle"),
        message: t("adForm.privateGroupNotAllowedMessage"),
        primaryCta: t("adForm.updateAd"),
        primaryDestination: AdErrorDestination.Visibility,
        tone: "error",
      }

    // ─── My Ads ───────────────────────────────────────────────────────────────

    case "AdvertActiveCountExceeded":
      // Distinct from AdvertLimitReached: mobile words this one around the active-ad
      // count and tells the user to close or edit, not to delete. Web used to collapse
      // both codes onto the ad-limit copy, which described the wrong limit.
      return {
        title: t("adForm.activeCountExceededTitle"),
        message: t("adForm.activeCountExceededMessage"),
        primaryCta: t("adForm.updateAd"),
        primaryDestination: AdErrorDestination.MyAds,
        tone: "error",
      }

    case "AdvertLimitReached":
      // "Update ad" as the label for a My Ads navigation is what mobile ships; kept
      // for parity rather than inventing new copy.
      return {
        title: t("adForm.adLimitReachedTitle"),
        message: t("adForm.adLimitReachedMessage"),
        primaryCta: t("adForm.updateAd"),
        primaryDestination: AdErrorDestination.MyAds,
        tone: "error",
      }

    // ─── Dismiss ──────────────────────────────────────────────────────────────

    case "AdvertPaymentMethodRemoveOpenOrder":
      return {
        title: t("adForm.paymentMethodRemoveOpenOrderTitle"),
        message: t("adForm.paymentMethodRemoveOpenOrderMessage"),
        primaryCta: t("common.gotIt"),
        primaryDestination: AdErrorDestination.Dismiss,
        tone: "error",
      }

    // ─── User status ──────────────────────────────────────────────────────────

    case "UserReadOnly":
      return {
        title: t("common.readOnlyTitle"),
        message: t("common.readOnlyDescription"),
        primaryCta: t("common.readOnlyOpenChat"),
        primaryDestination: AdErrorDestination.LiveChat,
        secondaryCta: t("common.readOnlyMaybeLater"),
        secondaryDestination: AdErrorDestination.Dismiss,
        tone: "error",
      }

    case "P2PDisabled":
      // Scoped to adForm rather than the shared maintenance.* keys. Those also drive
      // the site-wide maintenance banner and the orders mapper, and ar.json holds an
      // unrelated string there carrying an {errorCode} placeholder that neither call
      // site substitutes — Arabic users saw the raw placeholder in this sheet.
      //
      // Neither destination changes a step or pushes a route, so this stays
      // deterministic whether or not the maintenance guard redirects the wizard away.
      return {
        title: t("adForm.p2pDisabledTitle"),
        message: t("adForm.p2pDisabledMessage"),
        primaryCta: t("order.openLiveChat"),
        primaryDestination: AdErrorDestination.LiveChat,
        secondaryCta: t("order.maybeLater"),
        secondaryDestination: AdErrorDestination.Dismiss,
        tone: "error",
      }

    case "UserTempBan":
      // Ad-form-scoped copy: order.accountRestricted* is shared with
      // lib/orders/order-error-mapper.ts, so rewording it here would silently change
      // the orders flow. Mobile's ad sheet also closes rather than "Maybe later".
      return {
        title: t("adForm.userTempBanTitle"),
        message: t("adForm.userTempBanMessage"),
        primaryCta: t("order.viewProfile"),
        primaryDestination: AdErrorDestination.ViewProfile,
        secondaryCta: t("common.close"),
        secondaryDestination: AdErrorDestination.Dismiss,
        tone: "error",
      }
  }

  // Unknown codes, missing codes and malformed payloads: say so and get out of the
  // way. Crucially this does NOT move the wizard — the user keeps the step they were
  // on, with everything they typed.
  //
  // One title for both modes, and one sentence whether or not a code arrived —
  // mobile's `default:` branch renders `code ?? 'unknown'` through the same string
  // rather than switching to a code-free variant. Scoped adForm.adErrorGeneric*
  // keys rather than the older adForm.failedTo*/generic* ones, which stay put
  // because they are general-purpose wizard copy.
  return {
    title: t("adForm.adErrorGenericTitle"),
    message: t("adForm.adErrorGenericMessage", { code: code || "unknown" }),
    primaryCta: t("common.gotIt"),
    primaryDestination: AdErrorDestination.Dismiss,
    tone: "error",
  }
}
