import { PaymentMethodsAPI } from "./api-payment-methods"

export const getPaymentMethods = PaymentMethodsAPI.getPaymentMethods
export const getPaymentMethodFields = PaymentMethodsAPI.getPaymentMethodFields

export const ProfileAPI = {
  PaymentMethods: PaymentMethodsAPI,
}
