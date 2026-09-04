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
import { AdDetailsFormSkeleton } from "./ui/ad-details-form-skeleton"
import { RateSectionSkeleton } from "./ui/rate-section-skeleton"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { CurrencyFilter } from "@/components/currency-filter/currency-filter"
import { calculateRecoveredFixedRate } from "@/lib/ads/exchange-rate-recovery"
import type { WizardExchangeRateState } from "../hooks/use-wizard-exchange-rate"

interface AdDetailsFormProps {
  onNext: (data: Partial<AdFormData>, errors?: ValidationErrors) => void
  onFormDataChange: (data: Partial<AdFormData>, isValid: boolean) => void
  initialData?: Partial<AdFormData>
  isEditMode?: boolean
  isLoadingInitialData?: boolean
  /**
   * The wizard has not settled which rate field belongs on screen yet — see
   * PendingRatePaint in multi-step-ad-form. Keeps the rate section skeletonised so a
   * floating input is never painted for a pair that has no floating rate.
   */
  isRateResolving?: boolean
  /**
   * The wizard has finished deriving the recovered fixed rate for this draft, so
   * whatever it handed over is final — even an empty field, which means no rate could
   * be recovered and the user is expected to type one. Autofill must never overwrite
   * it, or the value changes under the user after it has been painted.
   */
  isRecoveredRateFinal?: boolean
  currencies?: Array<{ code: string; name?: string }>
  exchangeRate: WizardExchangeRateState
}

interface ValidationErrors {
  fixedRate?: string
  floatingRate?: string
}

interface PriceRange {
  lowestPrice: number | null
  highestPrice: number | null
}

/** Flip to `true` when multi-currency account selection returns. */
const SHOW_ACCOUNT_CURRENCY_SELECTOR = false

const FIXED_RATE_MAX_DECIMALS = 6

