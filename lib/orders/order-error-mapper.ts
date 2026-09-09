import { OrderErrorAction, type OrderErrorMessage } from "./order-error-actions"

type Translator = (key: string, params?: Record<string, string | number>) => string

export interface OrderErrorMapCtx {
  isBuyAdvert?: boolean
  accountCurrency?: string
  paymentCurrency?: string
}

export function mapOrderError(
  code: string,
  t: Translator,
  ctx: OrderErrorMapCtx = {},
): OrderErrorMessage {
  switch (code) {
    case "9001":
      return {
        title: t("order.genericTitle"),
        message: t("order.err9001Message"),
        primaryCta: t("order.tryAgain"),
        primaryAction: OrderErrorAction.Retry,
        secondaryCta: t("order.openLiveChat"),
        secondaryAction: OrderErrorAction.OpenLiveChat,
      }

    case "9002":
      return {
        title: t("order.genericTitle"),
        message: t("order.err9002Message"),
        primaryCta: t("order.tryAgain"),
        primaryAction: OrderErrorAction.Retry,
        secondaryCta: t("order.openLiveChat"),
        secondaryAction: OrderErrorAction.OpenLiveChat,
      }

    case "9003":
      return {
        title: t("order.genericTitle"),
        message: t("order.err9003Message"),
        primaryCta: t("order.tryAgain"),
        primaryAction: OrderErrorAction.Retry,
        secondaryCta: t("order.openLiveChat"),
        secondaryAction: OrderErrorAction.OpenLiveChat,
      }

    case "9004":
      return {
        title: t("order.genericTitle"),
        message: t("order.err9004Message"),
        primaryCta: t("order.tryAgain"),
        primaryAction: OrderErrorAction.Retry,
        secondaryCta: t("order.openLiveChat"),
        secondaryAction: OrderErrorAction.OpenLiveChat,
      }

    case "AdvertAccountCurrencyInvalid":
      return {
        title: t("order.chooseCurrencyTitle"),
        message: t("order.chooseCurrencyMessage"),
        primaryCta: t("order.changeCurrency"),
        primaryAction: OrderErrorAction.Dismiss,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "AdvertFloatRateDisabled":
      return {
        title: t("order.floatRateTitle"),
        message: t("order.floatRateMessage"),
        primaryCta: t("order.updateAd"),
        primaryAction: OrderErrorAction.Dismiss,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "AdvertPaymentCurrencyInvalid":
      return {
        title: t("order.choosePaymentCurrencyTitle"),
        message: t("order.choosePaymentCurrencyMessage"),
        primaryCta: t("order.changeCurrency"),
        primaryAction: OrderErrorAction.Dismiss,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderAmountMaximum":
      return {
        title: t("order.amountTooHighTitle"),
        message: t("order.amountTooHighMessage"),
        primaryCta: t("order.updateAmount"),
        primaryAction: OrderErrorAction.AdjustAmount,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderAmountMinimum":
      return {
        title: t("order.amountTooLowTitle"),
        message: t("order.amountTooLowMessage"),
        primaryCta: t("order.updateAmount"),
        primaryAction: OrderErrorAction.AdjustAmount,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderDailyBuyLimit":
      return {
        title: t("order.buyLimitTitle"),
        message: t("order.buyLimitMessage"),
        primaryCta: t("order.adjustAmount"),
        primaryAction: OrderErrorAction.AdjustAmount,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderDailySellLimit":
      return {
        title: t("order.sellLimitTitle"),
        message: t("order.sellLimitMessage"),
        primaryCta: t("order.adjustAmount"),
        primaryAction: OrderErrorAction.AdjustAmount,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderDailyCountLimit":
      return {
        title: t("order.orderLimitTitle"),
        message: t("order.orderLimitMessage"),
        primaryCta: t("common.gotIt"),
        primaryAction: OrderErrorAction.Dismiss,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderPaymentMethodInvalid":
      return {
        title: t("order.paymentMethodNotSupportedTitle"),
        message: t("order.paymentMethodNotSupportedMessage"),
        primaryCta: t("order.changePaymentMethod"),
        primaryAction: OrderErrorAction.Dismiss,
        secondaryCta: t("common.cancel"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderUserPaymentMethodInvalid":
      return {
        title: t("order.paymentMethodNotAvailableTitle"),
        message: t("order.paymentMethodNotAvailableMessage"),
        primaryCta: t("order.changePaymentMethod"),
        primaryAction: OrderErrorAction.Dismiss,
        secondaryCta: t("common.cancel"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderTradeBandInvalid":
      return {
        title: t("order.tradeBandTitle"),
        message: t("order.tradeBandMessage"),
        primaryCta: t("order.viewLimits"),
        primaryAction: OrderErrorAction.ViewProfile,
        secondaryCta: t("common.cancel"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderTemporarilyBarred":
      return {
        title: t("order.temporarilyBarredTitle"),
        message: t("order.temporarilyBarredMessage"),
        primaryCta: t("common.gotIt"),
        primaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderUserScheduleUnavailable":
      return {
        title: t("order.scheduleConflictTitle"),
        message: t("order.scheduleConflictMessage"),
        primaryCta: t("order.editSchedule"),
        primaryAction: OrderErrorAction.Dismiss,
        secondaryCta: t("order.maybeLater"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderUserTransactionTypeNotAllowed":
      return {
        title: t("order.orderTypeNotAllowedTitle"),
        message: t("order.orderTypeNotAllowedMessage"),
        primaryCta: t("order.openLiveChat"),
        primaryAction: OrderErrorAction.OpenLiveChat,
        secondaryCta: t("order.maybeLater"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderUserFundsInsufficient":
      return {
        title: t("order.userInsufficientFundsTitle"),
        message: t("order.userInsufficientFundsMessage"),
        primaryCta: t("order.tryAgain"),
        primaryAction: OrderErrorAction.Retry,
        secondaryCta: t("order.openLiveChat"),
        secondaryAction: OrderErrorAction.OpenLiveChat,
      }

    case "OrderAdvertiserBlocked":
      return {
        title: t("order.advertiserBlockedTitle"),
        message: t("order.advertiserBlockedMessage"),
        primaryCta: t("order.manageBlockedUsers"),
        primaryAction: OrderErrorAction.ManageBlocked,
        secondaryCta: t("order.viewOtherAds"),
        secondaryAction: OrderErrorAction.ViewOtherAds,
      }

    case "OrderAdvertiserFundTransferError":
      return {
        title: t("order.transferUnsuccessfulTitle"),
        message: t("order.transferUnsuccessfulMessage"),
        primaryCta: t("order.viewOtherAds"),
        primaryAction: OrderErrorAction.ViewOtherAds,
        secondaryCta: t("order.tryAgain"),
        secondaryAction: OrderErrorAction.Retry,
      }

    case "OrderAdvertiserNotOnline":
      return {
        title: t("order.advertiserOfflineTitle"),
        message: t("order.advertiserOfflineMessage"),
        primaryCta: t("common.gotIt"),
        primaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderAdvertiserScheduleUnavailable":
      return {
        title: t("order.advertiserUnavailableTitle"),
        message: t("order.advertiserUnavailableMessage"),
        primaryCta: t("order.viewOtherAds"),
        primaryAction: OrderErrorAction.ViewOtherAds,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderAdvertNotFound":
      return {
        title: t("order.adNotAvailableTitle"),
        message: t("order.adNotAvailableMessage"),
        primaryCta: t("order.viewOtherAds"),
        primaryAction: OrderErrorAction.ViewOtherAds,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderAdvertOwn":
      return {
        title: t("order.ownAdTitle"),
        message: t("order.ownAdMessage"),
        primaryCta: t("order.viewOtherAds"),
        primaryAction: OrderErrorAction.ViewOtherAds,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderAdvertPrivate":
      return {
        title: t("order.adRestrictedTitle"),
        message: t("order.adPrivateMessage"),
        primaryCta: t("order.viewOtherAds"),
        primaryAction: OrderErrorAction.ViewOtherAds,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderAdvertUnlisted":
      return {
        title: t("order.adNotAvailableTitle"),
        message: t("order.adUnlistedMessage"),
        primaryCta: t("order.viewOtherAds"),
        primaryAction: OrderErrorAction.ViewOtherAds,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderUserNotFavourite":
      return {
        title: t("order.adRestrictedTitle"),
        message: t("order.userNotFavouriteMessage"),
        primaryCta: t("order.viewOtherAds"),
        primaryAction: OrderErrorAction.ViewOtherAds,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderUserRegisteredDateInvalid":
      return {
        title: t("order.notEligibleYetTitle"),
        message: t("order.notEligibleYetMessage"),
        primaryCta: t("order.browseAds"),
        primaryAction: OrderErrorAction.ViewOtherAds,
        secondaryCta: t("order.goBack"),
        secondaryAction: OrderErrorAction.GoBack,
      }

    case "OrderUserCompletionRateInvalid":
      return {
        title: t("order.completionRateTooLowTitle"),
        message: t("order.completionRateTooLowMessage"),
        primaryCta: t("order.browseAds"),
        primaryAction: OrderErrorAction.ViewOtherAds,
        secondaryCta: t("order.goBack"),
        secondaryAction: OrderErrorAction.GoBack,
      }

    case "OrderCreateFailRateSlippage":
    case "OrderFloatRateSlippage": {
      const pay = ctx.paymentCurrency ?? ""
      const acc = ctx.accountCurrency ?? ""
      return {
        title: t("order.rateUpdatedTitle"),
        message: ctx.isBuyAdvert
          ? t("order.rateSlippageSellMessage", { pay, acc })
          : t("order.rateSlippageBuyMessage", { pay, acc }),
        primaryCta: t("order.confirmAndContinue"),
        primaryAction: OrderErrorAction.ConfirmRateSlippage,
        secondaryCta: t("order.goBack"),
        secondaryAction: OrderErrorAction.Dismiss,
      }
    }

    case "OrderExists":
      return {
        title: t("order.orderExistsTitle"),
        message: t("order.orderExistsMessage"),
        primaryCta: t("order.viewActiveOrder"),
        primaryAction: OrderErrorAction.ViewActiveOrder,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "UserDisabled":
      return {
        title: t("order.accountIssueTitle"),
        message: t("order.accountIssueMessage"),
        primaryCta: t("order.openLiveChat"),
        primaryAction: OrderErrorAction.OpenLiveChat,
        secondaryCta: t("order.maybeLater"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "UserTempBan":
      return {
        title: t("order.accountRestrictedTitle"),
        message: t("order.accountRestrictedMessage"),
        primaryCta: t("order.viewProfile"),
        primaryAction: OrderErrorAction.ViewProfile,
        secondaryCta: t("order.maybeLater"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderTempLocked":
      return {
        title: t("order.tempLockedTitle"),
        message: t("order.tempLockedDescription"),
        primaryCta: t("order.tryAgain"),
        primaryAction: OrderErrorAction.Dismiss,
        secondaryCta: t("order.goBack"),
        secondaryAction: OrderErrorAction.GoBack,
      }

    case "OrderVerificationTempLock":
      return {
        title: t("order.verificationLockedTitle"),
        message: t("order.verificationLockedDescription"),
        primaryCta: t("common.gotIt"),
        primaryAction: OrderErrorAction.Dismiss,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "v1InsufficientFunds":
      return {
        title: t("order.insufficientFunds"),
        message: t("order.insufficientFundsDescription"),
        primaryCta: t("order.viewOtherAds"),
        primaryAction: OrderErrorAction.ViewOtherAds,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderCountryInvalid":
      return {
        title: t("order.adRestrictedTitle"),
        message: t("order.adCountryInvalidDescription"),
        primaryCta: t("order.viewOtherAds"),
        primaryAction: OrderErrorAction.ViewOtherAds,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "v1DebitFailed":
      return {
        title: t("order.v1DebitFailedTitle"),
        message: t("order.v1DebitFailedMessage"),
        primaryCta: t("order.viewOtherAds"),
        primaryAction: OrderErrorAction.ViewOtherAds,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "OrderExchangeRateRequired":
      return {
        title: t("order.exchangeRateRequiredTitle"),
        message: t("order.exchangeRateRequiredDescription"),
        primaryCta: t("order.exchangeRateRequiredCta"),
        primaryAction: OrderErrorAction.AdjustAmount,
        secondaryCta: t("common.cancel"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "UserReadOnly":
      return {
        title: t("order.userReadOnlyTitle"),
        message: t("order.userReadOnlyDescription"),
        primaryCta: t("order.userReadOnlyOpenChat"),
        primaryAction: OrderErrorAction.OpenLiveChat,
        secondaryCta: t("order.userReadOnlyMaybeLater"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "P2PDisabled":
      return {
        title: t("maintenance.errorTitle"),
        message: t("maintenance.errorMessage"),
        primaryCta: t("navigation.backToHome"),
        primaryAction: OrderErrorAction.GoToMarkets,
        secondaryCta: t("order.openLiveChat"),
        secondaryAction: OrderErrorAction.OpenLiveChat,
      }

    case "DuplicateRequestDetected":
      return {
        title: t("order.duplicateRequestTitle"),
        message: t("order.duplicateRequestDescription"),
        primaryCta: t("order.viewMyOrders"),
        primaryAction: OrderErrorAction.ViewOrders,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "v1MigrationInProgress":
    case "v1MigrationInProgressOrCompleted":
      return {
        title: t("order.migrationInProgressTitle"),
        message: t("order.migrationInProgressDescription"),
        primaryCta: t("order.tryAgain"),
        primaryAction: OrderErrorAction.Retry,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "AdvertiserTempUnavailable":
      return {
        title: t("order.advertiserTempUnavailableTitle"),
        message: t("order.advertiserTempUnavailableDescription"),
        primaryCta: t("order.viewOtherAds"),
        primaryAction: OrderErrorAction.ViewOtherAds,
        secondaryCta: t("order.tryAgain"),
        secondaryAction: OrderErrorAction.Retry,
      }

    case "OrderAdvertiserFundsInsufficient":
      return {
        title: t("order.advertiserFundsInsufficientTitle"),
        message: t("order.advertiserFundsInsufficientDescription"),
        primaryCta: t("order.viewOtherAds"),
        primaryAction: OrderErrorAction.ViewOtherAds,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "v1WithdrawalLimit":
      return {
        title: t("order.withdrawalLimitTitle"),
        message: t("order.withdrawalLimitDescription"),
        primaryCta: t("order.verifyAccount"),
        primaryAction: OrderErrorAction.VerifyAccount,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    case "v1FinancialAssessmentRequired":
      return {
        title: t("order.financialAssessmentTitle"),
        message: t("order.financialAssessmentDescription"),
        primaryCta: t("order.completeAssessment"),
        primaryAction: OrderErrorAction.CompleteAssessment,
        secondaryCta: t("common.close"),
        secondaryAction: OrderErrorAction.Dismiss,
      }

    default:
      return {
        title: t("order.genericTitle"),
        message: code
          ? t("order.genericWithCodeMessage", { code })
          : t("order.genericMessage"),
        primaryCta: t("common.gotIt"),
        primaryAction: OrderErrorAction.Dismiss,
      }
  }
}
