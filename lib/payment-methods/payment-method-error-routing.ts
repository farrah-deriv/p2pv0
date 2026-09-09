export type PaymentMethodInUseRoute = "/ads" | "/orders"

/**
 * Keeps the profile payment-method update and delete flows aligned when the
 * API reports that a method is still being used elsewhere.
 */
export function getPaymentMethodInUseRoute(errorCode: unknown): PaymentMethodInUseRoute | undefined {
  if (errorCode === "PaymentMethodInUseByAdvert") return "/ads"
  if (errorCode === "PaymentMethodInUseByOrder") return "/orders"

  return undefined
}
