import { getPaymentMethodInUseRoute } from "@/lib/payment-methods/payment-method-error-routing"

describe("payment-method error routing", () => {
  it.each([
    ["PaymentMethodInUseByAdvert", "/ads"],
    ["PaymentMethodInUseByOrder", "/orders"],
  ])("routes %s to the corresponding management page", (errorCode, route) => {
    expect(getPaymentMethodInUseRoute(errorCode)).toBe(route)
  })

  it("does not navigate for errors that are handled in the current payment-method view", () => {
    expect(getPaymentMethodInUseRoute("PaymentMethodDuplicate")).toBeUndefined()
    expect(getPaymentMethodInUseRoute("PaymentMethodNotFound")).toBeUndefined()
  })
})
