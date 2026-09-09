/**
 * Whether payment-method mutations require session elevation and use v2 APIs.
 *
 * The feature is disabled by default so an unset or invalid deployment variable
 * continues to use the existing v1 mutation endpoints without an OTP step.
 */
export function isPaymentMethodSessionElevationEnabled(): boolean {
  return process.env.NEXT_PUBLIC_IS_PAYMENT_METHOD_SESSION_ELEVATION_ENABLED === "1"
}
