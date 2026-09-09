import { mapOrderError } from "@/lib/orders/order-error-mapper"
import { OrderErrorAction } from "@/lib/orders/order-error-actions"

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}::${JSON.stringify(params)}` : key

describe("mapOrderError", () => {
  // ─── Generic server errors ──────────────────────────────────────────────────

  describe("generic server errors", () => {
    it.each(["9001", "9002", "9003", "9004"])("maps %s to Retry + OpenLiveChat", (code) => {
      const result = mapOrderError(code, t)
      expect(result.primaryAction).toBe(OrderErrorAction.Retry)
      expect(result.secondaryAction).toBe(OrderErrorAction.OpenLiveChat)
      expect(result.title).toBe("order.genericTitle")
    })
  })

  // ─── Ad / currency errors ───────────────────────────────────────────────────

  describe("ad / currency errors", () => {
    it("maps AdvertAccountCurrencyInvalid to Dismiss", () => {
      const result = mapOrderError("AdvertAccountCurrencyInvalid", t)
      expect(result.primaryAction).toBe(OrderErrorAction.Dismiss)
      expect(result.secondaryAction).toBe(OrderErrorAction.Dismiss)
    })

    it("maps AdvertFloatRateDisabled to Dismiss", () => {
      const result = mapOrderError("AdvertFloatRateDisabled", t)
      expect(result.primaryAction).toBe(OrderErrorAction.Dismiss)
    })

    it("maps AdvertPaymentCurrencyInvalid to Dismiss", () => {
      const result = mapOrderError("AdvertPaymentCurrencyInvalid", t)
      expect(result.primaryAction).toBe(OrderErrorAction.Dismiss)
    })
  })

  // ─── Amount / limit errors ──────────────────────────────────────────────────

  describe("amount and limit errors", () => {
    it("maps OrderAmountMaximum to AdjustAmount", () => {
      const result = mapOrderError("OrderAmountMaximum", t)
      expect(result.primaryAction).toBe(OrderErrorAction.AdjustAmount)
      expect(result.secondaryAction).toBe(OrderErrorAction.Dismiss)
    })

    it("maps OrderAmountMinimum to AdjustAmount", () => {
      const result = mapOrderError("OrderAmountMinimum", t)
      expect(result.primaryAction).toBe(OrderErrorAction.AdjustAmount)
      expect(result.secondaryAction).toBe(OrderErrorAction.Dismiss)
    })

    it("maps OrderDailyBuyLimit to AdjustAmount", () => {
      const result = mapOrderError("OrderDailyBuyLimit", t)
      expect(result.primaryAction).toBe(OrderErrorAction.AdjustAmount)
    })

    it("maps OrderDailySellLimit to AdjustAmount", () => {
      const result = mapOrderError("OrderDailySellLimit", t)
      expect(result.primaryAction).toBe(OrderErrorAction.AdjustAmount)
    })

    it("maps OrderDailyCountLimit to Dismiss only", () => {
      const result = mapOrderError("OrderDailyCountLimit", t)
      expect(result.primaryAction).toBe(OrderErrorAction.Dismiss)
      expect(result.secondaryAction).toBe(OrderErrorAction.Dismiss)
    })
  })

  // ─── Payment method errors ──────────────────────────────────────────────────

  describe("payment method errors", () => {
    it("maps OrderPaymentMethodInvalid to Dismiss", () => {
      const result = mapOrderError("OrderPaymentMethodInvalid", t)
      expect(result.primaryAction).toBe(OrderErrorAction.Dismiss)
      expect(result.secondaryAction).toBe(OrderErrorAction.Dismiss)
    })

    it("maps OrderUserPaymentMethodInvalid to Dismiss", () => {
      const result = mapOrderError("OrderUserPaymentMethodInvalid", t)
      expect(result.primaryAction).toBe(OrderErrorAction.Dismiss)
      expect(result.secondaryAction).toBe(OrderErrorAction.Dismiss)
    })
  })

  // ─── View-other-ads codes (the 13 from the bug report) ─────────────────────

  describe("ViewOtherAds codes", () => {
    const viewOtherAdsCodes = [
      "OrderAdvertiserBlocked",
      "OrderAdvertiserFundTransferError",
      "OrderAdvertiserScheduleUnavailable",
      "OrderAdvertNotFound",
      "OrderAdvertOwn",
      "OrderAdvertPrivate",
      "OrderAdvertUnlisted",
      "OrderUserNotFavourite",
      "OrderAdvertiserFundsInsufficient",
      "OrderCountryInvalid",
      "v1InsufficientFunds",
      "v1DebitFailed",
      "AdvertiserTempUnavailable",
    ]

    it.each(viewOtherAdsCodes)("maps %s primary action to ViewOtherAds", (code) => {
      const result = mapOrderError(code, t)
      expect(result.primaryAction).toBe(OrderErrorAction.ViewOtherAds)
    })

    it.each(["OrderUserRegisteredDateInvalid", "OrderUserCompletionRateInvalid"])(
      "maps %s to Browse ads + Go back",
      (code) => {
        const result = mapOrderError(code, t)
        expect(result.primaryAction).toBe(OrderErrorAction.ViewOtherAds)
        expect(result.primaryCta).toBe("order.browseAds")
        expect(result.secondaryAction).toBe(OrderErrorAction.GoBack)
        expect(result.secondaryCta).toBe("order.goBack")
      },
    )

    it("maps OrderAdvertiserBlocked secondary to ManageBlocked", () => {
      const result = mapOrderError("OrderAdvertiserBlocked", t)
      expect(result.secondaryAction).toBe(OrderErrorAction.ManageBlocked)
    })

    it("maps OrderAdvertiserFundTransferError secondary to Retry", () => {
      const result = mapOrderError("OrderAdvertiserFundTransferError", t)
      expect(result.secondaryAction).toBe(OrderErrorAction.Retry)
    })

    it("maps AdvertiserTempUnavailable secondary to Retry", () => {
      const result = mapOrderError("AdvertiserTempUnavailable", t)
      expect(result.secondaryAction).toBe(OrderErrorAction.Retry)
    })
  })

  // ─── Trade / schedule / barred errors ───────────────────────────────────────

  describe("trade and schedule errors", () => {
    it("maps OrderTradeBandInvalid to ViewProfile", () => {
      const result = mapOrderError("OrderTradeBandInvalid", t)
      expect(result.primaryAction).toBe(OrderErrorAction.ViewProfile)
      expect(result.secondaryAction).toBe(OrderErrorAction.Dismiss)
    })

    it("maps OrderTemporarilyBarred to Dismiss only", () => {
      const result = mapOrderError("OrderTemporarilyBarred", t)
      expect(result.primaryAction).toBe(OrderErrorAction.Dismiss)
      expect(result.secondaryCta).toBeUndefined()
    })

    it("maps OrderUserScheduleUnavailable to Dismiss", () => {
      const result = mapOrderError("OrderUserScheduleUnavailable", t)
      expect(result.primaryAction).toBe(OrderErrorAction.Dismiss)
      expect(result.secondaryAction).toBe(OrderErrorAction.Dismiss)
    })

    it("maps OrderUserTransactionTypeNotAllowed primary to OpenLiveChat", () => {
      const result = mapOrderError("OrderUserTransactionTypeNotAllowed", t)
      expect(result.primaryAction).toBe(OrderErrorAction.OpenLiveChat)
      expect(result.secondaryAction).toBe(OrderErrorAction.Dismiss)
    })
  })

  // ─── User-state errors ───────────────────────────────────────────────────────

  describe("user-state errors", () => {
    it("maps UserDisabled to OpenLiveChat", () => {
      const result = mapOrderError("UserDisabled", t)
      expect(result.primaryAction).toBe(OrderErrorAction.OpenLiveChat)
      expect(result.secondaryAction).toBe(OrderErrorAction.Dismiss)
    })

    it("maps UserTempBan to ViewProfile", () => {
      const result = mapOrderError("UserTempBan", t)
      expect(result.primaryAction).toBe(OrderErrorAction.ViewProfile)
      expect(result.secondaryAction).toBe(OrderErrorAction.Dismiss)
    })

    it("maps P2PDisabled to maintenance copy + OpenLiveChat", () => {
      const result = mapOrderError("P2PDisabled", t)
      expect(result.title).toBe("maintenance.errorTitle")
      expect(result.message).toBe("maintenance.errorMessage")
      expect(result.primaryAction).toBe(OrderErrorAction.OpenLiveChat)
      expect(result.secondaryAction).toBe(OrderErrorAction.Dismiss)
    })

    it("maps OrderUserFundsInsufficient to Retry + OpenLiveChat", () => {
      const result = mapOrderError("OrderUserFundsInsufficient", t)
      expect(result.primaryAction).toBe(OrderErrorAction.Retry)
      expect(result.secondaryAction).toBe(OrderErrorAction.OpenLiveChat)
    })

    it("maps OrderAdvertiserNotOnline to Dismiss only", () => {
      const result = mapOrderError("OrderAdvertiserNotOnline", t)
      expect(result.primaryAction).toBe(OrderErrorAction.Dismiss)
      expect(result.secondaryCta).toBeUndefined()
    })

    it("maps UserReadOnly to OpenLiveChat", () => {
      const result = mapOrderError("UserReadOnly", t)
      expect(result.primaryAction).toBe(OrderErrorAction.OpenLiveChat)
    })

    it("maps OrderTempLocked to Dismiss + GoBack", () => {
      const result = mapOrderError("OrderTempLocked", t)
      expect(result.primaryAction).toBe(OrderErrorAction.Dismiss)
      expect(result.secondaryAction).toBe(OrderErrorAction.GoBack)
    })

    it("maps OrderVerificationTempLock to Dismiss", () => {
      const result = mapOrderError("OrderVerificationTempLock", t)
      expect(result.primaryAction).toBe(OrderErrorAction.Dismiss)
      expect(result.secondaryAction).toBe(OrderErrorAction.Dismiss)
    })
  })

  // ─── Order existence / routing errors ───────────────────────────────────────

  describe("order existence and routing errors", () => {
    it("maps OrderExists primary to ViewActiveOrder", () => {
      const result = mapOrderError("OrderExists", t)
      expect(result.primaryAction).toBe(OrderErrorAction.ViewActiveOrder)
      expect(result.secondaryAction).toBe(OrderErrorAction.Dismiss)
    })

    it("maps DuplicateRequestDetected to ViewOrders", () => {
      const result = mapOrderError("DuplicateRequestDetected", t)
      expect(result.primaryAction).toBe(OrderErrorAction.ViewOrders)
    })
  })

  // ─── v1 / migration errors ───────────────────────────────────────────────────

  describe("v1 and migration errors", () => {
    it("maps v1MigrationInProgress to Retry", () => {
      const result = mapOrderError("v1MigrationInProgress", t)
      expect(result.primaryAction).toBe(OrderErrorAction.Retry)
    })

    it("maps v1MigrationInProgressOrCompleted to Retry", () => {
      const result = mapOrderError("v1MigrationInProgressOrCompleted", t)
      expect(result.primaryAction).toBe(OrderErrorAction.Retry)
    })

    it("maps v1WithdrawalLimit to VerifyAccount", () => {
      const result = mapOrderError("v1WithdrawalLimit", t)
      expect(result.primaryAction).toBe(OrderErrorAction.VerifyAccount)
    })

    it("maps v1FinancialAssessmentRequired to CompleteAssessment", () => {
      const result = mapOrderError("v1FinancialAssessmentRequired", t)
      expect(result.primaryAction).toBe(OrderErrorAction.CompleteAssessment)
    })
  })

  // ─── Rate slippage ───────────────────────────────────────────────────────────

  describe("rate slippage", () => {
    it("maps OrderFloatRateSlippage to ConfirmRateSlippage", () => {
      const result = mapOrderError("OrderFloatRateSlippage", t)
      expect(result.primaryAction).toBe(OrderErrorAction.ConfirmRateSlippage)
      expect(result.secondaryAction).toBe(OrderErrorAction.Dismiss)
    })

    it("maps OrderCreateFailRateSlippage to ConfirmRateSlippage", () => {
      const result = mapOrderError("OrderCreateFailRateSlippage", t)
      expect(result.primaryAction).toBe(OrderErrorAction.ConfirmRateSlippage)
      expect(result.secondaryAction).toBe(OrderErrorAction.Dismiss)
    })

    it("uses rateSlippageSellMessage when isBuyAdvert is true", () => {
      const result = mapOrderError("OrderFloatRateSlippage", t, {
        isBuyAdvert: true,
        paymentCurrency: "USD",
        accountCurrency: "EUR",
      })
      expect(result.message).toContain("order.rateSlippageSellMessage")
      expect(result.message).toContain('"pay":"USD"')
      expect(result.message).toContain('"acc":"EUR"')
    })

    it("uses rateSlippageBuyMessage when isBuyAdvert is false", () => {
      const result = mapOrderError("OrderFloatRateSlippage", t, {
        isBuyAdvert: false,
        paymentCurrency: "USD",
        accountCurrency: "EUR",
      })
      expect(result.message).toContain("order.rateSlippageBuyMessage")
    })

    it("handles missing currency context gracefully", () => {
      const result = mapOrderError("OrderFloatRateSlippage", t, {})
      expect(result.primaryAction).toBe(OrderErrorAction.ConfirmRateSlippage)
    })
  })

  // ─── Default fallback ────────────────────────────────────────────────────────

  describe("default fallback", () => {
    it("maps unknown code to Dismiss with generic title", () => {
      const result = mapOrderError("UnknownCode999", t)
      expect(result.primaryAction).toBe(OrderErrorAction.Dismiss)
      expect(result.title).toBe("order.genericTitle")
    })

    it("includes the error code in the message for unknown codes", () => {
      const result = mapOrderError("SomeWeirdCode", t)
      expect(result.message).toContain("SomeWeirdCode")
    })

    it("uses genericMessage for empty string code", () => {
      const result = mapOrderError("", t)
      expect(result.message).toBe("order.genericMessage")
    })

    it("has no secondary CTA for unknown codes", () => {
      const result = mapOrderError("UnknownCode", t)
      expect(result.secondaryCta).toBeUndefined()
    })
  })

  // ─── OrderErrorMessage shape ─────────────────────────────────────────────────

  describe("OrderErrorMessage shape", () => {
    it("always returns title, message, primaryCta, primaryAction", () => {
      const result = mapOrderError("OrderAdvertUnlisted", t)
      expect(result).toHaveProperty("title")
      expect(result).toHaveProperty("message")
      expect(result).toHaveProperty("primaryCta")
      expect(result).toHaveProperty("primaryAction")
    })

    it("secondary fields are both present or both absent", () => {
      const withSecondary = mapOrderError("OrderAdvertUnlisted", t)
      expect(withSecondary.secondaryCta).toBeDefined()
      expect(withSecondary.secondaryAction).toBeDefined()

      const withoutSecondary = mapOrderError("OrderTemporarilyBarred", t)
      expect(withoutSecondary.secondaryCta).toBeUndefined()
      expect(withoutSecondary.secondaryAction).toBeUndefined()
    })
  })
})
