import { PaymentMethodsAPI } from "./api-payment-methods"

// Re-export the functions that are being used in the components
export const getPaymentMethods = PaymentMethodsAPI.getPaymentMethods
export const getPaymentMethodFields = PaymentMethodsAPI.getPaymentMethodFields

export const ProfileAPI = {
  PaymentMethods: PaymentMethodsAPI,
}
