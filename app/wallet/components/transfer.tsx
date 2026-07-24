"use client"
import Image from "next/image"
import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  fetchWalletsList,
  walletTransfer,
  fetchExchangeRate,
  walletExchangeTransfer,
  validateTransfer,
  type TransferValidateDetails,
} from "@/services/api/api-wallets"
import * as WalletsAPI from "@/services/api/api-wallets"
import { currencyLogoMapper, formatAmountWithDecimals, IS_TRANSFER_FEE_DISPLAY_ENABLED } from "@/lib/utils"
import { useCurrencies, queryKeys } from "@/hooks/use-api-queries"
import { getQueryClient } from "@/lib/react-query-client"
import WalletDisplay from "./wallet-display"
import ChooseCurrencyStep from "./choose-currency-step"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTrackers } from "@/analytics/useTrackers"
import { getWalletTransferRejectionInfo, type WalletTransferApiError, type WalletWithdrawalRejectionAmounts, type WalletWithdrawalRejectionCode, type WalletWithdrawalRejectionCta } from "@/lib/wallet-transfer"
import type { Transaction } from "../types"
import { InfoCircleIcon } from "@/components/icons/info-circle"
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TransferProps {
  currencySelected?: string
  onClose: () => void
  stepVal: string
  onViewDetails?: (transaction: Transaction) => void
}

interface Currency {
  code: string
  name: string
  logo: string
  label: string
}

interface ProcessedWallet {
  wallet_id: string
  name: string
  balance: string
  currency: string

  icon: string
  type: string
}

interface WalletData {
  id: string
  name: string
  currency: string
  balance: string
  type?: string
}


interface CurrencyData {
  type: "cryptocurrency" | "fiat" | "stablecoin"
  fee: {
    transfer: {
      crypto_percentage: number
      fiat_percentage: number
      stablecoin_percentage: number
    }
  }
  label: string
  decimal: {
    maximum: number
    minimum: number
  }
  limit: {
    transfer: {
      min_amount_per_transaction?: number
    }
  }
  [key: string]: any
}

interface CurrenciesResponse {
  [currencyCode: string]: CurrencyData
}

interface ExchangeRateData {
  source: string
  destination: string
  display_rate: string
  rate_token: string
  exchange_rate: string
}

interface TransferFeeCalculation {
  transferAmount: number
  transferFee: number
  youllReceive: number
  youllReceiveConverted: number
  feePercentage: number
}

type TransferStep = "chooseCurrency" | "enterAmount" | "success" | "unsuccessful"
type WalletSelectorType = "from" | "to" | null
type CurrencyToggleType = "source" | "destination"

