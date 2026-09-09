import type {
  PaymentMethodFieldName,
  PaymentMethodFieldValidationIssue,
} from "@/lib/payment-method-validation"

export function getPaymentMethodFieldValidationMessageKey(
  field: PaymentMethodFieldName,
  issue: PaymentMethodFieldValidationIssue,
): string {
  if (issue === "numbersOnly") {
    return "profile.validationNumbersOnly"
  }

  switch (field) {
    case "account":
      return "profile.validationAccountInvalidFormat"
    case "instructions":
      return "profile.validationInstructionsInvalidFormat"
    case "bank_name":
      return "profile.validationBankNameInvalidFormat"
    case "bank_code":
      return "profile.validationBankCodeInvalidFormat"
    case "branch":
      return "profile.validationBranchInvalidFormat"
    default:
      return "profile.validationAccountInvalidFormat"
  }
}
