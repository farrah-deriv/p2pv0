import type { AlertDialogConfig } from "@/types/alert-dialog"
import { createPaymentMethodDuplicateAlertConfig } from "./create-payment-method-duplicate-alert-config"
import { createPaymentMethodInvalidFieldValueAlertConfig } from "./create-payment-method-invalid-field-value-alert-config"
import type { PaymentSelectionEntry } from "./payment-method-selection-utils"

type Translate = (key: string, params?: Record<string, string | number>) => string

/**
 * Where a recoverable "add payment method" error can send the user. Mirrors
 * mobile's PaymentMethodErrorPresenter.
 */
export interface PaymentMethodAddErrorDestinations {
  /**
   * Dismiss the alert and nothing else. AddPaymentMethodPanel stays mounted, so
   * the values the user typed survive — mobile `_dismissErrorForRetry`.
   */
  stayOnForm: () => void
  /** Reopen AddPaymentMethodPanel at its catalogue (method list) step. */
  openCatalogue: () => void
  /** Open the real saved-methods selection sheet. */
  openSelectionSheet: () => void
  /**
   * Re-read at click time rather than when the alert is built, so a refetch
   * that lands while the alert is on screen is taken into account.
   */
  resolveEntry: () => PaymentSelectionEntry
  /**
   * False for flows that have no saved-methods sheet at all — a buy advert
   * picks payment method *types* in FullPagePaymentSelection, so no recovery
   * path may drop it on the sell sheet. Defaults to true.
   */
  canOpenSelectionSheet?: boolean
}

/** Recoverable add errors, i.e. the ones whose alert offers somewhere to go. */
export const RECOVERABLE_PAYMENT_METHOD_ADD_ERROR_CODES = [
  "PaymentMethodDuplicate",
  "PaymentMethodInvalidFieldValue",
  "PaymentMethodNotFound",
] as const

export type RecoverablePaymentMethodAddErrorCode =
  (typeof RECOVERABLE_PAYMENT_METHOD_ADD_ERROR_CODES)[number]

export function isRecoverablePaymentMethodAddErrorCode(
  code: unknown,
): code is RecoverablePaymentMethodAddErrorCode {
  return (
    typeof code === "string" &&
    (RECOVERABLE_PAYMENT_METHOD_ADD_ERROR_CODES as readonly string[]).includes(code)
  )
}

/**
 * Build the alert for a recoverable add-payment-method failure.
 *
 * The rule this exists to enforce (issue #1387): no dismissal of an add error
 * may open the saved-methods sheet when nothing is eligible, because that sheet
 * then contains only an "Add payment method" row and a disabled Confirm — the
 * exact sheet `resolvePaymentSelectionEntry` skips on first open. Before this
 * helper, every CTA on all three alerts routed straight back to that sheet.
 *
 * Returns `null` for codes that are not recoverable; callers keep their own
 * OK-only alerts for those.
 */
export function createPaymentMethodAddErrorAlertConfig(
  t: Translate,
  {
    errorCode,
    fieldValue,
    destinations,
  }: {
    errorCode: unknown
    /** Account value echoed back in the InvalidFieldValue copy. */
    fieldValue?: string
    destinations: PaymentMethodAddErrorDestinations
  },
): AlertDialogConfig | null {
  const {
    stayOnForm,
    openCatalogue,
    openSelectionSheet,
    resolveEntry,
    canOpenSelectionSheet = true,
  } = destinations

  if (errorCode === "PaymentMethodDuplicate") {
    return createPaymentMethodDuplicateAlertConfig(t, {
      // "Manage payment methods" — only meaningful when there is something to
      // manage, so re-run the entry resolver. "loading" is treated as
      // not-yet-eligible: the catalogue is always a safe place to land, the
      // empty sheet never is.
      onManage: () => {
        if (canOpenSelectionSheet && resolveEntry() === "selection") {
          openSelectionSheet()
          return
        }
        openCatalogue()
      },
      onCancel: stayOnForm,
    })
  }

  if (errorCode === "PaymentMethodInvalidFieldValue") {
    return createPaymentMethodInvalidFieldValueAlertConfig(t, {
      fieldValue: fieldValue ?? "",
      onEdit: stayOnForm,
      onCancel: stayOnForm,
    })
  }

  if (errorCode === "PaymentMethodNotFound") {
    return {
      title: t("paymentMethod.notFound"),
      description: t("paymentMethod.notFoundDescription"),
      confirmText: t("paymentMethod.addPaymentMethod"),
      cancelText: t("common.cancel"),
      type: "warning",
      // The CTA says "Add payment method", so it goes to the catalogue —
      // unconditionally, never to the saved-methods sheet.
      onConfirm: openCatalogue,
      onCancel: stayOnForm,
      onClose: stayOnForm,
    }
  }

  return null
}
