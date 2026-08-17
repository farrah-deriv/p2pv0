"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import type { AdFormData } from "../types"
import { RateInput } from "./ui/rate-input"
import { PriceTypeSelector } from "./ui/price-type-selector"
import { FloatingRateInput } from "./ui/floating-rate-input"
import { TradeTypeSelector } from "./ui/trade-type-selector"
import { useAccountCurrencies } from "@/hooks/use-account-currencies"
import { useSettings, useAdvertStats } from "@/hooks/use-api-queries"
import Image from "next/image"
import { getDecimalConstraints, getDecimalPlaces } from "@/lib/currency-decimal"
import { currencyFlagMapper } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n/use-translations"
import type { WebSocketMessage } from "@/lib/websocket-message"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { AdDetailsFormSkeleton } from "./ui/ad-details-form-skeleton"
import { RateSectionSkeleton } from "./ui/rate-section-skeleton"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { CurrencyFilter } from "@/components/currency-filter/currency-filter"

interface AdDetailsFormProps {
  onNext: (data: Partial<AdFormData>, errors?: ValidationErrors) => void
  initialData?: Partial<AdFormData>
  isEditMode?: boolean
  isLoadingInitialData?: boolean
  currencies?: Array<{ code: string; name?: string }>
}

interface ValidationErrors {
  fixedRate?: string
  floatingRate?: string
}

interface PriceRange {
  lowestPrice: number | null
  highestPrice: number | null
}

interface CachedExchangeRate {
  rate: number
  status?: string
}

/** Flip to `true` when multi-currency account selection returns. */
const SHOW_ACCOUNT_CURRENCY_SELECTOR = false

/** Empty string → account channel `exchange_rates/{buy}` (all currencies), like mobile. */
const ALL_EXCHANGE_RATES = ""

function parseRateNumber(raw: unknown): number | null {
  if (raw == null) return null
  const parsed = typeof raw === "number" ? raw : Number.parseFloat(String(raw))
  return Number.isNaN(parsed) ? null : parsed
}

/**
 * Extract a currency→rate map from WS exchange-rate payloads.
 *
 * Shapes seen in the wild:
 * - Account channel: `{ IDR: { rate, status }, ... }` or `{ data: { IDR: {...} } }`
 * - Pair channel: `{ rate, status }` or `{ data: { rate, status } }`
 */
function extractExchangeRatesFromPayload(
  payload: any,
  channel: string | undefined,
  fallbackCurrency: string,
): Record<string, CachedExchangeRate> {
  if (!payload || typeof payload !== "object") return {}

  const out: Record<string, CachedExchangeRate> = {}
  const nest = payload.data && typeof payload.data === "object" ? payload.data : null

  const ingestEntry = (code: string, entry: any) => {
    const rate = parseRateNumber(entry?.rate)
    if (rate == null || !code) return
    out[code] = { rate, status: typeof entry?.status === "string" ? entry.status : undefined }
  }

  const ingestMap = (map: Record<string, any>) => {
    for (const [code, entry] of Object.entries(map)) {
      if (!entry || typeof entry !== "object" || !("rate" in entry)) continue
      ingestEntry(code, entry)
    }
  }

  // Currency-keyed map (account / all-currencies channel).
  ingestMap(payload)
  if (nest) ingestMap(nest)

  // Pair channel: single rate object. Currency from channel suffix or selection.
  const pairRate =
    parseRateNumber(payload.rate) ?? (nest ? parseRateNumber(nest.rate) : null)
  if (pairRate != null && Object.keys(out).length === 0) {
    const parts = channel?.split("/") ?? []
    const fromChannel = parts.length >= 3 ? parts[2] : ""
    const code = fromChannel || fallbackCurrency
    ingestEntry(code, {
      rate: pairRate,
      status: payload.status ?? nest?.status,
    })
  }

  return out
}

const FIXED_RATE_MAX_DECIMALS = 6

