import {
  createPaymentMethodAddErrorAlertConfig,
  isRecoverablePaymentMethodAddErrorCode,
} from "@/lib/payment-methods/create-payment-method-add-error-alert-config"
import type { PaymentSelectionEntry } from "@/lib/payment-methods/payment-method-selection-utils"

const t = (key: string) => key

function setup(entry: PaymentSelectionEntry = "catalogue", canOpenSelectionSheet = true) {
  const destinations = {
    stayOnForm: jest.fn(),
    openCatalogue: jest.fn(),
    openSelectionSheet: jest.fn(),
    resolveEntry: jest.fn<PaymentSelectionEntry, []>(() => entry),
    canOpenSelectionSheet,
  }

  const build = (errorCode: unknown, fieldValue?: string) =>
    createPaymentMethodAddErrorAlertConfig(t, { errorCode, fieldValue, destinations })

  return { destinations, build }
}

describe("createPaymentMethodAddErrorAlertConfig", () => {
  describe("PaymentMethodDuplicate", () => {
    it("keeps Cancel on the add form instead of reopening the saved-methods sheet", () => {
      const { destinations, build } = setup("catalogue")

      build("PaymentMethodDuplicate")!.onCancel!()

      expect(destinations.stayOnForm).toHaveBeenCalledTimes(1)
      expect(destinations.openSelectionSheet).not.toHaveBeenCalled()
      expect(destinations.openCatalogue).not.toHaveBeenCalled()
    })

    it("sends 'Manage payment methods' to the catalogue when nothing is eligible", () => {
      const { destinations, build } = setup("catalogue")

      build("PaymentMethodDuplicate")!.onConfirm!()

      expect(destinations.openCatalogue).toHaveBeenCalledTimes(1)
      expect(destinations.openSelectionSheet).not.toHaveBeenCalled()
    })

    it("still sends 'Manage payment methods' to the sheet when methods are eligible", () => {
      const { destinations, build } = setup("selection")

      build("PaymentMethodDuplicate")!.onConfirm!()

      expect(destinations.openSelectionSheet).toHaveBeenCalledTimes(1)
      expect(destinations.openCatalogue).not.toHaveBeenCalled()
    })

    it("treats an unresolved (still loading) list as not-yet-eligible", () => {
      const { destinations, build } = setup("loading")

      build("PaymentMethodDuplicate")!.onConfirm!()

      expect(destinations.openCatalogue).toHaveBeenCalledTimes(1)
      expect(destinations.openSelectionSheet).not.toHaveBeenCalled()
    })

    it("re-reads the entry at click time, not when the alert is built", () => {
      const { destinations, build } = setup("catalogue")
      const config = build("PaymentMethodDuplicate")!

      expect(destinations.resolveEntry).not.toHaveBeenCalled()

      destinations.resolveEntry.mockReturnValue("selection")
      config.onConfirm!()

      expect(destinations.openSelectionSheet).toHaveBeenCalledTimes(1)
    })
  })

  describe("PaymentMethodInvalidFieldValue", () => {
    it("keeps both 'Edit details' and Cancel on the add form", () => {
      const { destinations, build } = setup("selection")
      const config = build("PaymentMethodInvalidFieldValue", "1234")!

      config.onConfirm!()
      config.onCancel!()

      expect(destinations.stayOnForm).toHaveBeenCalledTimes(2)
      expect(destinations.openSelectionSheet).not.toHaveBeenCalled()
      expect(destinations.openCatalogue).not.toHaveBeenCalled()
    })
  })

  describe("PaymentMethodNotFound", () => {
    it("sends the primary 'Add payment method' CTA to the catalogue", () => {
      const { destinations, build } = setup("selection")

      build("PaymentMethodNotFound")!.onConfirm!()

      expect(destinations.openCatalogue).toHaveBeenCalledTimes(1)
      expect(destinations.openSelectionSheet).not.toHaveBeenCalled()
    })

    it("keeps Cancel on the add form", () => {
      const { destinations, build } = setup("catalogue")

      build("PaymentMethodNotFound")!.onCancel!()

      expect(destinations.stayOnForm).toHaveBeenCalledTimes(1)
      expect(destinations.openSelectionSheet).not.toHaveBeenCalled()
      expect(destinations.openCatalogue).not.toHaveBeenCalled()
    })
  })

  // The X control must be indistinguishable from that alert's own Cancel.
  describe.each([
    "PaymentMethodDuplicate",
    "PaymentMethodInvalidFieldValue",
    "PaymentMethodNotFound",
  ])("%s dismiss control", (errorCode) => {
    it("routes onClose exactly like onCancel", () => {
      const { destinations, build } = setup("catalogue")
      const config = build(errorCode)!

      config.onClose!()

      expect(destinations.stayOnForm).toHaveBeenCalledTimes(1)
      expect(destinations.openSelectionSheet).not.toHaveBeenCalled()
      expect(destinations.openCatalogue).not.toHaveBeenCalled()
    })
  })

  // A buy advert has no sell saved-methods sheet; no recovery path may reach it.
  describe("buy-advert guard (canOpenSelectionSheet: false)", () => {
    it("keeps 'Manage payment methods' on the catalogue even when methods are eligible", () => {
      const { destinations, build } = setup("selection", false)

      build("PaymentMethodDuplicate")!.onConfirm!()

      expect(destinations.openCatalogue).toHaveBeenCalledTimes(1)
      expect(destinations.openSelectionSheet).not.toHaveBeenCalled()
    })

    it.each([
      "PaymentMethodDuplicate",
      "PaymentMethodInvalidFieldValue",
      "PaymentMethodNotFound",
    ])("never opens the sell sheet from any %s action", (errorCode) => {
      const { destinations, build } = setup("selection", false)
      const config = build(errorCode)!

      config.onConfirm?.()
      config.onCancel?.()
      config.onClose?.()

      expect(destinations.openSelectionSheet).not.toHaveBeenCalled()
    })
  })

  describe("non-recoverable codes", () => {
    it.each([
      "PaymentMethodInvalid",
      "PaymentMethodInvalidField",
      "PaymentMethodRequiredField",
      undefined,
      "SomethingElse",
    ])("returns null for %s so the caller keeps its OK-only alert", (errorCode) => {
      const { build } = setup()

      expect(build(errorCode)).toBeNull()
    })
  })

  describe("isRecoverablePaymentMethodAddErrorCode", () => {
    it("accepts only the three codes that offer a destination", () => {
      expect(isRecoverablePaymentMethodAddErrorCode("PaymentMethodDuplicate")).toBe(true)
      expect(isRecoverablePaymentMethodAddErrorCode("PaymentMethodInvalidFieldValue")).toBe(true)
      expect(isRecoverablePaymentMethodAddErrorCode("PaymentMethodNotFound")).toBe(true)
      expect(isRecoverablePaymentMethodAddErrorCode("PaymentMethodInvalid")).toBe(false)
      expect(isRecoverablePaymentMethodAddErrorCode(undefined)).toBe(false)
    })
  })

  describe("alert copy", () => {
    it("does not change the existing keys or CTA labels", () => {
      const { build } = setup()

      expect(build("PaymentMethodDuplicate")).toMatchObject({
        title: "paymentMethod.duplicateMethod",
        confirmText: "paymentMethod.duplicateMethodPrimaryCta",
        cancelText: "common.cancel",
      })
      expect(build("PaymentMethodNotFound")).toMatchObject({
        title: "paymentMethod.notFound",
        description: "paymentMethod.notFoundDescription",
        confirmText: "paymentMethod.addPaymentMethod",
        cancelText: "common.cancel",
        type: "warning",
      })
    })
  })
})
