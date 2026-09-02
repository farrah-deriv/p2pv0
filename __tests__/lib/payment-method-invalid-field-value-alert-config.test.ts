import { createPaymentMethodInvalidFieldValueAlertConfig } from "@/lib/payment-methods/create-payment-method-invalid-field-value-alert-config"
import { resolvePaymentMethodAccountFieldValue } from "@/lib/payment-methods/resolve-payment-method-account-field-value"

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}::${JSON.stringify(params)}` : key

describe("resolvePaymentMethodAccountFieldValue", () => {
  it("returns trimmed account field", () => {
    expect(resolvePaymentMethodAccountFieldValue({ account: " 12345 " }, t)).toBe("12345")
  })

  it("falls back when account is empty", () => {
    expect(resolvePaymentMethodAccountFieldValue({}, t)).toBe("paymentMethod.fieldFallback")
  })
})

describe("createPaymentMethodInvalidFieldValueAlertConfig", () => {
  it("builds dual-CTA alert with field value interpolation", () => {
    const onCancel = jest.fn()
    const config = createPaymentMethodInvalidFieldValueAlertConfig(t, {
      fieldValue: "12345",
      onEdit: () => {},
      onCancel,
    })

    expect(config.title).toBe('paymentMethod.invalidFieldValueTitle::{"fieldValue":"12345"}')
    expect(config.description).toBe('paymentMethod.invalidFieldValueDescription::{"fieldValue":"12345"}')
    expect(config.confirmText).toBe("paymentMethod.editDetails")
    expect(config.cancelText).toBe("common.cancel")
    expect(config.type).toBe("warning")
    expect(config.onClose).toBe(onCancel)
  })
})