export default function Transfer({ currencySelected, onClose, stepVal = "enterAmount", onViewDetails }: TransferProps) {
  const { t } = useTranslations()
  const { track } = useTrackers()
  const queryClient = getQueryClient()
  const { data: currenciesResponse, isLoading: isCurrenciesLoading } = useCurrencies()

  const [step, setStep] = useState<TransferStep>(stepVal)
  const [wallets, setWallets] = useState<ProcessedWallet[]>([])
  const [isWalletsLoading, setIsWalletsLoading] = useState(true)
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [currenciesData, setCurrenciesData] = useState<CurrenciesResponse | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(currencySelected || "USD")
  const [showMobileSheet, setShowMobileSheet] = useState<WalletSelectorType>(null)
  const [showDesktopWalletPopup, setShowDesktopWalletPopup] = useState<WalletSelectorType>(null)
  const [showMobileConfirmSheet, setShowMobileConfirmSheet] = useState(false)
  const [showDesktopConfirmPopup, setShowDesktopConfirmPopup] = useState(false)
  const [transferAmount, setTransferAmount] = useState<string | null>(null)
  const [sourceWalletData, setSourceWalletData] = useState<WalletData | null>(null)
  const [destinationWalletData, setDestinationWalletData] = useState<WalletData | null>(null)

  const [externalReferenceId, setExternalReferenceId] = useState<string | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [transferErrorMessage, setTransferErrorMessage] = useState<string | null>(null)
  const [transferRejectionCta, setTransferRejectionCta] = useState<WalletWithdrawalRejectionCta | null>(null)
  const [transferRejectionCode, setTransferRejectionCode] = useState<WalletWithdrawalRejectionCode | null>(null)
  const [transferRejectionAmounts, setTransferRejectionAmounts] = useState<WalletWithdrawalRejectionAmounts>({})

  const [exchangeRateData, setExchangeRateData] = useState<ExchangeRateData | null>(null)
  const [selectedAmountCurrency, setSelectedAmountCurrency] = useState<"source" | "destination">("source")
  const [countdown, setCountdown] = useState<number>(30)
  const [transferFeeCalculation, setTransferFeeCalculation] = useState<TransferFeeCalculation | null>(null)
  const [showCurrencySwitcher, setShowCurrencySwitcher] = useState(false)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasAutoSelectedRef = useRef(false)

  const [sourceMinAmount, setSourceMinAmount] = useState<number>(0)
  const [destinationMinAmount, setDestinationMinAmount] = useState<number>(0)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidatePreviewLoading, setIsValidatePreviewLoading] = useState(false)
  const [validateError, setValidateError] = useState<string | null>(null)
  const [transferValidateQuote, setTransferValidateQuote] = useState<TransferValidateDetails | null>(null)
  const [showAmountReceiveInfoSheet, setShowAmountReceiveInfoSheet] = useState(false)
  /** After info sheet closes on mobile, reopen Review confirm (never stack both sheets). */
  const [pendingMobileConfirmAfterInfo, setPendingMobileConfirmAfterInfo] = useState(false)
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null)
  const validateRequestIdRef = useRef(0)

  const toEnterAmount = () => setStep("enterAmount")
  const toConfirm = () => {
    if (window.innerWidth >= 768) {
      setShowAmountReceiveInfoSheet(false)
      setPendingMobileConfirmAfterInfo(false)
      setShowDesktopConfirmPopup(true)
      return
    }
    // Mobile: only one bottom sheet at a time — wait for info sheet to close first.
    if (showAmountReceiveInfoSheet) {
      setPendingMobileConfirmAfterInfo(true)
      return
    }
    setPendingMobileConfirmAfterInfo(false)
    setShowMobileConfirmSheet(true)
  }

  const openAmountReceiveInfoSheet = () => {
    if (!IS_TRANSFER_FEE_DISPLAY_ENABLED) return
    // Don't interrupt an in-flight transfer (confirm sheet would dismiss).
    if (isSubmitting) return
    if (showMobileConfirmSheet) {
      setShowMobileConfirmSheet(false)
      setPendingMobileConfirmAfterInfo(true)
    }
    setShowAmountReceiveInfoSheet(true)
  }

  const closeAmountReceiveInfoSheet = () => {
    setShowAmountReceiveInfoSheet(false)
    if (pendingMobileConfirmAfterInfo) {
      setPendingMobileConfirmAfterInfo(false)
      setShowMobileConfirmSheet(true)
    }
  }

  const hasTransferFee = (quote: TransferValidateDetails) => {
    const feePercentage = quote.fee?.percentage ?? 0
    const feeAmount = Number.parseFloat(quote.fee?.amount ?? "0") || 0
    return feePercentage > 0 || feeAmount > 0
  }

  const getAmountReceiveInfoBody = (quote: TransferValidateDetails) => {
    if (!hasTransferFee(quote)) {
      return t("wallet.amountReceiveInfoBodyFree")
    }
    const feeCurrency = quote.fee?.currency || quote.source?.currency || ""
    const feeAmount = formatAmountByCurrency(quote.fee?.amount ?? "0", feeCurrency)
    return t("wallet.amountReceiveInfoBody", {
      amount: feeAmount,
      currency: feeCurrency,
    })
  }
  const toSuccess = () => setStep("success")
  const toUnsuccessful = () => setStep("unsuccessful")
  const goBack = () => {
    if (step === "enterAmount") {
      // When the flow starts directly at enterAmount (TRANSFER via sidebar),
      // there is no chooseCurrency step to return to — close instead.
      if (stepVal === "enterAmount") onClose()
      else setStep("chooseCurrency")
    } else if (step === "chooseCurrency") {
      onClose()
    }
  }

  const handleCurrencySelect = (currency: string) => {
    setDestinationWalletData(null)
    if (sourceWalletData) {
      setSourceWalletData({
        id: sourceWalletData.id,
        name: sourceWalletData.name,
        currency: currency,
        balance: sourceWalletData.balance,
        type: sourceWalletData.type,
      })
    }
    setSelectedCurrency(currency)
    toEnterAmount()
  }

  useEffect(() => {
    if (!currenciesResponse) return

    const currencyList = Object.entries(currenciesResponse).map(([code, data]: [string, any]) => ({
      code,
      name: data.label,
      logo: currencyLogoMapper[code as keyof typeof currencyLogoMapper],
      label: data.label,
    }))
    setCurrencies(currencyList)
    setCurrenciesData(currenciesResponse as CurrenciesResponse)
  }, [currenciesResponse])

  useEffect(() => {
    if (!selectedCurrency || !currenciesData) {
      setIsWalletsLoading(true)
      return
    }

    const loadWallets = async () => {
      setIsWalletsLoading(true)
      try {
        const response = await fetchWalletsList()

        if (response?.data?.wallets) {
          const processedWallets: ProcessedWallet[] = []

          response.data.wallets.forEach((wallet: any) => {
            const isP2p = (wallet.type || "").toLowerCase() === "p2p"
            const currencyLabel = currenciesData?.[selectedCurrency]?.label || selectedCurrency
            const walletName = isP2p ? t("wallet.p2pWallet") : t("wallet.mainWallet")
            const balances = wallet.balances ?? []

            const currencyBalance = balances.find((b: any) => b.currency === selectedCurrency)

            processedWallets.push({
              wallet_id: wallet.wallet_id,
              name: walletName,
              balance: currencyBalance?.balance ?? "0",
              currency: selectedCurrency,

              icon: isP2p ? "/icons/p2p-black.png" : currencyLogoMapper[selectedCurrency as keyof typeof currencyLogoMapper],
              type: wallet.type,
            })
          })

          setWallets(processedWallets)

          const p2pWallet = processedWallets.find((w) => w.type?.toLowerCase() === "p2p")
          const nonP2pWallet = processedWallets.find((w) => w.type?.toLowerCase() !== "p2p")

          // Only auto-select on initial load — don't override user's manual selection.
          // P2P balance > 0 → From P2P, To Main. P2P balance 0 → From Main, To P2P.
          if (p2pWallet && !hasAutoSelectedRef.current) {
            hasAutoSelectedRef.current = true
            const p2pHasBalance = parseFloat(p2pWallet.balance) > 0
            const toWalletData = (wallet: ProcessedWallet): WalletData => ({
              id: wallet.wallet_id,
              name: wallet.name,
              currency: wallet.currency,
              balance: wallet.balance,
              type: wallet.type,
            })

            if (p2pHasBalance) {
              setSourceWalletData(toWalletData(p2pWallet))
              if (nonP2pWallet) {
                setDestinationWalletData(toWalletData(nonP2pWallet))
              }
            } else {
              setDestinationWalletData(toWalletData(p2pWallet))
              if (nonP2pWallet) {
                setSourceWalletData(toWalletData(nonP2pWallet))
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching wallets:", error)
      } finally {
        setIsWalletsLoading(false)
      }
    }

    loadWallets()
  }, [selectedCurrency, currenciesData])

  const isWalletSelectionLoading = isCurrenciesLoading || isWalletsLoading

  const calculateTransferFee = useCallback((): { feeAmount: number; feePercentage: number } | null => {
    if (!currenciesData || !sourceWalletData || !destinationWalletData || !transferAmount) {
      return null
    }

    if (sourceWalletData.currency === destinationWalletData.currency) {
      return null
    }

    const sourceCurrencyData = currenciesData[sourceWalletData.currency]
    const destinationCurrencyData = currenciesData[destinationWalletData.currency]

    if (!sourceCurrencyData || !destinationCurrencyData) {
      return null
    }

    const sourceType = sourceCurrencyData.type
    let feePercentage = 0

    if (sourceType === "cryptocurrency") {
      feePercentage = destinationCurrencyData.fee.transfer.crypto_percentage
    } else if (sourceType === "fiat") {
      feePercentage = destinationCurrencyData.fee.transfer.fiat_percentage
    } else if (sourceType === "stablecoin") {
      feePercentage = destinationCurrencyData.fee.transfer.stablecoin_percentage
    }

    if (feePercentage === 0) {
      return null
    }

    const amount = Number.parseFloat(transferAmount)
    const feeAmount = (amount * feePercentage) / 100

    return { feeAmount, feePercentage }
  }, [currenciesData, sourceWalletData, destinationWalletData, transferAmount])

  const calculateTransferFeeWithExchangeRate = useCallback((): TransferFeeCalculation | null => {
    if (!currenciesData || !sourceWalletData || !destinationWalletData || !transferAmount || !exchangeRateData) {
      return null
    }

    const feeInfo = calculateTransferFee()
    if (!feeInfo) return null

    const amount = Number.parseFloat(transferAmount)
    const exchangeRate = Number.parseFloat(exchangeRateData.exchange_rate)
    const fee = feeInfo.feePercentage

    let calculation: TransferFeeCalculation

    if (selectedAmountCurrency === "source") {
      const transferFee = amount * (fee / 100)

      const youllReceiveConverted = amount * (1 - fee / 100)
      const youllReceive = youllReceiveConverted * exchangeRate

      calculation = {
        transferAmount: amount,
        transferFee,
        youllReceive,
        youllReceiveConverted,
        feePercentage: fee,
      }
    } else {
      const transferFee = (amount / exchangeRate) * (fee / 100)
      const youllReceive = amount * (1 - fee / 100)
      const youllReceiveConverted = amount / exchangeRate - (amount / exchangeRate) * (fee / 100)

      calculation = {
        transferAmount: amount,
        transferFee,
        youllReceive,
        youllReceiveConverted,
        feePercentage: fee,
      }
    }

    return calculation
  }, [
    currenciesData,
    sourceWalletData,
    destinationWalletData,
    transferAmount,
    exchangeRateData,
    selectedAmountCurrency,
  ])

  const fetchAndSetExchangeRate = useCallback(async () => {
    if (!sourceWalletData || !destinationWalletData) return
    if (sourceWalletData.currency === destinationWalletData.currency) {
      setExchangeRateData(null)
      return
    }

    const feeInfo = calculateTransferFee()
    if (!feeInfo) {
      setExchangeRateData(null)
      return
    }

    try {
      const response = await fetchExchangeRate({
        source_currency: sourceWalletData.currency,
        destination_currency: destinationWalletData.currency,
      })

      if (response?.data) {
        setExchangeRateData(response.data)
        setCountdown(30)

        if (response.data.source === "USD") {
          setSourceMinAmount(1)
          setDestinationMinAmount(Number.parseFloat(response.data.exchange_rate))
        } else if (response.data.destination === "USD") {
          setDestinationMinAmount(1)
          setSourceMinAmount(Number.parseFloat(response.data.exchange_rate))
        }

        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
        }

        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              fetchAndSetExchangeRate()
              return 30
            }
            return prev - 1
          })
        }, 1000)
      }
    } catch (error) {
      console.error("Error fetching exchange rate:", error)
    }
  }, [sourceWalletData, destinationWalletData, calculateTransferFee])

  useEffect(() => {
    if (!sourceWalletData || !destinationWalletData || !currenciesData) {
      setShowCurrencySwitcher(false)
      setExchangeRateData(null)
      return
    }

    const sourceCurrencyData = currenciesData[sourceWalletData.currency]
    const destinationCurrencyData = currenciesData[destinationWalletData.currency]

    if (!sourceCurrencyData || !destinationCurrencyData) {
      setShowCurrencySwitcher(false)
      setExchangeRateData(null)
      return
    }


    if (sourceWalletData.currency === destinationWalletData.currency) {
      setShowCurrencySwitcher(false)
      setExchangeRateData(null)
      return
    }

    const sourceType = sourceCurrencyData.type
    let feePercentage = 0

    if (sourceType === "cryptocurrency") {
      feePercentage = destinationCurrencyData.fee.transfer.crypto_percentage
    } else if (sourceType === "fiat") {
      feePercentage = destinationCurrencyData.fee.transfer.fiat_percentage
    } else if (sourceType === "stablecoin") {
      feePercentage = destinationCurrencyData.fee.transfer.stablecoin_percentage
    }

    const hasFee = feePercentage > 0

    if (hasFee) {
      setShowCurrencySwitcher(true)
      fetchAndSetExchangeRate()
    } else {
      setShowCurrencySwitcher(false)
      setExchangeRateData(null)
    }
  }, [sourceWalletData, destinationWalletData, currenciesData, fetchAndSetExchangeRate])



  useEffect(() => {
    const calculation = calculateTransferFeeWithExchangeRate()
    setTransferFeeCalculation(calculation)
  }, [calculateTransferFeeWithExchangeRate])

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])

  const fetchTransferValidateQuote = useCallback(async (): Promise<TransferValidateDetails | null> => {
    if (!transferAmount || !sourceWalletData || !destinationWalletData) {
      return null
    }

    const result = await validateTransfer({
      source_type: (sourceWalletData.type || "main").toLowerCase(),
      destination_type: (destinationWalletData.type || "main").toLowerCase(),
      amount: transferAmount,
      balance: String(sourceWalletData.balance ?? "0"),
      source_id: sourceWalletData.id,
      destination_id: destinationWalletData.id,
      source_currency: sourceWalletData.currency,
      destination_currency: destinationWalletData.currency,
    })

    const apiError = result?.errors?.[0]
    if (apiError || !result?.data?.is_valid || !result?.data?.details) {
      const minUsd = apiError?.details?.min_amount_usd
      if (minUsd !== undefined && minUsd > 0) {
        const amountInUsd = apiError?.details?.amount_in_usd ?? 0
        const amountInSource = Number(apiError?.details?.amount) || 0
        if (amountInUsd > 0 && amountInSource > 0) {
          setSourceMinAmount((minUsd * amountInSource) / amountInUsd)
          // Return null so validateError stays blank; isAmountValid will become
          // false on the next render and show the inline minimum-amount message.
          return null
        }
        // Conversion ratio unavailable — fall through to throw so the API's
        // own descriptive message appears via validateError instead of a
        // raw USD value displayed in the wrong currency.
      }
      throw new Error(apiError?.message || t("wallet.transferValidateFailed"))
    }

    return result.data.details
  }, [transferAmount, sourceWalletData, destinationWalletData, t])

  useEffect(() => {
    // Keep validate quote on success/unsuccessful — success copy uses
    // destination.amount (You'll receive). Clearing here falls back to gross.
    if (step === "success" || step === "unsuccessful") {
      setIsValidatePreviewLoading(false)
      return
    }

    // Fee display off: do not call transfer validate API.
    if (!IS_TRANSFER_FEE_DISPLAY_ENABLED) {
      validateRequestIdRef.current += 1
      setIsValidatePreviewLoading(false)
      setTransferValidateQuote(null)
      setValidateError(null)
      return
    }

    if (
      step !== "enterAmount" ||
      !transferAmount ||
      transferAmount.trim() === "" ||
      !sourceWalletData ||
      !destinationWalletData ||
      !isAmountValid(transferAmount)
    ) {
      validateRequestIdRef.current += 1
      setIsValidatePreviewLoading(false)
      setTransferValidateQuote(null)
      return
    }

    const requestId = ++validateRequestIdRef.current
    setIsValidatePreviewLoading(true)
    setValidateError(null)

    const timer = window.setTimeout(async () => {
      try {
        const details = await fetchTransferValidateQuote()
        if (requestId !== validateRequestIdRef.current) return
        setTransferValidateQuote(details)
      } catch (error) {
        if (requestId !== validateRequestIdRef.current) return
        setTransferValidateQuote(null)
        setValidateError(
          error instanceof Error && error.message
            ? error.message
            : t("wallet.transferValidateFailed"),
        )
      } finally {
        if (requestId === validateRequestIdRef.current) {
          setIsValidatePreviewLoading(false)
        }
      }
    }, 400)

    return () => {
      window.clearTimeout(timer)
    }
    // isAmountValid reads current wallet/currency state; deps cover those inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional debounce on amount/wallets
  }, [
    step,
    transferAmount,
    sourceWalletData?.id,
    sourceWalletData?.balance,
    sourceWalletData?.currency,
    sourceWalletData?.type,
    destinationWalletData?.id,
    destinationWalletData?.currency,
    destinationWalletData?.type,
    fetchTransferValidateQuote,
    t,
  ])

  const handleTransferClick = () => {
    track("ek_transfer_transfer")
    if (!transferAmount || !sourceWalletData || !destinationWalletData) {
      return
    }
    if (IS_TRANSFER_FEE_DISPLAY_ENABLED && !transferValidateQuote) {
      return
    }
    setValidateError(null)
    toConfirm()
  }

  const handleTransferFailure = (
    errorObj: WalletTransferApiError | null,
    overrideMessage?: string,
    overrideErrorCode?: string,
  ) => {
    const rejectionInfo = errorObj ? getWalletTransferRejectionInfo(errorObj) : null
    const errorMessage = overrideMessage || rejectionInfo?.message || errorObj?.message || t("wallet.transferErrorDuring")
    setTransferErrorMessage(errorMessage)
    setTransferRejectionCta(rejectionInfo?.cta ?? null)
    setTransferRejectionCode(rejectionInfo?.code ?? null)
    setTransferRejectionAmounts(rejectionInfo?.amounts ?? {})
    setShowDesktopConfirmPopup(false)
    setShowMobileConfirmSheet(false)
    setShowAmountReceiveInfoSheet(false)
    setPendingMobileConfirmAfterInfo(false)
    track("ek_transfer_failed_confirm_transfer_sheet", {
      error_code: overrideErrorCode ?? rejectionInfo?.code ?? "transfer_failed",
      error_message: errorMessage,
    })
    toUnsuccessful()
  }

  const handleTransferSuccess = (data: any) => {
    if (data?.external_reference_id) {
      setExternalReferenceId(data.external_reference_id)
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.totalBalance() })
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all })
    setShowDesktopConfirmPopup(false)
    setShowMobileConfirmSheet(false)
    setShowAmountReceiveInfoSheet(false)
    setPendingMobileConfirmAfterInfo(false)
    track("ek_transfer_successful_confirm_transfer_sheet")
    toSuccess()
  }

  const handleConfirmTransfer = async () => {
    if (!transferAmount || !sourceWalletData || !destinationWalletData) {
      console.error("Missing required transfer data")
      return
    }

    track("ek_confirm_transfer_confirm_transfer_sheet")
    setIsSubmitting(true)

    try {
      const generatedRequestId = crypto.randomUUID()
      setRequestId(generatedRequestId)

      const isSameWallet = sourceWalletData.id === destinationWalletData.id

      let result

      if (isSameWallet) {
        if (!exchangeRateData) {
          console.error("Exchange rate data is required for same-wallet transfers")
          setIsSubmitting(false)
          return
        }

        const exchangeParams = {
          amount: transferAmount,
          source_currency: sourceWalletData.currency,
          destination_wallet_id: destinationWalletData.id,
          request_id: generatedRequestId,
          source_wallet_id: sourceWalletData.id,
          destination_currency: destinationWalletData.currency,
          rate_token: exchangeRateData.rate_token,
          exchange_rate: exchangeRateData.exchange_rate,
        }

        result = await walletExchangeTransfer(exchangeParams)
      } else {
        const transferParams = {
          amount: transferAmount,
          currency: selectedCurrency || "USD",
          destination_wallet_id: destinationWalletData.id,
          request_id: generatedRequestId,
          source_wallet_id: sourceWalletData.id,
        }

        result = await walletTransfer(transferParams)
      }

      if (result?.errors?.length > 0) {
        handleTransferFailure(result.errors[0])
      } else if (result?.data?.errors?.length > 0) {
        handleTransferFailure(result.data.errors[0])
      } else if (result?.data) {
        handleTransferSuccess(result.data)
      } else {
        handleTransferFailure(null)
      }
    } catch (error) {
      console.error("Error during transfer:", error)
      handleTransferFailure(null, t("wallet.transferUnexpectedError"), "network_error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewDetails = async () => {
    if (!requestId) {
      console.error("No request ID available")
      return
    }

    try {
      const response = await queryClient.fetchQuery({
        queryKey: queryKeys.wallet.transaction(requestId),
        queryFn: () => WalletsAPI.fetchTransactionByReferenceId(requestId),
        staleTime: 1000 * 60 * 5,
      })

      if (response?.data?.transactions && response.data.transactions.length > 0) {
        const transaction = response.data.transactions[0]
        onViewDetails?.(transaction)
        onClose()
      } else {
        console.error("Transaction not found with reference_id:", requestId)
      }
    } catch (error) {
      console.error("Error fetching transaction details:", error)
    }
  }

  const handleDoneClick = () => {
    setStep("chooseCurrency")
    setTransferAmount(null)
    setSourceWalletData(null)
    setDestinationWalletData(null)
    setSelectedCurrency(null)
    setExternalReferenceId(null)
    setRequestId(null)
    setTransferErrorMessage(null)
    setTransferRejectionCta(null)

    onClose()
  }

  const handleOpenLiveChat = () => {
    if (typeof window !== "undefined" && (window as any).Intercom) {
      ;(window as any).Intercom("show")
    }
  }

  const handleWalletSelect = (wallet: ProcessedWallet, type: WalletSelectorType) => {
    track("ek_select_wallet_wallet_selector_sheet", { wallet_currency: wallet.currency })
    if (type === "from") {
      setSourceWalletData({
        id: wallet.wallet_id,
        name: wallet.name,
        currency: wallet.currency,
        balance: wallet.balance,
        type: wallet.type,
      })
    } else if (type === "to") {
      setDestinationWalletData({
        id: wallet.wallet_id,
        name: wallet.name,
        currency: wallet.currency,
        balance: wallet.balance,
        type: wallet.type,
      })
    }

    setTransferAmount("")
    setSelectedAmountCurrency("source")
    setValidateError(null)
    setTransferValidateQuote(null)
    setSourceMinAmount(0)
    setDestinationMinAmount(0)

    setShowMobileSheet(null)
    setShowDesktopWalletPopup(null)
  }

  const handleInterchange = () => {
    track("ek_swap_wallets_transfer")
    const tempSource = sourceWalletData
    setSourceWalletData(destinationWalletData)
    setDestinationWalletData(tempSource)

    setTransferAmount("")
    setSelectedAmountCurrency("source")
    setValidateError(null)
    setTransferValidateQuote(null)
    setSourceMinAmount(0)
    setDestinationMinAmount(0)
  }

  const formatAmountByCurrency = useCallback(
    (amount: number | string, currencyCode: string): string => {
      if (!currenciesData) return formatAmountWithDecimals(amount)

      const currencyData = currenciesData[currencyCode]
      if (!currencyData?.decimal?.maximum) return formatAmountWithDecimals(amount)

      const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
      if (isNaN(numAmount)) return "0.00"

      return numAmount.toFixed(currencyData.decimal.maximum)
    },
    [currenciesData],
  )

  const getSourceWalletBalance = (): number => {
    const wallet = wallets.find((w) => w.wallet_id === sourceWalletData?.id)
    return wallet ? Number.parseFloat(wallet.balance) : 0
  }

  const getDecimalPlaces = (value: string): number => {
    const decimalPart = value.split(".")[1]
    return decimalPart ? decimalPart.length : 0
  }

  const getDecimalConstraints = (): { minimum: number; maximum: number } | null => {
    if (!selectedCurrency || !currenciesData) return null
    const currencyData = currenciesData[selectedCurrency]
    return currencyData?.decimal || null
  }

  const isAmountValid = (amount: string): boolean => {
    const numAmount = Number.parseFloat(amount)
    const sourceBalance = getSourceWalletBalance()
    const effectiveMinAmount =
      selectedAmountCurrency === "source" ? sourceMinAmount : destinationMinAmount

    if (!isNaN(numAmount) && effectiveMinAmount > 0) {
      return numAmount > 0 && numAmount >= effectiveMinAmount && numAmount <= sourceBalance
    }

    return !isNaN(numAmount) && numAmount > 0 && numAmount <= sourceBalance
  }

  const getAmountErrorMessage = (): string => {
    if (!transferAmount) return ""

    const numAmount = Number.parseFloat(transferAmount)
    const sourceBalance = getSourceWalletBalance()

    const effectiveMinAmount = selectedAmountCurrency === "source" ? sourceMinAmount : destinationMinAmount
    const effectiveCurrency =
      selectedAmountCurrency === "source" ? sourceWalletData?.currency : destinationWalletData?.currency

    if (numAmount < effectiveMinAmount && effectiveMinAmount > 0) {
      return t("wallet.minimumTransferAmount", {
        amount: formatAmountByCurrency(effectiveMinAmount, effectiveCurrency || selectedCurrency || "USD"),
        currency: effectiveCurrency || "",
      })
    }

    if (numAmount > sourceBalance) {
      return t("wallet.exceedsBalance", {
        amount: formatAmountWithDecimals(sourceBalance.toString()),
        currency: selectedCurrency || "USD",
      })
    }

    return ""
  }

  const getSourceWalletAmount = (): string => {
    return sourceWalletData ? `${formatAmountWithDecimals(sourceWalletData.balance)} ${sourceWalletData.currency}` : ""
  }

  const getDestinationWalletAmount = (): string => {
    return destinationWalletData
      ? `${formatAmountWithDecimals(destinationWalletData.balance)} ${destinationWalletData.currency}`
      : ""
  }

  const getFilteredWallets = (type: WalletSelectorType) => {
    if (type === "from" && destinationWalletData) {
      return wallets.filter((w) => w.wallet_id !== destinationWalletData.id)
    }

    if (type === "to" && sourceWalletData) {
      return wallets.filter((w) => w.wallet_id !== sourceWalletData.id)
    }

    return wallets
  }

  const renderWalletPickerSkeletons = () => (
    <div data-testid="transfer-wallet-picker-skeleton" className="space-y-4">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="h-[76px] px-4 py-2 flex items-center self-stretch rounded-lg bg-grayscale-500"
        >
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0 bg-grayscale-200" />
          <div className="flex-1 ms-4 space-y-2">
            <Skeleton className="h-4 w-32 bg-grayscale-200" />
            <Skeleton className="h-3 w-20 bg-grayscale-200" />
          </div>
        </div>
      ))}
    </div>
  )

  const renderWalletAccountCardSkeleton = (label: string) => (
    <>
      <div className="absolute top-4 start-6 flex flex-col items-start gap-1.5">
        <div className="text-grayscale-text-muted text-base font-normal">{label}</div>
        <Skeleton className="h-6 w-6 rounded-full mt-1 bg-grayscale-200" />
      </div>
      <div className="flex-1 min-w-0 mt-6 ms-10 pe-8 text-start space-y-2">
        <Skeleton className="h-5 w-36 bg-grayscale-200" />
        <Skeleton className="h-4 w-24 bg-grayscale-200" />
      </div>
    </>
  )

  /** Confirm From/To icons — P2P sized slightly above flat currency (28 vs 24). */
  const renderConfirmWalletIcon = (wallet: { type?: string; currency: string }) => {
    if (wallet.type?.toLowerCase() === "p2p") {
      return (
        <div className="relative w-7 h-7 flex-shrink-0">
          <Image
            src="/icons/p2p-black.png"
            alt={t("common.p2p")}
            width={28}
            height={28}
            className="w-7 h-7 rounded-full"
          />
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center">
              <Image
                src={getCurrencyImage(wallet.currency)}
                alt={wallet.currency}
                width={12}
                height={12}
                className="w-3 h-3 rounded-full"
              />
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
        <Image
          src={getCurrencyImage(wallet.currency)}
          alt={wallet.currency}
          width={24}
          height={24}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  const renderMobileSheet = (type: WalletSelectorType) => {
    if (showMobileSheet !== type) return null

    const title = type === "from" ? t("wallet.from") : t("wallet.to")
    const selectedWalletName = type === "from" ? sourceWalletData?.name : destinationWalletData?.name

    const filteredWallets = getFilteredWallets(type)
    const p2pWallets = filteredWallets.filter((w) => w.type?.toLowerCase() === "p2p")
    const tradingWallets = filteredWallets.filter((w) => w.type?.toLowerCase() !== "p2p")

    return (
      <div
        data-testid="transfer-sheet-wallet-picker"
        className="fixed inset-0 bg-black/50 z-50 md:hidden animate-in fade-in-0 duration-200"
        onClick={() => setShowMobileSheet(null)}
      >
        <div
          className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4">
            <div className="flex justify-center mb-4">
              <div data-testid="transfer-sheet-wallet-picker-grip" className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>
            <h2 className="text-slate-1200 text-[20px] font-extrabold mb-6 text-center">{title}</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {isWalletSelectionLoading ? (
                renderWalletPickerSkeletons()
              ) : (
                <>
                  {p2pWallets.length > 0 && (
                    <>
                      <h3 className="text-base font-normal text-slate-1200">{t("wallet.p2pWallet")}</h3>
                      {p2pWallets.map((wallet) => (
                        <div
                          key={wallet.wallet_id}
                          data-testid={`transfer-btn-wallet-${wallet.wallet_id ?? wallet.currency}`}
                          className="cursor-pointer"
                          onClick={() => {
                            handleWalletSelect(wallet, type)
                            setShowMobileSheet(null)
                          }}
                        >
                          <WalletDisplay
                            name={wallet.name}
                            amount={formatAmountWithDecimals(wallet.balance)}
                            currency={wallet.currency}
                            isP2PWallet={wallet.type?.toLowerCase() === "p2p"}
                            isSelected={selectedWalletName === wallet.name}
                            onClick={() => { }}
                          />
                        </div>
                      ))}
                    </>
                  )}
                  {tradingWallets.length > 0 && (
                    <>
                      <h3 className="text-base font-normal text-slate-1200 mt-2">{t("wallet.tradingWallet")}</h3>
                      {tradingWallets.map((wallet) => (
                        <div
                          key={wallet.wallet_id}
                          data-testid={`transfer-btn-wallet-${wallet.wallet_id ?? wallet.currency}`}
                          className="cursor-pointer"
                          onClick={() => {
                            handleWalletSelect(wallet, type)
                            setShowMobileSheet(null)
                          }}
                        >
                          <WalletDisplay
                            name={wallet.name}
                            amount={formatAmountWithDecimals(wallet.balance)}
                            currency={wallet.currency}
                            isP2PWallet={wallet.type?.toLowerCase() === "p2p"}
                            isSelected={selectedWalletName === wallet.name}
                            onClick={() => { }}
                          />
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderDesktopWalletPopup = (type: WalletSelectorType) => {
    if (showDesktopWalletPopup !== type) return null

    const title = type === "from" ? t("wallet.from") : t("wallet.to")
    const selectedWalletName = type === "from" ? sourceWalletData?.name : destinationWalletData?.name

    const filteredWallets = getFilteredWallets(type)
    const p2pWallets = filteredWallets.filter((w) => w.type?.toLowerCase() === "p2p")
    const tradingWallets = filteredWallets.filter((w) => w.type?.toLowerCase() !== "p2p")

    return (
      <div
        className="fixed inset-0 bg-black/50 z-50 hidden md:flex items-center justify-center"
        onClick={() => setShowDesktopWalletPopup(null)}
      >
        <div
          className="bg-white rounded-[32px] w-[512px] min-w-[512px] max-w-[512px] max-h-[80vh] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            data-testid="transfer-sheet-wallet-picker-btn-close"
            variant="ghost"
            size="default"
            className="absolute top-4 end-4 min-w-0 px-0"
            onClick={() => setShowDesktopWalletPopup(null)}
            aria-label={t("common.close")}
          >
            <Image src="/icons/button-close.png" alt={t("common.close")} width={48} height={48} />
          </Button>
          <div className="p-8">
            <h2 className="text-slate-1200 text-[24px] font-extrabold mb-6">{title}</h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {isWalletSelectionLoading ? (
                renderWalletPickerSkeletons()
              ) : (
                <>
                  {p2pWallets.length > 0 && (
                    <>
                      <h3 className="text-base font-normal text-slate-1200">{t("wallet.p2pWallet")}</h3>
                      {p2pWallets.map((wallet) => (
                        <div
                          key={wallet.wallet_id}
                          data-testid={`transfer-btn-wallet-${wallet.wallet_id ?? wallet.currency}`}
                          className="cursor-pointer"
                          onClick={() => {
                            handleWalletSelect(wallet, type)
                            setShowDesktopWalletPopup(null)
                          }}
                        >
                          <WalletDisplay
                            name={wallet.name}
                            amount={formatAmountWithDecimals(wallet.balance)}
                            currency={wallet.currency}
                            isP2PWallet={wallet.type?.toLowerCase() === "p2p"}
                            isSelected={selectedWalletName === wallet.name}
                            onClick={() => { }}
                          />
                        </div>
                      ))}
                    </>
                  )}
                  {tradingWallets.length > 0 && (
                    <>
                      <h3 className="text-base font-normal text-slate-1200 mt-2">{t("wallet.tradingWallet")}</h3>
                      {tradingWallets.map((wallet) => (
                        <div
                          key={wallet.wallet_id}
                          data-testid={`transfer-btn-wallet-${wallet.wallet_id ?? wallet.currency}`}
                          className="cursor-pointer"
                          onClick={() => {
                            handleWalletSelect(wallet, type)
                            setShowDesktopWalletPopup(null)
                          }}
                        >
                          <WalletDisplay
                            name={wallet.name}
                            amount={formatAmountWithDecimals(wallet.balance)}
                            currency={wallet.currency}
                            isP2PWallet={wallet.type?.toLowerCase() === "p2p"}
                            isSelected={selectedWalletName === wallet.name}
                            onClick={() => { }}
                          />
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderYoullReceiveInfoControl = () => {
    if (!IS_TRANSFER_FEE_DISPLAY_ENABLED) return null
    if (!transferValidateQuote || !hasTransferFee(transferValidateQuote)) return null

    const infoBody = getAmountReceiveInfoBody(transferValidateQuote)
    const infoIconClassName = "size-[1.5rem] h-[1.5rem] w-[1.5rem]"
    const infoButtonClassName =
      "size-[1.5rem] h-[1.5rem] w-[1.5rem] min-h-[1.5rem] max-h-[1.5rem] min-w-[1.5rem] max-w-[1.5rem] p-0 text-grayscale-text-muted hover:text-slate-1200 hover:bg-transparent disabled:opacity-40 disabled:pointer-events-none [&_svg]:!size-[1.5rem] [&_svg]:!h-[1.5rem] [&_svg]:!w-[1.5rem]"

    return (
      <>
        <div className="hidden md:inline-flex">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  data-testid="transfer-btn-amount-receive-info"
                  className={infoButtonClassName}
                  aria-label={t("wallet.amountReceiveInfoTitle")}
                  disabled={isSubmitting}
                >
                  <InfoCircleIcon className={infoIconClassName} />
                </Button>
              </TooltipTrigger>
              {!isSubmitting && (
                <TooltipContent className="max-w-[296px] text-white/70">
                  <p>{infoBody}</p>
                  <TooltipArrow className="fill-black" />
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-testid="transfer-btn-amount-receive-info-mobile"
          className={`inline-flex md:hidden ${infoButtonClassName}`}
          aria-label={t("wallet.amountReceiveInfoTitle")}
          disabled={isSubmitting}
          onClick={(e) => {
            e.stopPropagation()
            if (isSubmitting) return
            openAmountReceiveInfoSheet()
          }}
        >
          <InfoCircleIcon className={infoIconClassName} />
        </Button>
      </>
    )
  }

  /** You'll receive when fee display is off — entered amount (no validate / no fee). */
  const getEnteredReceiveDisplay = () => {
    if (!transferAmount || !sourceWalletData || !destinationWalletData) return null
    const amount = Number.parseFloat(transferAmount)
    if (!Number.isFinite(amount)) return null

    const sameCurrency = sourceWalletData.currency === destinationWalletData.currency
    if (sameCurrency) {
      return `${formatAmountWithDecimals(amount)} ${sourceWalletData.currency}`
    }

    // Cross-currency: convert without fee when exchange rate is available.
    const rate = Number.parseFloat(exchangeRateData?.exchange_rate || exchangeRateData?.display_rate || "")
    if (!Number.isFinite(rate) || rate <= 0) {
      return `${formatAmountWithDecimals(amount)} ${
        selectedAmountCurrency === "source" ? sourceWalletData.currency : destinationWalletData.currency
      }`
    }
    if (selectedAmountCurrency === "source") {
      return `${formatAmountWithDecimals(amount * rate)} ${destinationWalletData.currency}`
    }
    return `${formatAmountWithDecimals(amount)} ${destinationWalletData.currency}`
  }

  const getQuotedReceiveDisplay = () => {
    if (!IS_TRANSFER_FEE_DISPLAY_ENABLED) return getEnteredReceiveDisplay()
    const receiveCurrency =
      transferValidateQuote?.destination?.currency || destinationWalletData?.currency || selectedCurrency || "USD"
    if (!transferValidateQuote?.destination?.amount) {
      return isValidatePreviewLoading ? "-" : null
    }
    return `${formatAmountWithDecimals(Number.parseFloat(transferValidateQuote.destination.amount))} ${receiveCurrency}`
  }

  const renderConfirmAmountRows = ({
    fullBleedSeparators = false,
  }: {
    fullBleedSeparators?: boolean
  } = {}) => {
    const transferCurrency =
      transferValidateQuote?.source?.currency || sourceWalletData?.currency || selectedCurrency || "USD"
    const receiveDisplay =
      getQuotedReceiveDisplay() ||
      `${formatAmountWithDecimals(Number.parseFloat(transferAmount || "0"))} ${transferCurrency}`

    const separatorClass = fullBleedSeparators
      ? "h-1 w-full bg-slate-75"
      : "h-px w-full bg-grayscale-200"
    const rowPaddingClass = fullBleedSeparators ? "px-6 py-4" : "py-4"

    return (
      <>
        <div className={`${separatorClass} mt-4`} />
        <div className={rowPaddingClass}>
          <div className="flex items-center justify-between w-full gap-4">
            <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.transferAmount")}</span>
            <span className="text-base font-normal text-slate-1200 text-end">
              {formatAmountWithDecimals(Number.parseFloat(transferAmount || "0"))} {transferCurrency}
            </span>
          </div>
        </div>
        <div className={separatorClass} />
        <div className={rowPaddingClass}>
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base font-normal text-grayscale-text-muted whitespace-nowrap">
                {t("wallet.youllReceive")}
              </span>
              {renderYoullReceiveInfoControl()}
            </div>
            <span className="text-base font-normal text-slate-1200 text-end">{receiveDisplay}</span>
          </div>
        </div>
        <div className={separatorClass} />
      </>
    )
  }

  const renderEnterAmountYoullReceive = () => {
    if (!transferAmount || transferAmount.trim() === "" || !isAmountValid(transferAmount)) {
      return null
    }

    const receiveDisplay = getQuotedReceiveDisplay()
    if (IS_TRANSFER_FEE_DISPLAY_ENABLED && !receiveDisplay && !isValidatePreviewLoading) {
      return null
    }

    return (
      <div
        data-testid="transfer-youll-receive-preview"
        className="flex items-center justify-between w-full gap-3"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-normal text-grayscale-text-muted whitespace-nowrap">
            {t("wallet.youllReceive")}
          </span>
          {IS_TRANSFER_FEE_DISPLAY_ENABLED &&
            transferValidateQuote &&
            renderYoullReceiveInfoControl()}
        </div>
        <span
          className={`text-sm font-normal text-end ${
            receiveDisplay && receiveDisplay !== "-" ? "text-slate-1200" : "text-grayscale-text-muted"
          }`}
        >
          {receiveDisplay || "-"}
        </span>
      </div>
    )
  }

  const renderAmountReceiveInfoSheet = () => {
    if (!IS_TRANSFER_FEE_DISPLAY_ENABLED) return null
    if (!showAmountReceiveInfoSheet || !transferValidateQuote) return null

    return (
      <div
        data-testid="transfer-sheet-amount-receive-info"
        className="fixed inset-0 bg-black/50 z-[60] md:hidden animate-in fade-in-0 duration-200"
        onClick={closeAmountReceiveInfoSheet}
      >
        <div
          className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pt-2 px-6 pb-8">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>
            <h2 className="text-slate-1200 text-[24px] font-extrabold mb-4 text-start">
              {t("wallet.amountReceiveInfoTitle")}
            </h2>
            <p className="text-base font-normal text-grayscale-600 mb-8 text-start">
              {getAmountReceiveInfoBody(transferValidateQuote)}
            </p>
            <Button
              data-testid="transfer-btn-amount-receive-info-got-it"
              onClick={closeAmountReceiveInfoSheet}
              className="w-full h-12"
            >
              {t("wallet.gotIt")}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const renderDesktopConfirmPopup = () => {
    if (!showDesktopConfirmPopup) return null

    return (
      <div
        data-testid="transfer-sheet-confirm"
        className="fixed inset-0 bg-black/50 z-50 hidden md:flex items-center justify-center"
        onClick={() => {
          setShowDesktopConfirmPopup(false)
          setShowAmountReceiveInfoSheet(false)
          setPendingMobileConfirmAfterInfo(false)
        }}
      >
        <div
          className="bg-white rounded-[32px] w-[512px] min-w-[512px] max-w-[512px] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            data-testid="transfer-sheet-confirm-btn-close"
            variant="ghost"
            size="default"
            className="absolute top-4 end-4 min-w-0 px-0"
            onClick={() => {
              setShowDesktopConfirmPopup(false)
              setShowAmountReceiveInfoSheet(false)
              setPendingMobileConfirmAfterInfo(false)
            }}
            aria-label={t("common.close")}
          >
            <Image src="/icons/button-close.png" alt={t("common.close")} width={48} height={48} />
          </Button>
          <div className="p-8">
            <h2 className="text-slate-1200 text-[24px] font-extrabold mb-8 text-start pe-10">
              {t("wallet.reviewAndConfirm")}
            </h2>
            <div className="mb-6">
              <div className="mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.from")}</span>
                  <div className="flex items-center gap-3">
                    {sourceWalletData && renderConfirmWalletIcon(sourceWalletData)}
                    <span className="text-base font-normal text-slate-1200">{sourceWalletData?.name}</span>
                  </div>
                </div>
              </div>
              <div className="mb-0">
                <div className="flex items-center justify-between">
                  <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.to")}</span>
                  <div className="flex items-center gap-3">
                    {destinationWalletData && renderConfirmWalletIcon(destinationWalletData)}
                    <span className="text-base font-normal text-slate-1200">{destinationWalletData?.name}</span>
                  </div>
                </div>
              </div>

              {renderConfirmAmountRows()}
            </div>
            <div className="space-y-2 mt-12">
              <Button
                data-testid="transfer-btn-confirm"
                onClick={handleConfirmTransfer}
                disabled={
                  isSubmitting ||
                  (IS_TRANSFER_FEE_DISPLAY_ENABLED && !transferValidateQuote)
                }
                className="w-full h-12 min-h-12 max-h-12 px-7 flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <Image src="/icons/spinner.png" alt={t("common.loading")} width={20} height={20} className="animate-spin" />
                ) : (
                  t("common.confirm")
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderMobileConfirmSheet = () => {
    // Never stack with the amount-receive info sheet — reopen after info closes.
    if (!showMobileConfirmSheet || showAmountReceiveInfoSheet) return null

    return (
      <div
        data-testid="transfer-sheet-confirm"
        className="fixed inset-0 bg-black/50 z-50 md:hidden animate-in fade-in-0 duration-200"
        onClick={() => {
          setShowMobileConfirmSheet(false)
          setShowAmountReceiveInfoSheet(false)
          setPendingMobileConfirmAfterInfo(false)
        }}
      >
        <div
          className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative pt-2 pb-8">
            <div className="flex justify-center mb-6">
              <div data-testid="transfer-sheet-confirm-grip" className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>
            <h1 className="text-slate-1200 text-start text-[24px] font-extrabold px-6 mb-6">
              {t("wallet.reviewAndConfirm")}
            </h1>
            <div className="px-6 flex flex-col gap-2 mb-0">
              <div className="flex items-center justify-between">
                <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.from")}</span>
                <div className="flex items-center gap-3">
                  {sourceWalletData && renderConfirmWalletIcon(sourceWalletData)}
                  <span className="text-base font-normal text-slate-1200">{sourceWalletData?.name}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base font-normal text-grayscale-text-muted">{t("wallet.to")}</span>
                <div className="flex items-center gap-3">
                  {destinationWalletData && renderConfirmWalletIcon(destinationWalletData)}
                  <span className="text-base font-normal text-slate-1200">{destinationWalletData?.name}</span>
                </div>
              </div>
            </div>

            {renderConfirmAmountRows({ fullBleedSeparators: true })}

            <div className="px-6 mt-8">
              <Button
                data-testid="transfer-btn-confirm"
                onClick={handleConfirmTransfer}
                disabled={
                  isSubmitting ||
                  (IS_TRANSFER_FEE_DISPLAY_ENABLED && !transferValidateQuote)
                }
                className="w-full h-12 min-w-24 min-h-12 max-h-12 px-7 flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <Image src="/icons/spinner.png" alt={t("common.loading")} width={20} height={20} className="animate-spin" />
                ) : (
                  t("common.confirm")
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getCurrencyImage = (currency: string) => {
    return currencyLogoMapper[currency as keyof typeof currencyLogoMapper]
  }

  const getSourceWalletCurrency = () => {
    const wallet = wallets.find((w) => w.wallet_id === sourceWalletData?.id)
    return wallet?.currency || ""
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setValidateError(null)
    setTransferValidateQuote(null)

    if (value === "") {
      setTransferAmount("")
      setSelectedPercentage(null)
      return
    }

    const decimalConstraints = getDecimalConstraints()
    if (decimalConstraints) {
      const decimalPlaces = getDecimalPlaces(value)

      if (decimalPlaces > decimalConstraints.maximum) {
        return
      }
    }

    setTransferAmount(value)
    setSelectedPercentage(null)
  }

  const handlePercentageClick = (percentage: number) => {
    track("ek_percentage_fill_transfer", { percentage_value: percentage })
    const sourceBalance = getSourceWalletBalance()
    const calculatedAmount = (sourceBalance * percentage) / 100

    const decimalConstraints = getDecimalConstraints()
    if (decimalConstraints) {
      const formattedAmount = calculatedAmount.toFixed(decimalConstraints.maximum)
      setTransferAmount(formattedAmount)
    } else {
      setTransferAmount(calculatedAmount.toFixed(2))
    }
    setValidateError(null)
    setTransferValidateQuote(null)
    setSelectedPercentage(percentage)
  }

  if (step === "chooseCurrency") {
    return (
      <ChooseCurrencyStep
        title={t("wallet.transfer")}
        description={t("wallet.chooseCurrencyDescription", { action: "transfer" })}
        currencies={currencies}
        onClose={onClose}
        onCurrencySelect={handleCurrencySelect}
      />
    )
  }

  if (step === "enterAmount") {
    return (
      <div
        data-testid="transfer-container"
        className="absolute inset-0 flex flex-col h-full px-4 pt-6 pb-4 md:pt-5"
      >
        <div className="flex justify-start items-center mb-6 md:max-w-[608px] md:mx-auto md:w-full px-2">
          <Button
            data-testid="transfer-btn-back"
            variant="ghost"
            size="sm"
            className="px-0"
            onClick={() => {
              track("ek_close_transfer")
              onClose()
            }}
            aria-label={t("common.back")}
          >
            <Image src="/icons/back-circle.png" alt={t("common.back")} width={32} height={32} />
          </Button>
        </div>
        <div className="md:max-w-[608px] md:mx-auto md:w-full flex-1 flex flex-col">
          <h1 className="text-slate-1200 text-xl md:text-[32px] font-extrabold mb-6 px-2">
            {t("wallet.transfer")}
          </h1>
          <div className="relative mb-6 px-2" data-testid={isWalletSelectionLoading ? "transfer-wallet-skeleton" : undefined}>
            <div
              data-testid={sourceWalletData ? "transfer-btn-account-from" : "transfer-btn-select-from"}
              className={`bg-grayscale-500 p-4 px-6 flex items-center gap-1 rounded-2xl h-[100px] relative ${
                isWalletSelectionLoading ? "cursor-default pointer-events-none" : "cursor-pointer"
              }`}
              onClick={() => {
                if (isWalletSelectionLoading) return
                track("ek_from_wallet_transfer")
                if (window.innerWidth < 768) {
                  setShowMobileSheet("from")
                } else {
                  setShowDesktopWalletPopup("from")
                }
              }}
            >
              {isWalletSelectionLoading ? (
                renderWalletAccountCardSkeleton(t("wallet.from"))
              ) : (
                <>
                  <div className="absolute top-4 start-6 flex flex-col items-start gap-1.5">
                    <div className="text-grayscale-text-muted text-base font-normal">{t("wallet.from")}</div>
                    {sourceWalletData &&
                      (sourceWalletData.type?.toLowerCase() === "p2p" ? (
                        <div className="relative w-[21px] h-[21px] flex-shrink-0 mt-1">
                          <Image
                            src="/icons/p2p-black.png"
                            alt={t("common.p2p")}
                            width={21}
                            height={21}
                            className="w-[21px] h-[21px] rounded-full"
                          />
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className="w-[10.5px] h-[10.5px] rounded-full bg-white flex items-center justify-center">
                              <Image
                                src={
                                  getCurrencyImage(sourceWalletData.currency)}
                                alt={sourceWalletData.currency}
                                width={9}
                                height={9}
                                className="w-[9px] h-[9px] rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mb-3 mt-1">
                          <Image
                            src={getCurrencyImage(sourceWalletData.currency)}
                            alt={sourceWalletData.currency}
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                  </div>
                  <div className="flex-1 min-w-0 mt-6 ms-10 pe-8 text-start">
                    {sourceWalletData ? (
                      <>
                        <div className="text-slate-1200 text-base font-bold">{sourceWalletData.name}</div>
                        <div className="text-grayscale-600 text-sm font-normal">{getSourceWalletAmount()}</div>
                      </>
                    ) : (
                      <div className="text-grayscale-text-placeholder text-base font-normal whitespace-nowrap">{t("wallet.select")}</div>
                    )}
                  </div>
                  <Image src="/icons/chevron-down.png" alt={t("common.dropdown")} width={24} height={24} />
                </>
              )}
            </div>
            <div className="h-2"></div>
            <div
              data-testid={destinationWalletData ? "transfer-btn-account-to" : "transfer-btn-select-to"}
              className={`bg-grayscale-500 p-4 px-6 flex items-center gap-1 rounded-2xl h-[100px] relative ${
                isWalletSelectionLoading ? "cursor-default pointer-events-none" : "cursor-pointer"
              }`}
              onClick={() => {
                if (isWalletSelectionLoading) return
                track("ek_to_wallet_transfer")
                if (window.innerWidth < 768) {
                  setShowMobileSheet("to")
                } else {
                  setShowDesktopWalletPopup("to")
                }
              }}
            >
              {isWalletSelectionLoading ? (
                renderWalletAccountCardSkeleton(t("wallet.to"))
              ) : (
                <>
                  <div className="absolute top-4 start-6 flex flex-col items-start gap-1.5">
                    <div className="text-grayscale-text-muted text-base font-normal">{t("wallet.to")}</div>
                    {destinationWalletData &&
                      (destinationWalletData.type?.toLowerCase() === "p2p" ? (
                        <div className="relative w-[21px] h-[21px] flex-shrink-0 mt-1">
                          <Image
                            src="/icons/p2p-black.png"
                            alt={t("common.p2p")}
                            width={21}
                            height={21}
                            className="w-[21px] h-[21px] rounded-full"
                          />
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className="w-[10.5px] h-[10.5px] rounded-full bg-white flex items-center justify-center">
                              <Image
                                src={
                                  getCurrencyImage(destinationWalletData.currency)}
                                alt={destinationWalletData.currency}
                                width={9}
                                height={9}
                                className="w-[9px] h-[9px] rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mb-3 mt-1">
                          <Image
                            src={
                              getCurrencyImage(destinationWalletData.currency)}
                            alt={destinationWalletData.currency}
                            width={24}
                            height={24}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                  </div>
                  <div className="flex-1 min-w-0 mt-6 ms-10 pe-8 text-start">
                    {destinationWalletData ? (
                      <>
                        <div className="text-slate-1200 text-base font-bold">{destinationWalletData.name}</div>
                        <div className="text-grayscale-600 text-sm font-normal">{getDestinationWalletAmount()}</div>
                      </>
                    ) : (
                      <div className="text-grayscale-text-placeholder text-base font-normal whitespace-nowrap">{t("wallet.select")}</div>
                    )}
                  </div>
                  <Image src="/icons/chevron-down.png" alt={t("common.dropdown")} width={24} height={24} />
                </>
              )}
            </div>
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <Button
                data-testid="transfer-btn-swap"
                variant="ghost"
                size="icon"
                onClick={handleInterchange}
                disabled={isWalletSelectionLoading}
                className="pointer-events-auto size-12 h-12 w-12 min-h-12 max-h-12 p-0 bg-transparent hover:bg-transparent shadow-none disabled:opacity-40"
              >
                <Image
                  src="/icons/button-switch.png"
                  alt={t("common.switch")}
                  width={48}
                  height={48}
                  className="size-12"
                />
              </Button>
            </div>
          </div>
          <div className="mb-6 px-2 relative">
            <h2 className="text-slate-1200 text-sm font-normal mb-2">{t("wallet.amount")}</h2>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Input
                  data-testid="transfer-input-amount"
                  type="number"
                  placeholder="0.00"
                  value={transferAmount || ""}
                  onChange={handleAmountChange}
                  className="h-12 px-4 pe-16 border border-grayscale-200 rounded-lg text-base text-start placeholder:text-grayscale-text-placeholder appearance-none"
                  max={getSourceWalletBalance()}
                />
                {!showCurrencySwitcher && (
                  <span className="absolute end-4 top-1/2 transform -translate-y-1/2 text-grayscale-600">
                    {selectedCurrency || "USD"}
                  </span>
                )}
              </div>
              {showCurrencySwitcher && (
                <div className="w-32 h-12 bg-black/[0.04] rounded-2xl p-2 flex items-center justify-center">
                  <Tabs
                    value={selectedAmountCurrency}
                    onValueChange={(value) => {
                      if (value) {
                        if (value === "source") {
                          track("ek_source_currency_segment_transfer")
                          setSelectedCurrency(sourceWalletData?.currency || null)
                        } else if (value === "destination") {
                          track("ek_destination_currency_segment_transfer")
                          setSelectedCurrency(destinationWalletData?.currency || null)
                        }
                        setTransferAmount("")
                        setSelectedAmountCurrency(value as "source" | "destination")
                      }
                    }}
                    className="w-full h-full"
                  >
                    <TabsList className="bg-transparent h-full gap-1 w-full p-0">
                      <TabsTrigger
                        value="source"
                        className="text-base px-3 h-full rounded-lg border-0 shadow-none data-[state=active]:bg-white data-[state=inactive]:bg-transparent hover:bg-white/50 text-slate-1200 font-normal flex-1"
                      >
                        {sourceWalletData?.currency}
                      </TabsTrigger>
                      <TabsTrigger
                        value="destination"
                        className="text-base px-3 h-full rounded-lg border-0 shadow-none data-[state=active]:bg-white data-[state=inactive]:bg-transparent hover:bg-white/50 text-slate-1200 font-normal flex-1"
                      >
                        {destinationWalletData?.currency}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}
            </div>
            {transferAmount && !isAmountValid(transferAmount) && (
              <p data-testid="transfer-error-amount" className="text-red-500 text-sm mt-1">{getAmountErrorMessage()}</p>
            )}
            <div className="flex gap-2 mt-6">
              <Button
                data-testid="transfer-btn-pct-25"
                className={`flex-1 font-normal ${selectedPercentage === 25
                  ? "bg-grayscale-200 text-slate-1200 border-slate-1200 hover:bg-grayscale-200"
                  : "text-grayscale-600 border-grayscale-200 hover:bg-transparent"
                  }`}
                onClick={() => handlePercentageClick(25)}
                size="sm"
                variant="outline"
              >
                25%
              </Button>
              <Button
                data-testid="transfer-btn-pct-50"
                className={`flex-1 font-normal ${selectedPercentage === 50
                  ? "bg-grayscale-200 text-slate-1200 border-slate-1200 hover:bg-grayscale-200"
                  : "text-grayscale-600 border-grayscale-200 hover:bg-transparent"
                  }`}
                onClick={() => handlePercentageClick(50)}
                size="sm"
                variant="outline"
              >
                50%
              </Button>
              <Button
                data-testid="transfer-btn-pct-75"
                className={`flex-1 font-normal ${selectedPercentage === 75
                  ? "bg-grayscale-200 text-slate-1200 border-slate-1200 hover:bg-grayscale-200"
                  : "text-grayscale-600 border-grayscale-200 hover:bg-transparent"
                  }`}
                onClick={() => handlePercentageClick(75)}
                size="sm"
                variant="outline"
              >
                75%
              </Button>
              <Button
                data-testid="transfer-btn-pct-100"
                className={`flex-1 font-normal ${selectedPercentage === 100
                  ? "bg-grayscale-200 text-slate-1200 border-slate-1200 hover:bg-grayscale-200"
                  : "text-grayscale-600 border-grayscale-200 hover:bg-transparent"
                  }`}
                onClick={() => handlePercentageClick(100)}
                size="sm"
                variant="outline"
              >
                100%
              </Button>
            </div>

            {showCurrencySwitcher && IS_TRANSFER_FEE_DISPLAY_ENABLED && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-black/50 text-xs font-normal">{t("wallet.transferAmount")}</span>
                  <span className="text-slate-1200 text-xs font-normal">
                    {transferFeeCalculation
                      ? `${formatAmountByCurrency(
                        transferFeeCalculation.transferAmount,
                        selectedAmountCurrency === "source"
                          ? sourceWalletData?.currency || ""
                          : destinationWalletData?.currency || "",
                      )} ${selectedAmountCurrency === "source" ? sourceWalletData?.currency : destinationWalletData?.currency}`
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-black/50 text-xs font-normal">
                    {t("wallet.transferFee")} ({transferFeeCalculation?.feePercentage || 0}%)
                  </span>
                  <span className="text-slate-1200 text-xs font-normal">
                    {transferFeeCalculation
                      ? `${formatAmountByCurrency(transferFeeCalculation.transferFee, sourceWalletData?.currency || "")} ${sourceWalletData?.currency}`
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-black/50 text-xs font-normal">{t("wallet.youllReceive")}:</span>
                  <div className="text-end">
                    <div className="text-slate-1200 text-xs font-normal">
                      {transferFeeCalculation && exchangeRateData
                        ? `${formatAmountByCurrency(transferFeeCalculation.youllReceive, destinationWalletData?.currency || "")} ${destinationWalletData?.currency} (${countdown}s)`
                        : "-"}
                    </div>
                    {transferFeeCalculation && (
                      <div className="text-black/50 text-xs font-normal mt-1">
                        {formatAmountByCurrency(
                          transferFeeCalculation.youllReceiveConverted,
                          sourceWalletData?.currency || "",
                        )}{" "}
                        {sourceWalletData?.currency}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
          <div className="hidden md:flex px-2 mt-6 items-center justify-between gap-6">
            <div className="min-w-0 flex-1">{renderEnterAmountYoullReceive()}</div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {validateError && (
                <p className="text-sm text-error-text text-end max-w-xs" role="alert">
                  {validateError}
                </p>
              )}
              <Button
                data-testid="transfer-btn-submit"
                onClick={handleTransferClick}
                disabled={
                  (IS_TRANSFER_FEE_DISPLAY_ENABLED && isValidatePreviewLoading) ||
                  !transferAmount ||
                  transferAmount.trim() === "" ||
                  !sourceWalletData ||
                  !destinationWalletData ||
                  !isAmountValid(transferAmount) ||
                  (IS_TRANSFER_FEE_DISPLAY_ENABLED && !transferValidateQuote)
                }
                className="flex h-12 min-h-12 max-h-12 px-7 justify-center items-center gap-2"
              >
                {isValidatePreviewLoading ? (
                  <Image src="/icons/spinner.png" alt={t("common.loading")} width={20} height={20} className="animate-spin" />
                ) : (
                  t("wallet.transfer")
                )}
              </Button>
            </div>
          </div>
          <div className="flex-1"></div>
          <div className="mt-auto md:hidden space-y-4 px-2">
            {renderEnterAmountYoullReceive()}
            {validateError && (
              <p className="text-sm text-error-text text-start" role="alert">
                {validateError}
              </p>
            )}
            <Button
              data-testid="transfer-btn-submit"
              onClick={handleTransferClick}
              disabled={
                (IS_TRANSFER_FEE_DISPLAY_ENABLED && isValidatePreviewLoading) ||
                !transferAmount ||
                transferAmount.trim() === "" ||
                !sourceWalletData ||
                !destinationWalletData ||
                !isAmountValid(transferAmount) ||
                (IS_TRANSFER_FEE_DISPLAY_ENABLED && !transferValidateQuote)
              }
              className="w-full h-12 min-w-24 min-h-12 max-h-12 px-7 flex justify-center items-center gap-2"
            >
              {isValidatePreviewLoading ? (
                <Image src="/icons/spinner.png" alt={t("common.loading")} width={20} height={20} className="animate-spin" />
              ) : (
                t("wallet.transfer")
              )}
            </Button>
          </div>
        </div>
        {renderMobileSheet("from")}
        {renderMobileSheet("to")}
        {renderDesktopWalletPopup("from")}
        {renderDesktopWalletPopup("to")}
        {renderMobileConfirmSheet()}
        {renderDesktopConfirmPopup()}
        {renderAmountReceiveInfoSheet()}
      </div>
    )
  }

  if (step === "success") {
    const isMainToP2P =
      destinationWalletData?.type?.toLowerCase() === "p2p" &&
      sourceWalletData?.type?.toLowerCase() !== "p2p"

    // When fee display is on, prefer validate destination (You'll receive).
    // When off, production does not apply fees — show the entered amount only.
    const successAmountRaw = IS_TRANSFER_FEE_DISPLAY_ENABLED
      ? transferValidateQuote?.destination?.amount || transferAmount || "0"
      : transferAmount || "0"
    const successCurrency = IS_TRANSFER_FEE_DISPLAY_ENABLED
      ? transferValidateQuote?.destination?.currency ||
        destinationWalletData?.currency ||
        selectedCurrency ||
        "USD"
      : selectedCurrency ||
        sourceWalletData?.currency ||
        destinationWalletData?.currency ||
        "USD"
    const successAmountFormatted = formatAmountWithDecimals(
      Number.parseFloat(successAmountRaw)
    )

    const transferText = isMainToP2P
      ? t("wallet.transferSuccessMessageMainToP2P", {
          amount: successAmountFormatted,
          currency: successCurrency,
          walletName: destinationWalletData?.name || t("wallet.p2pWallet"),
          currencyLabel:
            currenciesData?.[successCurrency]?.label || successCurrency,
        })
      : t("wallet.transferSuccessMessage", {
          amount: successAmountFormatted,
          currency: successCurrency,
          from: sourceWalletData?.name || "",
          to: destinationWalletData?.name || "",
        })

    return (
      <div
        className="absolute inset-0 flex flex-col h-full p-6"
        style={{
          background:
            "radial-gradient(108.21% 50% at 52.05% 0%, rgba(255, 68, 79, 0.24) 0%, rgba(255, 68, 79, 0.00) 100%), #181C25",
        }}
      >
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="mb-6">
              <Image src="/icons/success-transfer.png" alt={t("common.success")} width={256} height={256} />
            </div>
            <h1 className="text-white text-center text-2xl font-extrabold mb-4">{t("wallet.transferSuccessful")}</h1>
            <p className="text-white text-center text-base font-normal">{transferText}</p>
            <div className="hidden md:flex gap-4 mt-6">
              <Button
                data-testid="transfer-success-btn-details"
                onClick={() => { track("ek_view_details_transfer_successful"); handleViewDetails() }}
                className="w-[276px] h-12 px-7 flex justify-center items-center gap-2 bg-transparent border border-white rounded-3xl text-white text-base font-extrabold hover:bg-white/10"
              >
                {t("wallet.viewDetails")}
              </Button>
              <Button data-testid="transfer-success-btn-done" onClick={() => { track("ek_got_it_transfer_successful"); handleDoneClick() }} className="w-[276px] h-12 px-7 flex justify-center items-center gap-2">
                {t("wallet.gotIt")}
              </Button>
            </div>
          </div>
          <div className="block md:hidden w-full space-y-3">
            <Button
              data-testid="transfer-success-btn-done"
              onClick={() => { track("ek_got_it_transfer_successful"); handleDoneClick() }}
              className="w-full h-12 min-w-24 min-h-12 max-h-12 px-7 flex justify-center items-center gap-2"
            >
              {t("wallet.gotIt")}
            </Button>
            <Button
              data-testid="transfer-success-btn-details"
              onClick={() => { track("ek_view_details_transfer_successful"); handleViewDetails() }}
              className="w-full h-12 min-w-24 min-h-12 max-h-12 px-7 flex justify-center items-center gap-2 bg-transparent border border-white rounded-3xl text-white text-base font-extrabold hover:bg-white/10"
            >
              {t("wallet.viewDetails")}
            </Button>
          </div>
      </div>
    )
  }

  const renderUnsuccessfulCtaDesktop = () => {
    const primary = "w-[276px] h-12 px-7 flex justify-center items-center gap-2"
    const secondary = "w-[276px] h-12 px-7 flex justify-center items-center gap-2 bg-transparent border border-white rounded-3xl text-white text-base font-extrabold hover:bg-white/10"

    if (transferRejectionCta === "contact_us") {
      return (
        <div className="hidden md:flex justify-center mt-6">
          <Button data-testid="transfer-error-btn-contact" onClick={handleOpenLiveChat} className={primary}>{t("wallet.contactUs")}</Button>
        </div>
      )
    }
    if (transferRejectionCta === "got_it") {
      return (
        <div className="hidden md:flex justify-center mt-6">
          <Button data-testid="transfer-error-btn-cancel" onClick={handleDoneClick} className={primary}>{t("wallet.gotIt")}</Button>
        </div>
      )
    }
    if (transferRejectionCta === "deposit_now") {
      return (
        <div className="hidden md:flex justify-center mt-6">
          <Button data-testid="transfer-error-btn-retry" onClick={handleDoneClick} className={primary}>{t("wallet.depositNow")}</Button>
        </div>
      )
    }
    if (transferRejectionCta === "change_method" || transferRejectionCta === "make_changes") {
      return (
        <div className="hidden md:flex justify-center mt-6">
          <Button data-testid="transfer-error-btn-retry" onClick={handleDoneClick} className={primary}>{t("wallet.tryAgain")}</Button>
        </div>
      )
    }
    if (transferRejectionCta === "got_it_contact_us") {
      return (
        <div className="hidden md:flex gap-4 mt-6">
          <Button data-testid="transfer-error-btn-cancel" onClick={handleDoneClick} className={secondary}>{t("wallet.gotIt")}</Button>
          <Button data-testid="transfer-error-btn-contact" onClick={handleOpenLiveChat} className={primary}>{t("wallet.contactUs")}</Button>
        </div>
      )
    }
    return (
      <div className="hidden md:flex gap-4 mt-6">
        <Button data-testid="transfer-error-btn-cancel" onClick={() => { track("ek_not_now_transfer_unsuccessful"); handleDoneClick() }} className={secondary}>{t("wallet.notNow")}</Button>
        <Button data-testid="transfer-error-btn-retry" onClick={() => { track("ek_try_again_transfer_unsuccessful"); toEnterAmount() }} className={primary}>{t("wallet.tryAgain")}</Button>
      </div>
    )
  }

  const renderUnsuccessfulCtaMobile = () => {
    const primary = "w-full h-12 min-w-24 min-h-12 max-h-12 px-7 flex justify-center items-center gap-2"
    const secondary = "w-full h-12 min-w-24 min-h-12 max-h-12 px-7 flex justify-center items-center gap-2 bg-transparent border border-white rounded-3xl text-white text-base font-extrabold hover:bg-white/10"

    if (transferRejectionCta === "contact_us") {
      return (
        <div className="block md:hidden w-full space-y-3">
          <Button data-testid="transfer-error-btn-contact" onClick={handleOpenLiveChat} className={primary}>{t("wallet.contactUs")}</Button>
        </div>
      )
    }
    if (transferRejectionCta === "got_it") {
      return (
        <div className="block md:hidden w-full space-y-3">
          <Button data-testid="transfer-error-btn-cancel" onClick={handleDoneClick} className={primary}>{t("wallet.gotIt")}</Button>
        </div>
      )
    }
    if (transferRejectionCta === "deposit_now") {
      return (
        <div className="block md:hidden w-full space-y-3">
          <Button data-testid="transfer-error-btn-retry" onClick={handleDoneClick} className={primary}>{t("wallet.depositNow")}</Button>
        </div>
      )
    }
    if (transferRejectionCta === "change_method" || transferRejectionCta === "make_changes") {
      return (
        <div className="block md:hidden w-full space-y-3">
          <Button data-testid="transfer-error-btn-retry" onClick={handleDoneClick} className={primary}>{t("wallet.tryAgain")}</Button>
        </div>
      )
    }
    if (transferRejectionCta === "got_it_contact_us") {
      return (
        <div className="block md:hidden w-full space-y-3">
          <Button data-testid="transfer-error-btn-contact" onClick={handleOpenLiveChat} className={primary}>{t("wallet.contactUs")}</Button>
          <Button data-testid="transfer-error-btn-cancel" onClick={handleDoneClick} className={secondary}>{t("wallet.gotIt")}</Button>
        </div>
      )
    }
    return (
      <div className="block md:hidden w-full space-y-3">
        <Button data-testid="transfer-error-btn-retry" onClick={() => { track("ek_try_again_transfer_unsuccessful"); toEnterAmount() }} className={primary}>{t("wallet.tryAgain")}</Button>
        <Button data-testid="transfer-error-btn-cancel" onClick={() => { track("ek_not_now_transfer_unsuccessful"); handleDoneClick() }} className={secondary}>{t("wallet.notNow")}</Button>
      </div>
    )
  }

  if (step === "unsuccessful") {
    const amounts = Object.fromEntries(
      Object.entries(transferRejectionAmounts).filter(([, v]) => v !== undefined)
    ) as Record<string, string>
    const codeSlug = transferRejectionCode ? transferRejectionCode.toLowerCase() : null
    const title = codeSlug
      ? t(`wallet.transfer_wr_err_${codeSlug}_title`)
      : t("wallet.transferUnsuccessful")
    const body = codeSlug
      ? t(`wallet.transfer_wr_err_${codeSlug}_body`, amounts)
      : transferErrorMessage || t("wallet.transferUnsuccessfulMessage")

    return (
      <div
        className="absolute inset-0 flex flex-col h-full p-6"
        style={{
          background:
            "radial-gradient(108.21% 50% at 52.05% 0%, rgba(255, 68, 79, 0.24) 0%, rgba(255, 68, 79, 0.00) 100%), #181C25",
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="mb-6">
            <Image src="/icons/failed-transfer.png" alt={t("common.unsuccessful")} width={256} height={256} />
          </div>
          <h1 className="text-white text-center text-2xl font-extrabold mb-4">{title}</h1>
          <p className="text-white text-center text-base font-normal">{body}</p>
          {renderUnsuccessfulCtaDesktop()}
        </div>
        {renderUnsuccessfulCtaMobile()}
      </div>
    )
  }

  return null
}
