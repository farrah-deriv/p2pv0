import {
  getPaymentMethodAccountValidationIssue,
  getPaymentMethodFieldMaxLength,
  getPaymentMethodFieldValidationIssue,
  hasInvalidLegacyMpesaAccountNumber,
  isDigitsOnly,
  isMpesaPaymentMethod,
  isValidMpesaAccount,
  isValidPaymentMethodKey,
  PAYMENT_METHOD_ACCOUNT_MAX_LENGTH,
  PAYMENT_METHOD_INSTRUCTIONS_MAX_LENGTH,
  requiresNumericAccountField,
  sanitizeMpesaAccountInput,
} from "@/lib/payment-method-validation"

describe("payment-method-validation", () => {
  describe("isMpesaPaymentMethod", () => {
    it("returns true for M-Pesa method keys", () => {
      expect(isMpesaPaymentMethod("mpesa_tanzania")).toBe(true)
      expect(isMpesaPaymentMethod("safaricom_mpesa")).toBe(true)
      expect(isMpesaPaymentMethod("vodacom_m_pesa")).toBe(true)
    })

    it("returns false for other payment methods", () => {
      expect(isMpesaPaymentMethod("bank_transfer")).toBe(false)
      expect(isMpesaPaymentMethod("paypal")).toBe(false)
    })

    it("matches M-Pesa keys case-insensitively", () => {
      expect(isMpesaPaymentMethod("Safaricom_Mpesa")).toBe(true)
      expect(isMpesaPaymentMethod("MPESA_TANZANIA")).toBe(true)
    })
  })

  describe("requiresNumericAccountField", () => {
    it("returns true only for M-Pesa account fields", () => {
      expect(requiresNumericAccountField("safaricom_mpesa", "account")).toBe(true)
      expect(requiresNumericAccountField("safaricom_mpesa", "instructions")).toBe(false)
      expect(requiresNumericAccountField("paypal", "account")).toBe(false)
    })
  })

  describe("sanitizeMpesaAccountInput", () => {
    it("preserves optional leading plus and strips other non-digits", () => {
      expect(sanitizeMpesaAccountInput("+254712abc")).toBe("+254712")
      expect(sanitizeMpesaAccountInput("0712-345-678")).toBe("0712345678")
      expect(sanitizeMpesaAccountInput("12+34")).toBe("1234")
    })
  })

  describe("isValidMpesaAccount", () => {
    it("accepts digits only and optional leading plus", () => {
      expect(isValidMpesaAccount("0712345678")).toBe(true)
      expect(isValidMpesaAccount("+254712345678")).toBe(true)
    })

    it("rejects invalid M-Pesa account formats", () => {
      expect(isValidMpesaAccount("KE123ABC")).toBe(false)
      expect(isValidMpesaAccount("07+12")).toBe(false)
      expect(isValidMpesaAccount("+")).toBe(false)
      expect(isValidMpesaAccount("1".repeat(PAYMENT_METHOD_ACCOUNT_MAX_LENGTH + 1))).toBe(false)
    })
  })

  describe("isDigitsOnly (deprecated)", () => {
    it("accepts digits and rejects other characters", () => {
      expect(isDigitsOnly("123456")).toBe(true)
      expect(isDigitsOnly("0712345678")).toBe(true)
      expect(isDigitsOnly("12a34")).toBe(false)
      expect(isDigitsOnly("")).toBe(false)
    })
  })

  describe("hasInvalidLegacyMpesaAccountNumber", () => {
    it("returns true for non-numeric legacy M-Pesa accounts", () => {
      expect(hasInvalidLegacyMpesaAccountNumber("safaricom_mpesa", "0712-abc")).toBe(true)
      expect(hasInvalidLegacyMpesaAccountNumber("safaricom_mpesa", "KE123ABC")).toBe(true)
    })

    it("returns false for valid M-Pesa accounts", () => {
      expect(hasInvalidLegacyMpesaAccountNumber("safaricom_mpesa", "0712345678")).toBe(false)
      expect(hasInvalidLegacyMpesaAccountNumber("safaricom_mpesa", "+254712345678")).toBe(false)
    })

    it("returns false for empty or non-M-Pesa methods", () => {
      expect(hasInvalidLegacyMpesaAccountNumber("safaricom_mpesa", "")).toBe(false)
      expect(hasInvalidLegacyMpesaAccountNumber("paypal", "abc-123")).toBe(false)
    })
  })

  describe("getPaymentMethodFieldValidationIssue", () => {
    it("returns numbersOnly for invalid M-Pesa account values", () => {
      expect(getPaymentMethodFieldValidationIssue("safaricom_mpesa", "account", "12a34")).toBe(
        "numbersOnly",
      )
      expect(getPaymentMethodFieldValidationIssue("mpesa_tanzania", "account", "KE123ABC")).toBe(
        "numbersOnly",
      )
    })

    it("accepts numeric and plus-prefixed M-Pesa accounts", () => {
      expect(getPaymentMethodFieldValidationIssue("vodacom_m_pesa", "account", "0712345678")).toBe(
        null,
      )
      expect(
        getPaymentMethodFieldValidationIssue("vodacom_m_pesa", "account", "+254712345678"),
      ).toBe(null)
    })

    it("returns invalidFormat for invalid non-M-Pesa account values", () => {
      expect(getPaymentMethodFieldValidationIssue("paypal", "account", "user#name")).toBe(
        "invalidFormat",
      )
      expect(getPaymentMethodFieldValidationIssue("paypal", "account", "O'Brien")).toBe(
        "invalidFormat",
      )
    })

    it("accepts valid non-M-Pesa account values", () => {
      expect(getPaymentMethodFieldValidationIssue("safaricom_mpesa", "account", "0712345678")).toBe(
        null,
      )
      expect(getPaymentMethodFieldValidationIssue("paypal", "account", "user@bank.com")).toBe(null)
    })

    it("returns null for empty values", () => {
      expect(getPaymentMethodFieldValidationIssue("safaricom_mpesa", "account", "")).toBe(null)
      expect(getPaymentMethodFieldValidationIssue("safaricom_mpesa", "account", "   ")).toBe(null)
    })

    it("accepts unicode bank names and branches", () => {
      expect(
        getPaymentMethodFieldValidationIssue("bank_transfer", "bank_name", "البنك الأهلي"),
      ).toBe(null)
      expect(getPaymentMethodFieldValidationIssue("bank_transfer", "branch", "فرع الرياض")).toBe(
        null,
      )
    })

    it("rejects disallowed symbols in bank fields", () => {
      expect(getPaymentMethodFieldValidationIssue("bank_transfer", "bank_name", "Bank #1")).toBe(
        "invalidFormat",
      )
    })

    it("accepts extended symbols in instructions", () => {
      expect(
        getPaymentMethodFieldValidationIssue(
          "wise",
          "instructions",
          "Pay within 24h! Use ref: ABC/123",
        ),
      ).toBe(null)
    })

    it("rejects instructions over 300 characters", () => {
      expect(getPaymentMethodFieldValidationIssue("wise", "instructions", "a".repeat(301))).toBe(
        "invalidFormat",
      )
    })

    it("validates bank code with ASCII pattern", () => {
      expect(getPaymentMethodFieldValidationIssue("bank_transfer", "bank_code", "SWIFT123")).toBe(
        null,
      )
      expect(getPaymentMethodFieldValidationIssue("bank_transfer", "bank_code", "كود")).toBe(
        "invalidFormat",
      )
    })

    it("returns null for unknown field names", () => {
      expect(getPaymentMethodFieldValidationIssue("paypal", "method", "invalid")).toBe(null)
    })
  })

  describe("getPaymentMethodAccountValidationIssue (deprecated)", () => {
    it("delegates to field validation for account fields only", () => {
      expect(getPaymentMethodAccountValidationIssue("safaricom_mpesa", "account", "12a34")).toBe(
        "numbersOnly",
      )
      expect(getPaymentMethodAccountValidationIssue("paypal", "account", "user@bank.com")).toBe(
        null,
      )
      expect(getPaymentMethodAccountValidationIssue("paypal", "instructions", "bad#value")).toBe(
        null,
      )
    })
  })

  describe("getPaymentMethodFieldMaxLength", () => {
    it("returns max lengths for known fields", () => {
      expect(getPaymentMethodFieldMaxLength("account")).toBe(PAYMENT_METHOD_ACCOUNT_MAX_LENGTH)
      expect(getPaymentMethodFieldMaxLength("instructions")).toBe(
        PAYMENT_METHOD_INSTRUCTIONS_MAX_LENGTH,
      )
      expect(getPaymentMethodFieldMaxLength("bank_name")).toBe(100)
      expect(getPaymentMethodFieldMaxLength("bank_code")).toBe(50)
      expect(getPaymentMethodFieldMaxLength("branch")).toBe(100)
    })

    it("returns undefined for unknown fields", () => {
      expect(getPaymentMethodFieldMaxLength("unknown")).toBeUndefined()
    })
  })

  describe("isValidPaymentMethodKey", () => {
    it("accepts lowercase method keys with underscores", () => {
      expect(isValidPaymentMethodKey("bank_transfer")).toBe(true)
      expect(isValidPaymentMethodKey("safaricom_mpesa")).toBe(true)
    })

    it("rejects invalid method keys", () => {
      expect(isValidPaymentMethodKey("Bank Transfer")).toBe(false)
      expect(isValidPaymentMethodKey("bank-transfer")).toBe(false)
    })
  })
})
