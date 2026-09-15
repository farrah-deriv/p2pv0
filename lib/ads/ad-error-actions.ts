/**
 * Where an advert submit failure should send the user.
 *
 * Mirrors mobile's `AdErrorSheet.destinationForErrorCode`
 * (regentmarkets/ai-deriv-p2p-app, lib/features/my_ads/presentation/widgets/ad_error_sheet.dart),
 * which is the behavioural source of truth for this flow.
 */
export enum AdErrorDestination {
  /** Wizard step "Set type and price" — the rate inputs. */
  RateStep = "rateStep",
  /** Wizard step "Set amount and payment" — total amount, order limits, payment methods. */
  AmountAndPaymentStep = "amountAndPaymentStep",
  /**
   * Wizard step "Set ad conditions", where visibility is configured. The user is already
   * standing there when these errors are raised, so this destination changes no step —
   * it exists so the mapping says "stay put" explicitly rather than by omission.
   */
  Visibility = "visibility",
  /** Leave the wizard for the My Ads list. */
  MyAds = "myAds",
  /** Open the Intercom messenger. */
  LiveChat = "liveChat",
  /** Navigate to the user's profile. */
  ViewProfile = "viewProfile",
  /** Close the sheet and do nothing else. */
  Dismiss = "dismiss",
}

export interface AdErrorMessage {
  title: string
  message: string
  primaryCta: string
  primaryDestination: AdErrorDestination
  secondaryCta?: string
  secondaryDestination?: AdErrorDestination
  /**
   * Alert-dialog `type`. Always set, so the provider renders the CTA row (it only does
   * so when `type` or `cancelText` is present).
   */
  tone?: "error" | "warning"
}

/** Wizard step "Set type and price" — where the fixed/floating rate inputs live. */
export const RATE_STEP_INDEX = 0

/** Wizard step "Set amount and payment" — where the min/max order limit inputs live. */
export const ORDER_LIMITS_STEP_INDEX = 1