function parseFloatingRatePercentage(value: unknown): number | null {
  if (value == null || value === "") return null
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : null
}

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
  onFormDataChange,
  initialData,
  isLoadingInitialData,
  isRateResolving,
  isRecoveredRateFinal,
  isEditMode,
  currencies: currenciesProp = [],
  exchangeRate,
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
  const marketPrice = exchangeRate.rate
  const marketPriceStatus = exchangeRate.status
  const isExchangeRateLoading = exchangeRate.isLoading
  const [priceRange, setPriceRange] = useState<PriceRange>({ lowestPrice: null, highestPrice: null })
  // Preserve any prefilled fixed rate (edit load OR stale-rate recovery) against autofill.
  // A final recovered rate is preserved the same way even when it is empty, which is
  // the whole point of isRecoveredRateFinal: an empty field there is a decision, not a
  // gap waiting to be filled.
  const userEditedFixedRateRef = useRef(!!initialData?.fixedRate || !!isRecoveredRateFinal)
  const lastAutoFillPairRef = useRef<string | null>(
    isRecoveredRateFinal ? `${buyCurrency}:${forCurrency}` : null,
  )
  // A draft downgraded from floating keeps its floatingRate (buildRecoveredRateFormData
  // spreads the previous draft), which is what makes the previous effective rate
  // recomputable. Autofilling the raw market rate into such a draft would show a
  // different number from the one the recovery set out to prefill.
  const recoveredFloatingRateRef = useRef<number | null>(
    initialData?.priceType === "fixed" ? parseFloatingRatePercentage(initialData?.floatingRate) : null,
  )
  const prevPriceTypeRef = useRef<"fixed" | "float">(initialData?.priceType || "fixed")
  const isMobile = useIsMobile()
  const { data: settings } = useSettings()
  const { data: advertStats } = useAdvertStats(buyCurrency, !!buyCurrency)

  // Match mobile: floating is available when the global setting is on, the selected
  // currency is not float-disabled, and an *active* exchange rate exists (checked in
  // PriceTypeSelector via marketPrice + marketPriceStatus). Advert-stats float bounds
  // only drive the lowest/highest market rows — they must not gate the rate-type
  // selector, or currencies with a live rate but no existing ads would hide Floating.
  //
  // If the user already selected Floating, keep the option available even if the
  // rate later becomes stale — do not force them back to Fixed mid-edit.
  const isFloatingRateEnabled = useMemo(() => {
    if (!settings?.float_rate_enabled) return false
    if (!forCurrency) return false
    // Only block *selecting* floating when the rate is stale/non-active.
    // Once Floating is already chosen, leave the selection alone.
    if (priceType !== "float") {
      if (marketPriceStatus === "stale") return false
      if (marketPriceStatus != null && marketPriceStatus !== "active") return false
    }

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
  }, [settings, forCurrency, marketPriceStatus, priceType])

  const formatMarketRateForInput = (rate: number): string => {
    const constraints = getDecimalConstraints(forCurrency || buyCurrency, accountCurrencies)
    const decimals = Math.min(constraints?.maximum ?? 2, FIXED_RATE_MAX_DECIMALS)
    return rate.toFixed(decimals)
  }

  // For a draft downgraded from floating the equivalent of the old ad is the effective
  // rate — market x (1 + pct/100) — not the market rate itself.
  const autoFillValueFor = (rate: number): string => {
    const floatingPercentage = recoveredFloatingRateRef.current
    if (floatingPercentage != null) {
      const recovered = calculateRecoveredFixedRate(rate, floatingPercentage, maxFixedRateDecimals())
      if (recovered != null) return recovered
    }
    return formatMarketRateForInput(rate)
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
    fixedRate:
      priceType === "fixed"
        ? fixedRate === "" ? "" : Number.parseFloat(fixedRate)
        : undefined,
    floatingRate: priceType === "float" ? Number.parseFloat(floatingRate) || 0 : undefined,
    priceType,
    forCurrency,
    buyCurrency,
  })

  useEffect(() => {
    const fetchPriceRange = () => {
      try {
        if (!Array.isArray(advertStats)) {
          setPriceRange((prev) => {
            if (prev.lowestPrice === null && prev.highestPrice === null) return prev
            return { lowestPrice: null, highestPrice: null }
          })
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

          setPriceRange((prev) => {
            if (prev.lowestPrice === lowestPrice && prev.highestPrice === highestPrice) {
              return prev
            }
            return { lowestPrice, highestPrice }
          })
        } else {
          setPriceRange((prev) => {
            if (prev.lowestPrice === null && prev.highestPrice === null) return prev
            return { lowestPrice: null, highestPrice: null }
          })
        }
      } catch {
        setPriceRange((prev) => {
          if (prev.lowestPrice === null && prev.highestPrice === null) return prev
          return { lowestPrice: null, highestPrice: null }
        })
      }
    }

    if (!buyCurrency || !forCurrency) return
    fetchPriceRange()
  }, [buyCurrency, forCurrency, priceType, type, marketPrice, advertStats])

  // Auto-fill fixed rate from WS exchange rate (create / switch to fixed / currency change).
  useEffect(() => {
    if (priceType !== "fixed" || marketPrice == null) {
      prevPriceTypeRef.current = priceType
      return
    }

    // Guard: marketPrice belongs to a different currency (stale from previous selection).
    // This prevents the old rate from bleeding into the newly selected currency's field
    // before the rate-loading effect has had a chance to clear marketPrice.
    if (exchangeRate.pairKey !== `${buyCurrency}:${forCurrency}`) {
      return
    }

    const pairKey = `${buyCurrency}:${forCurrency}`
    const switchedToFixed = prevPriceTypeRef.current !== "fixed"
    prevPriceTypeRef.current = priceType

    if (!switchedToFixed && fixedRate) {
      // Preserve an existing fixed rate. This covers edit prefill and the
      // recovered rate supplied when stale floating rate is downgraded.
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

    setFixedRate(autoFillValueFor(marketPrice))
    lastAutoFillPairRef.current = pairKey
    if (switchedToFixed) {
      userEditedFixedRateRef.current = false
    }
  }, [marketPrice, exchangeRate.pairKey, priceType, buyCurrency, forCurrency, isEditMode, fixedRate, fixedRateDecimals])

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

    setFormErrors((prev) => {
      const prevKeys = Object.keys(prev)
      const nextKeys = Object.keys(errors)
      if (
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[key as keyof ValidationErrors] === errors[key as keyof ValidationErrors])
      ) {
        return prev
      }
      return errors
    })
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
    onFormDataChange(
      buildFormData(),
      !isExchangeRateLoading && isFormValid(),
    )
  }, [
    type,
    fixedRate,
    floatingRate,
    formErrors,
    priceType,
    forCurrency,
    buyCurrency,
    isExchangeRateLoading,
    marketPrice,
    onFormDataChange,
  ])

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
    setFixedRate("")
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
              <TradeTypeSelector value={type} onChange={setType} currency={buyCurrency} />
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
                // Mobile parity: CreateEditAdPage1 locks the currency and rate type in
                // edit mode. handleForCurrencyChange stays for create mode.
                disabled={isEditMode}
              />
            </div>
          </div>
        </div>

        <div data-guide-id="ad-guide-rate">
          {isExchangeRateLoading || isRateResolving ? (
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
