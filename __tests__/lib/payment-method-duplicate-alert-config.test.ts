import { createPaymentMethodDuplicateAlertConfig } from "@/lib/payment-methods/create-payment-method-duplicate-alert-config"

const t = (key: string) => key

describe("createPaymentMethodDuplicateAlertConfig", () => {
  it("uses the cancellation cleanup when the error sheet is dismissed", () => {
    const onCancel = jest.fn()
    const config = createPaymentMethodDuplicateAlertConfig(t, {
      onManage: jest.fn(),
      onCancel,
    })

    expect(config.onCancel).toBe(onCancel)
    expect(config.onClose).toBe(onCancel)
  })

  it("runs the caller's recovery flow when the dialog is closed", () => {
    const returnToPaymentMethodSelection = jest.fn()
    const config = createPaymentMethodDuplicateAlertConfig(t, {
      onManage: jest.fn(),
      onCancel: returnToPaymentMethodSelection,
    })

    config.onClose?.()

    expect(returnToPaymentMethodSelection).toHaveBeenCalledTimes(1)
  })
})