function RateInfoRow({
  label,
  value,
  currency,
  fractionDigits,
}: {
  label: string
  value: number | null
  currency: string
  fractionDigits: number
}) {
  return (
    <div className="flex w-full min-w-0 items-center gap-2 text-xs mt-1 first:mt-4">
      <span className="shrink-0 text-grayscale-text-muted font-normal">{label}</span>
      <div className="min-w-[8px] flex-1 border-b border-dotted border-grayscale-300" aria-hidden="true" />
      {value != null && !Number.isNaN(value) ? (
        <span className="min-w-0 shrink truncate text-end text-slate-1200">
          {value.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: fractionDigits,
          })}{" "}
          <span className="text-xs font-normal">{currency}</span>
        </span>
      ) : (
        <span className="shrink-0 text-slate-1200">-</span>
      )}
    </div>
  )
}

export default function AdDetailsForm({
  onNext,
  initialData,
  isLoadingInitialData,
  isEditMode,
  currencies: currenciesProp = [],
}: AdDetailsFormProps) {
  const { t } = useTranslations()
  const [type, setType] = useState<"buy" | "sell">(initialData?.type || "buy")
  const [priceType, setPriceType] = useState<"fixed" | "float">(initialData?.priceType || "fixed")
  const [fixedRate, setFixedRate] = useState(initialData?.fixedRate?.toString() || "")
  const [floatingRate, setFloatingRate] = useState(initialData?.floatingRate?.toString() || "0.01")
  const [buyCurrency, setBuyCurrency] = useState(initialData?.buyCurrency?.toString() || "USD")
  const [forCurrency, setForCurrency] = useState(initialData?.forCurrency?.toString() || currenciesProp[0]?.code)
  const { accountCurrencies } = useAccountCurrencies()
  const [formErrors, setFormErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState({
    fixedRate: false,
    floatingRate: false,
  })
  const [marketPrice, setMarketPrice] = useState<number | null>(null)
  // WS exchange-rate status for the selected currency ("active" | "stale" | ...).
  // Floating ads require an active rate — stale rates force Fixed-only.
  const [marketPriceStatus, setMarketPriceStatus] = useState<string | null>(null)
  const [isExchangeRateLoading, setIsExchangeRateLoading] = useState(true)
  const [priceRange, setPriceRange] = useState<PriceRange>({ lowestPrice: null, highestPrice: null })
  const userEditedFixedRateRef = useRef(!!isEditMode && !!initialData?.fixedRate)
  const lastAutoFillPairRef = useRef<string | null>(null)
  const prevPriceTypeRef = useRef<"fixed" | "float">(initialData?.priceType || "fixed")
  const exchangeRatePairRef = useRef<string | null>(null)
  const ratesByCurrencyRef = useRef<Record<string, CachedExchangeRate>>({})
  // Tracks which forCurrency the current marketPrice belongs to.
  // State (not ref) so it batches with setMarketPrice — the auto-fill effect
  // always sees both values in the same commit, preventing stale-rate carry-over.
  const [marketPriceCurrency, setMarketPriceCurrency] = useState<string | null>(null)
  // Tracks whether the server has acknowledged the exchange_rates channel join.
  // Prevents "must be in channel" errors from sending a request before the join ack.
  const channelJoinedRef = useRef(false)

  const isMobile = useIsMobile()
  const {
    isConnected,
    joinExchangeRatesChannel,
    leaveExchangeRatesChannel,
    subscribe,
    requestExchangeRate,
  } = useWebSocketContext()
  const { data: settings } = useSettings()
  const { data: advertStats } = useAdvertStats(buyCurrency, !!buyCurrency)

  // Match mobile: floating is available when the global setting is on, the selected
  // currency is not float-disabled, and an *active* exchange rate exists (checked in
  // PriceTypeSelector via marketPrice + marketPriceStatus). Advert-stats float bounds
  // only drive the lowest/highest market rows — they must not gate the rate-type
  // selector, or currencies with a live rate but no existing ads would hide Floating.
  const isFloatingRateEnabled = useMemo(() => {
    if (!settings?.float_rate_enabled) return false
    if (!forCurrency) return false
    // Stale (or non-active) rates cannot back a floating ad — Fixed only.
    if (marketPriceStatus === "stale") return false
    if (marketPriceStatus != null && marketPriceStatus !== "active") return false

    const disabledCountries: string[] = Array.isArray(settings.float_rate_disabled_countries)
      ? settings.float_rate_disabled_countries.map((c: unknown) => String(c).toLowerCase())
      : []

    if (disabledCountries.length > 0 && Array.isArray(settings.countries)) {
      const matchingCountries = settings.countries.filter(
        (c: { currency?: string; code?: string }) =>
          typeof c?.currency === "string" &&
          c.currency.toUpperCase() === forCurrency.toUpperCase(),
      )
      // Web selects by currency (countries are collapsed). Allow floating when at
      // least one country that uses this currency is not in the disabled list.
      if (
        matchingCountries.length > 0 &&
        matchingCountries.every(
          (c: { code?: string }) =>
            typeof c?.code !== "string" || disabledCountries.includes(c.code.toLowerCase()),
        )
      ) {
        return false
      }
    }

    return true
  }, [settings, forCurrency, marketPriceStatus])

  const formatMarketRateForInput = (rate: number): string => {
    const constraints = getDecimalConstraints(forCurrency || buyCurrency, accountCurrencies)
    const decimals = Math.min(constraints?.maximum ?? 2, FIXED_RATE_MAX_DECIMALS)
    return rate.toFixed(decimals)
  }

  const maxFixedRateDecimals = (): number => {
    const constraints = getDecimalConstraints(forCurrency || buyCurrency, accountCurrencies)
    return Math.min(constraints?.maximum ?? FIXED_RATE_MAX_DECIMALS, FIXED_RATE_MAX_DECIMALS)
  }

  const fixedRateDecimals = maxFixedRateDecimals()

  const isFormValid = () => {
    const hasValues = priceType === "fixed" ? !!fixedRate : !!floatingRate
    const hasNoErrors = Object.keys(formErrors).length === 0
    return hasValues && hasNoErrors
  }

  const buildFormData = (): Partial<AdFormData> => ({
    type,
    fixedRate: priceType === "fixed" ? Number.parseFloat(fixedRate) || 0 : undefined,
    floatingRate: priceType === "float" ? Number.parseFloat(floatingRate) || 0 : undefined,
    priceType,
    forCurrency,
    buyCurrency,
  })

  useEffect(() => {
    if (!isEditMode && currenciesProp.length > 0 && !initialData?.forCurrency) {
      setForCurrency(currenciesProp[0].code)
    }
  }, [currenciesProp, isEditMode, initialData?.forCurrency])

  useEffect(() => {
    const fetchPriceRange = () => {
      try {
        if (!Array.isArray(advertStats)) {
          setPriceRange({ lowestPrice: null, highestPrice: null })
          return
        }

        const currencyStats = advertStats.find((stat) => stat.payment_currency === forCurrency)

        if (currencyStats) {
          let lowestPrice = null
          let highestPrice = null

          if (type === "buy") {
            if (priceType === "fixed") {
              lowestPrice = currencyStats.buy_fixed_minimum_rate
                ? Number.parseFloat(currencyStats.buy_fixed_minimum_rate)
                : null
              highestPrice = currencyStats.buy_fixed_maximum_rate
                ? Number.parseFloat(currencyStats.buy_fixed_maximum_rate)
                : null
            } else if (marketPrice != null) {
              lowestPrice = currencyStats.buy_float_minimum_rate
                ? marketPrice * (1 + Number.parseFloat(currencyStats.buy_float_minimum_rate) / 100)
                : null
              highestPrice = currencyStats.buy_float_maximum_rate
                ? marketPrice * (1 + Number.parseFloat(currencyStats.buy_float_maximum_rate) / 100)
                : null
            }
          } else {
            if (priceType === "fixed") {
              lowestPrice = currencyStats.sell_fixed_minimum_rate
                ? Number.parseFloat(currencyStats.sell_fixed_minimum_rate)
                : null
              highestPrice = currencyStats.sell_fixed_maximum_rate
                ? Number.parseFloat(currencyStats.sell_fixed_maximum_rate)
                : null
            } else if (marketPrice != null) {
              lowestPrice = currencyStats.sell_float_minimum_rate
                ? marketPrice * (1 + Number.parseFloat(currencyStats.sell_float_minimum_rate) / 100)
                : null
              highestPrice = currencyStats.sell_float_maximum_rate
                ? marketPrice * (1 + Number.parseFloat(currencyStats.sell_float_maximum_rate) / 100)
                : null
            }
          }

          setPriceRange({
            lowestPrice,
            highestPrice,
          })
        } else {
          setPriceRange({ lowestPrice: null, highestPrice: null })
        }
      } catch {
        setPriceRange({ lowestPrice: null, highestPrice: null })
      }
    }

    if (!buyCurrency || !forCurrency) return
    fetchPriceRange()
  }, [buyCurrency, forCurrency, priceType, type, marketPrice, advertStats])

  // Apply cached / live rate for the selected payment currency.
  const applyRateForCurrency = (currency: string) => {
    const cached = ratesByCurrencyRef.current[currency]
    if (!cached) return false
    setMarketPriceCurrency(currency)
    setMarketPrice(cached.rate)
    setMarketPriceStatus(cached.status ?? null)
    setIsExchangeRateLoading(false)
    if (cached.status === "stale") {
      setPriceType("fixed")
    }
    return true
  }

  // Reset rate UI on currency change; reuse cache when the all-currencies
  // channel already delivered this payment currency (mobile parity).
  useEffect(() => {
    if (!buyCurrency || !forCurrency) {
      setIsExchangeRateLoading(false)
      return
    }
    const pairKey = `${buyCurrency}:${forCurrency}`
    if (exchangeRatePairRef.current === pairKey) return
    exchangeRatePairRef.current = pairKey

    if (applyRateForCurrency(forCurrency)) return

    setMarketPriceCurrency(null)
    setMarketPrice(null)
    setMarketPriceStatus(null)
    setIsExchangeRateLoading(true)
  }, [buyCurrency, forCurrency])

  // If the socket never connects, still leave the skeleton after a grace period.
  useEffect(() => {
    if (isConnected || !buyCurrency || !forCurrency) return
    const settleTimer = setTimeout(() => {
      setIsExchangeRateLoading(false)
    }, 1500)
    return () => clearTimeout(settleTimer)
  }, [isConnected, buyCurrency, forCurrency])

  // Join account-level channel (all currencies) — same as mobile.
  // Pair channel join was mismatched with the old exact-channel listener.
  useEffect(() => {
    if (!isConnected || !buyCurrency) return

    channelJoinedRef.current = false
    ratesByCurrencyRef.current = {}
    joinExchangeRatesChannel(buyCurrency, ALL_EXCHANGE_RATES)
    return () => {
      leaveExchangeRatesChannel(buyCurrency, ALL_EXCHANGE_RATES)
    }
  }, [isConnected, buyCurrency, joinExchangeRatesChannel, leaveExchangeRatesChannel])

  useEffect(() => {
    if (isLoadingInitialData || !isConnected || !buyCurrency || !forCurrency) return

    const pairKey = `${buyCurrency}:${forCurrency}`
    const accountChannel = `exchange_rates/${buyCurrency}`

    // If already joined (only forCurrency changed), request immediately.
    // If not yet joined (new connection / reconnect), defer to next macrotask so
    // the join message is fully sent before the request — prevents the server
    // from receiving both in the same tick and rejecting with "must be in channel".
    let joinTimer: ReturnType<typeof setTimeout> | undefined
    if (channelJoinedRef.current) {
      requestExchangeRate(buyCurrency, ALL_EXCHANGE_RATES)
    } else {
      joinTimer = setTimeout(() => {
        channelJoinedRef.current = true
        requestExchangeRate(buyCurrency, ALL_EXCHANGE_RATES)
      }, 400)
    }

    // Don't leave the rate section skeleton forever if WS is silent.
    const settleTimer = setTimeout(() => {
      if (exchangeRatePairRef.current === pairKey) {
        setIsExchangeRateLoading(false)
      }
    }, 1500)

    const unsubscribe = subscribe((data: WebSocketMessage) => {
      const channel: string | undefined = data.options?.channel
      // Accept account channel + legacy pair channel messages.
      if (!channel?.startsWith(accountChannel)) return

      const extracted = extractExchangeRatesFromPayload(data.payload, channel, forCurrency)
      if (Object.keys(extracted).length === 0) {
        // Join/empty acks must not force fixed-only — wait for a real rate map.
        return
      }

      ratesByCurrencyRef.current = {
        ...ratesByCurrencyRef.current,
        ...extracted,
      }

      const selected = ratesByCurrencyRef.current[forCurrency]
      if (selected) {
        setMarketPriceCurrency(forCurrency)
        setMarketPrice(selected.rate)
        setMarketPriceStatus(selected.status ?? null)
        setIsExchangeRateLoading(false)
        if (selected.status === "stale") {
          setPriceType("fixed")
        }
      }
      // Partial all-currency maps may omit the selected currency; keep loading
      // until a later tick / settle timeout (mirrors mobile accumulate behaviour).
    })

    return () => {
      clearTimeout(joinTimer)
      clearTimeout(settleTimer)
      unsubscribe()
    }
  }, [isLoadingInitialData, isConnected, buyCurrency, forCurrency, subscribe, requestExchangeRate])

  // Auto-fill fixed rate from WS exchange rate (create / switch to fixed / currency change).
  useEffect(() => {
    if (priceType !== "fixed" || marketPrice == null) {
      prevPriceTypeRef.current = priceType
      return
    }

    // Guard: marketPrice belongs to a different currency (stale from previous selection).
    // This prevents the old rate from bleeding into the newly selected currency's field
    // before the rate-loading effect has had a chance to clear marketPrice.
    if (marketPriceCurrency !== forCurrency) {
      return
    }

    const pairKey = `${buyCurrency}:${forCurrency}`
    const switchedToFixed = prevPriceTypeRef.current !== "fixed"
    prevPriceTypeRef.current = priceType

    if (isEditMode && !switchedToFixed && lastAutoFillPairRef.current === null && fixedRate) {
      // Preserve loaded edit rate on mount.
      lastAutoFillPairRef.current = pairKey
      return
    }

    if (userEditedFixedRateRef.current && !switchedToFixed && lastAutoFillPairRef.current === pairKey) {
      return
    }

    const shouldAutofill =
      switchedToFixed ||
      !fixedRate ||
      lastAutoFillPairRef.current !== pairKey

    if (!shouldAutofill) return

    setFixedRate(formatMarketRateForInput(marketPrice))
    lastAutoFillPairRef.current = pairKey
    if (switchedToFixed) {
      userEditedFixedRateRef.current = false
    }
  }, [marketPrice, marketPriceCurrency, priceType, buyCurrency, forCurrency, isEditMode, fixedRate, fixedRateDecimals])

  useEffect(() => {
    if (initialData) {
      if (initialData.type) setType(initialData.type as "buy" | "sell")
      if (initialData.priceType !== undefined) setPriceType(initialData.priceType)
      if (initialData.fixedRate !== undefined) {
        setFixedRate(initialData.fixedRate.toString())
        userEditedFixedRateRef.current = true
      }
      if (initialData.floatingRate !== undefined) setFloatingRate(initialData.floatingRate.toString())
      if (initialData.forCurrency !== undefined) setForCurrency(initialData.forCurrency.toString())
      if (initialData.buyCurrency !== undefined) setBuyCurrency(initialData.buyCurrency.toString())
    }
  }, [initialData])

  useEffect(() => {
    const errors: ValidationErrors = {}
    const rate = priceType === "fixed" ? Number(fixedRate) : Number(floatingRate)

    if (touched.fixedRate && priceType === "fixed") {
      if (!fixedRate) {
        errors.fixedRate = t("adForm.rateRequired")
      } else if (!Number.isFinite(rate) || rate <= 0) {
        errors.fixedRate = t("adForm.rateGreaterThanZero")
      } else if (
        marketPrice != null &&
        marketPrice > 0 &&
        (rate < marketPrice / 2 || rate > marketPrice * 2)
      ) {
        errors.fixedRate = t("adForm.fixedRateOutOfRange")
      }
    }

    if (touched.floatingRate && priceType === "float") {
      if (!floatingRate) {
        errors.floatingRate = t("adForm.rateRequired")
      } else if (rate < -10 || rate > 10) {
        errors.floatingRate = t("adForm.floatingRateRangeError")
      }
    }

    setFormErrors(errors)
  }, [fixedRate, floatingRate, touched, priceType, marketPrice, t])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isExchangeRateLoading) return

    setTouched({
      fixedRate: true,
      floatingRate: true,
    })

    if (!isFormValid()) {
      onNext(buildFormData(), formErrors)
      return
    }

    onNext(buildFormData())
  }

  useEffect(() => {
    const isValid = !isExchangeRateLoading && isFormValid()
    const event = new CustomEvent("adFormValidationChange", {
      bubbles: true,
      detail: {
        isValid,
        formData: buildFormData(),
        marketPrice,
      },
    })
    document.dispatchEvent(event)
  }, [type, fixedRate, floatingRate, formErrors, priceType, forCurrency, buyCurrency, isExchangeRateLoading, marketPrice])


  useEffect(() => {
    if (!isFloatingRateEnabled && priceType === "float") {
      setPriceType("fixed")
    }
  }, [isFloatingRateEnabled, priceType])

  const handlePriceTypeChange = (next: "fixed" | "float") => {
    if (next === "fixed") {
      userEditedFixedRateRef.current = false
    }
    setPriceType(next)
  }

  const handleForCurrencyChange = (code: string) => {
    // Currency switch must replace any previous fixed rate with the new
    // market rate once it arrives — clear stale value + autofill guards now.
    userEditedFixedRateRef.current = false
    lastAutoFillPairRef.current = null
    if (priceType === "fixed") {
      setFixedRate("")
    }
    setForCurrency(code)
  }

  const yourRateValue =
    priceType === "fixed"
      ? fixedRate
        ? Number(fixedRate)
        : null
      : marketPrice != null && floatingRate
        ? marketPrice * (1 + (Number.parseFloat(floatingRate) || 0) / 100)
        : null

  const rateFractionDigits = FIXED_RATE_MAX_DECIMALS

  if (isLoadingInitialData) return <AdDetailsFormSkeleton />

  return (
    <div className="max-w-[800px] mx-auto">
      <form id="ad-details-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          {!isEditMode && (
            <div data-guide-id="ad-guide-trade-type">
              <TradeTypeSelector value={type} onChange={setType} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 mt-6">
            {/* Account currency is always USD for now — flip SHOW_ACCOUNT_CURRENCY_SELECTOR when multi-currency returns. */}
            {SHOW_ACCOUNT_CURRENCY_SELECTOR && (
              <div>
                <label className="block mb-2 text-slate-1200 text-sm font-normal leading-5">
                  {type === "buy" ? t("adForm.buyCurrency") : t("adForm.sellCurrency")}
                </label>
                <CurrencyFilter
                  contentClassName="w-[278px]"
                  currencies={accountCurrencies}
                  isTitleVisible={isMobile}
                  selectedCurrency={buyCurrency}
                  onCurrencySelect={setBuyCurrency}
                  title={type === "buy" ? t("adForm.buyCurrency") : t("adForm.sellCurrency")}
                  trigger={
                    <Button
                      variant="outline"
                      className="min-h-[48px] gap-2 min-w-[96px] w-full h-[56px] max-h-[56px] rounded-lg justify-between px-4 border border-gray-200 hover:bg-transparent font-normal bg-transparent"
                      disabled
                      data-testid="ad-form-select-account-currency"
                    >
                      <div className="flex items-center gap-2">
                        {currencyFlagMapper[buyCurrency as keyof typeof currencyFlagMapper] && (
                          <Image
                            src={
                              currencyFlagMapper[buyCurrency as keyof typeof currencyFlagMapper] || "/placeholder.svg"
                            }
                            alt={`${buyCurrency} logo`}
                            width={24}
                            height={16}
                            className="me-1 object-cover"
                          />
                        )}
                        <span>{buyCurrency}</span>
                      </div>
                      <Image
                        src="/icons/chevron-down.png"
                        alt={t("common.arrow")}
                        width={24}
                        height={24}
                        className="ms-2 transition-transform duration-200"
                      />
                    </Button>
                  }
                />
              </div>
            )}

            <div data-guide-id="ad-guide-currency">
              <label className="block mb-2 text-slate-1200 text-sm font-normal leading-5">
                {type === "buy" ? t("market.payWith") : t("market.receiveIn")}
              </label>
              <CurrencyFilter
                contentClassName="w-[278px]"
                currencies={currenciesProp.map((c) => ({
                  code: c.code,
                  name: c.name ?? c.code,
                }))}
                isTitleVisible={isMobile}
                selectedCurrency={forCurrency}
                onCurrencySelect={handleForCurrencyChange}
                title={type === "buy" ? t("market.payWith") : t("market.receiveIn")}
                triggerTestId="ad-form-select-payment-currency"
                triggerClassName="!h-14 !px-4"
              />
            </div>
          </div>
        </div>

        <div data-guide-id="ad-guide-rate">
          {isExchangeRateLoading ? (
            <RateSectionSkeleton />
          ) : (
            <>
              <PriceTypeSelector
                marketPrice={marketPrice}
                value={priceType}
                onChange={handlePriceTypeChange}
                disabled={isEditMode}
                isFloatingRateEnabled={isFloatingRateEnabled}
              />

              <div className="mt-4">
                <div className="grid gap-4">
                  {priceType === "fixed" ? (
                    <div>
                      <RateInput
                        currency={forCurrency}
                        label={t("adForm.ratePerCurrency", { currency: buyCurrency })}
                        value={fixedRate}
                        onChange={(value) => {
                          userEditedFixedRateRef.current = true
                          if (value === "") {
                            setFixedRate("")
                            setTouched((prev) => ({ ...prev, fixedRate: true }))
                            return
                          }

                          if (getDecimalPlaces(value) > maxFixedRateDecimals()) {
                            return
                          }

                          setFixedRate(value)
                          setTouched((prev) => ({ ...prev, fixedRate: true }))
                        }}
                        onBlur={() => setTouched((prev) => ({ ...prev, fixedRate: true }))}
                        error={touched.fixedRate && !!formErrors.fixedRate}
                      />
                      {touched.fixedRate && formErrors.fixedRate && (
                        <p className="text-destructive text-xs mt-1 ms-4" data-testid="ad-form-error-rate">
                          {formErrors.fixedRate}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <FloatingRateInput
                        value={floatingRate}
                        onChange={setFloatingRate}
                        onBlur={() => setTouched((prev) => ({ ...prev, floatingRate: true }))}
                        error={touched.floatingRate && !!formErrors.floatingRate}
                        errorMsg={formErrors.floatingRate}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full min-w-0">
                <RateInfoRow
                  label={t("adForm.yourRate")}
                  value={yourRateValue}
                  currency={forCurrency}
                  fractionDigits={rateFractionDigits}
                />
                <RateInfoRow
                  label={t("adForm.currentExchangeRate")}
                  value={marketPrice}
                  currency={forCurrency}
                  fractionDigits={rateFractionDigits}
                />
                <RateInfoRow
                  label={t("adForm.lowestAdRate")}
                  value={priceRange.lowestPrice}
                  currency={forCurrency}
                  fractionDigits={rateFractionDigits}
                />
                <RateInfoRow
                  label={t("adForm.highestAdRate")}
                  value={priceRange.highestPrice}
                  currency={forCurrency}
                  fractionDigits={rateFractionDigits}
                />
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
