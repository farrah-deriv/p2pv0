type Translate = (key: string) => string

/** Account number sent as `fields.account` when creating a payment method. */
export function resolvePaymentMethodAccountFieldValue(
  fields: Record<string, string>,
  t: Translate,
): string {
  const account = fields.account?.trim()
  return account || t("paymentMethod.fieldFallback")
}
