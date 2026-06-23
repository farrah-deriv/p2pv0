"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { AdFormData } from "../types"
import { CurrencyInput } from "./ui/currency-input"
import { RateInput } from "./ui/rate-input"
import { PriceTypeSelector } from "./ui/price-type-selector"
import { FloatingRateInput } from "./ui/floating-rate-input"
import { TradeTypeSelector } from "./ui/trade-type-selector"
import { useAccountCurrencies } from "@/hooks/use-account-currencies"
import { useSettings, useAdvertStats } from "@/hooks/use-api-queries"
import Image from "next/image"
import { currencyFlagMapper } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { AdDetailsFormSkeleton } from "./ui/ad-details-form-skeleton"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { CurrencyFilter } from "@/components/currency-filter/currency-filter"

interface AdDetailsFormProps {
  onNext: (data: Partial<AdFormData>, errors?: ValidationErrors) => void
  initialData?: Partial<AdFormData>
  isEditMode?: boolean
  currencies?: Array<{ code: string }>
}

interface ValidationErrors {
  totalAmount?: string
  fixedRate?: string
  floatingRate?: string
  minAmount?: string
  maxAmount?: string
}

interface PriceRange {
  lowestPrice: number | null
  highestPrice: number | null
}

export default function AdDetailsForm({
  onNext,
  initialData,
  isLoadingInitialData,
  isEditMode,
  currencies: currenciesProp,
}: AdDetailsFormProps) {
  const { t } = useTranslations()
  const [type, setType] = useState<"buy" | "sell">(initialData?.type || "buy")
  const [priceType, setPriceType] = useState<"fixed" | "float">(initialData?.priceType || "fixed")
  const [totalAmount, setTotalAmount] = useState(initialData?.totalAmount?.toString() || "")
  const [fixedRate, setFixedRate] = useState(initialData?.fixedRate?.toString() || "")
  const [floatingRate, setFloatingRate] = useState(initialData?.floatingRate?.toString() || "0.01")
  const [minAmount, setMinAmount] = useState(initialData?.minAmount?.toString() || "")
  const [maxAmount, setMaxAmount] = useState(initialData?.maxAmount?.toString() || "")
  const [buyCurrency, setBuyCurrency] = useState(initialData?.buyCurrency?.toString() || "USD")
  const [forCurrency, setForCurrency] = useState(initialData?.forCurrency?.toString() || currenciesProp[0]?.code)
  const { accountCurrencies } = useAccountCurrencies()
  const [formErrors, setFormErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState({
    totalAmount: false,
    fixedRate: false,
    minAmount: false,
    maxAmount: false,
    floatingRate: false,
  })
  const [isFloatingRateEnabled, setIsFloatingRateEnabled] = useState(false)
  const [marketPrice, setMarketPrice] = useState<number | null>(null)
  const [priceRange, setPriceRange] = useState<PriceRange>({ lowestPrice: null, highestPrice: null })
  const [buyCurrencyOpen, setBuyCurrencyOpen] = useState(false)
  const [forCurrencyOpen, setForCurrencyOpen] = useState(false)

  const isMobile = useIsMobile()
  const { isConnected, joinExchangeRatesChannel, subscribe, requestExchangeRate } = useWebSocketContext()
  const { data: settings } = useSettings()
  const { data: advertStats, isLoading: isLoadingAdvertStats } = useAdvertStats(buyCurrency, !!buyCurrency)

  const getDecimalPlaces = (value: string): number => {
    const decimalPart = value.split(".")[1]
    return decimalPart ? decimalPart.length : 0
  }

  const getDecimalConstraints = (currency: string): { minimum: number; maximum: number } | null => {
    if (!currency || !accountCurrencies || accountCurrencies.length === 0) return null
    const currencyData = accountCurrencies.find((c) => c.code === currency)
    return currencyData?.decimal || null
  }

  const isFormValid = () => {
    const hasValues =
      !!totalAmount && (priceType === "fixed" ? !!fixedRate : !!floatingRate) && !!minAmount && !!maxAmount
    const hasNoErrors = Object.keys(formErrors).length === 0
    return hasValues && hasNoErrors
  }

  useEffect(() => {
    if (!isEditMode && currenciesProp.length > 0) {
      setForCurrency(currenciesProp[0].code)
    }
  }, [currenciesProp])

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
            } else {
              lowestPrice = currencyStats.buy_float_minimum_rate
                ? (marketPrice * (1 + Number.parseFloat(currencyStats.buy_float_minimum_rate) / 100))
                : null
              highestPrice = currencyStats.buy_float_maximum_rate
                ? (marketPrice * (1 + Number.parseFloat(currencyStats.buy_float_maximum_rate) / 100))
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
            } else {
              lowestPrice = currencyStats.sell_float_minimum_rate
                ? (marketPrice * (1 + Number.parseFloat(currencyStats.sell_float_minimum_rate) / 100))
                : null
              highestPrice = currencyStats.sell_float_maximum_rate
                ? (marketPrice * (1 + Number.parseFloat(currencyStats.sell_float_maximum_rate) / 100))
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
      } catch (error) {
        setPriceRange({ lowestPrice: null, highestPrice: null })
      }
    }

    if (!buyCurrency || !forCurrency || !marketPrice) return
    fetchPriceRange()
  }, [buyCurrency, forCurrency, priceType, type, marketPrice, advertStats])

  useEffect(() => {
    if (!isConnected || !buyCurrency) return

    joinExchangeRatesChannel(buyCurrency)
  }, [isConnected, buyCurrency, joinExchangeRatesChannel])

  useEffect(() => {
    if (isLoadingInitialData || !isConnected || !buyCurrency) return

    const requestTimer = setTimeout(() => {
      requestExchangeRate(buyCurrency)
    }, 400)

    const unsubscribe = subscribe((data: any) => {
      if (data.options?.channel === `exchange_rates/${buyCurrency}`) {
        if (data.payload?.[forCurrency]?.rate) {
          if (data.payload[forCurrency].status === "stale") {
            setMarketPrice(null)
            setPriceType("fixed")
          } else {
            setMarketPrice(data.payload[forCurrency].rate)
          }
        } else if (data.action === "event") {
          if (data.payload?.data[forCurrency]?.rate) {
            if (data.payload.data[forCurrency].status === "stale") {
              setMarketPrice(null)
              setPriceType("fixed")
            } else {
              setMarketPrice(data.payload.data[forCurrency].rate)
            }
          }
        } else {
          setMarketPrice(null)
          setPriceType("fixed")
        }
      } else if (data.action === "error") {
        setMarketPrice(null)
      }
    })

    return () => {
      clearTimeout(requestTimer)
      unsubscribe()
    }
  }, [isLoadingInitialData, isConnected, buyCurrency, forCurrency, subscribe, requestExchangeRate])

  useEffect(() => {
    if (initialData) {
      if (initialData.type) setType(initialData.type as "buy" | "sell")
      if (initialData.totalAmount !== undefined) setTotalAmount(initialData.totalAmount.toString())
      if (initialData.priceType !== undefined) setPriceType(initialData.priceType.toString())
      if (initialData.fixedRate !== undefined) setFixedRate(initialData.fixedRate.toString())
      if (initialData.floatingRate !== undefined) setFloatingRate(initialData.floatingRate.toString())
      if (initialData.minAmount !== undefined) setMinAmount(initialData.minAmount.toString())
      if (initialData.maxAmount !== undefined) setMaxAmount(initialData.maxAmount.toString())
      if (initialData.forCurrency !== undefined) setForCurrency(initialData.forCurrency.toString())
      if (initialData.buyCurrency !== undefined) setBuyCurrency(initialData.buyCurrency.toString())
    }
  }, [initialData])

  useEffect(() => {
    const errors: ValidationErrors = {}
    const total = Number(totalAmount)
    const min = Number(minAmount)
    const max = Number(maxAmount)
    const rate = priceType === "fixed" ? Number(fixedRate) : Number(floatingRate)

    if (touched.totalAmount) {
      if (!totalAmount) {
        errors.totalAmount = t("adForm.totalAmountRequired")
      } else if (total <= 0) {
        errors.totalAmount = t("adForm.totalAmountGreaterThanZero")
      }
    }

    if (min > total) {
      errors.minAmount = t("adForm.minAmountLessThanTotal")
    }

    if (max > total) {
      errors.maxAmount = t("adForm.maxAmountLessThanTotal")
    }

    if (touched.fixedRate && priceType === "fixed") {
      if (!fixedRate) {
        errors.fixedRate = t("adForm.rateRequired")
      } else if (rate <= 0) {
        errors.fixedRate = t("adForm.rateGreaterThanZero")
      }
    }

    if (touched.floatingRate && priceType === "float") {
      if (!floatingRate) {
        errors.floatingRate = t("adForm.rateRequired")
      } else if (rate < -10 || rate > 10) {
        errors.floatingRate = t("adForm.floatingRateRangeError")
      }
    }

    if (touched.minAmount) {
      if (!minAmount) {
        errors.minAmount = t("adForm.minAmountRequired")
      } else if (min <= 0) {
        errors.minAmount = t("adForm.minAmountGreaterThanZero")
      }
    }

    if (touched.minAmount && touched.maxAmount && min > max) {
      errors.minAmount = t("adForm.minAmountLessThanMax")
      errors.maxAmount = t("adForm.maxAmountGreaterThanMin")
    }

    if (touched.maxAmount) {
      if (!maxAmount) {
        errors.maxAmount = t("adForm.maxAmountRequired")
      } else if (max <= 0) {
        errors.maxAmount = t("adForm.maxAmountGreaterThanZero")
      }
    }

    setFormErrors(errors)
  }, [totalAmount, fixedRate, floatingRate, minAmount, maxAmount, touched, priceRange, forCurrency, priceType, t])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    setTouched({
      totalAmount: true,
      fixedRate: true,
      minAmount: true,
      maxAmount: true,
      forCurrency,
      floatingRate: true,
    })

    const total = Number(totalAmount)
    const min = Number(minAmount)
    const max = Number(maxAmount)

    const additionalErrors: ValidationErrors = {}

    if (min > total) {
      additionalErrors.minAmount = t("adForm.minAmountLessThanTotal")
    }

    if (max > total) {
      additionalErrors.maxAmount = t("adForm.maxAmountLessThanTotal")
    }

    if (min > max) {
      additionalErrors.minAmount = t("adForm.minAmountLessThanMax")
      additionalErrors.maxAmount = t("adForm.maxAmountGreaterThanMin")
    }

    const combinedErrors = { ...formErrors, ...additionalErrors }

    if (Object.keys(additionalErrors).length > 0) {
      setFormErrors(combinedErrors)
    }

    if (!isFormValid() || Object.keys(additionalErrors).length > 0) {
      const formData = {
        type,
        totalAmount: Number.parseFloat(totalAmount) || 0,
        fixedRate: priceType === "fixed" ? Number.parseFloat(fixedRate) || 0 : undefined,
        floatingRate: priceType === "float" ? Number.parseFloat(floatingRate) || 0 : undefined,
        priceType,
        minAmount: Number.parseFloat(minAmount) || 0,
        maxAmount: Number.parseFloat(maxAmount) || 0,
        forCurrency,
        buyCurrency,
      }

      onNext(formData, combinedErrors)
      return
    }

    const formData = {
      type,
      totalAmount: Number.parseFloat(totalAmount) || 0,
      fixedRate: priceType === "fixed" ? Number.parseFloat(fixedRate) || 0 : undefined,
      floatingRate: priceType === "float" ? Number.parseFloat(floatingRate) || 0 : undefined,
      priceType,
      minAmount: Number.parseFloat(minAmount) || 0,
      maxAmount: Number.parseFloat(maxAmount) || 0,
      forCurrency,
      buyCurrency,
    }

    onNext(formData)
  }

  useEffect(() => {
    const isValid = isFormValid()
    const event = new CustomEvent("adFormValidationChange", {
      bubbles: true,
      detail: {
        isValid,
        formData: {
          type,
          totalAmount: Number.parseFloat(totalAmount) || 0,
          fixedRate: priceType === "fixed" ? Number.parseFloat(fixedRate) || 0 : undefined,
          floatingRate: priceType === "float" ? Number.parseFloat(floatingRate) || 0 : undefined,
          priceType,
          minAmount: Number.parseFloat(minAmount) || 0,
          maxAmount: Number.parseFloat(maxAmount) || 0,
          forCurrency,
          buyCurrency,
        },
      },
    })
    document.dispatchEvent(event)
  }, [type, totalAmount, fixedRate, floatingRate, minAmount, maxAmount, formErrors, priceType])

  useEffect(() => {
    if (settings) {
      setIsFloatingRateEnabled(settings.float_rate_enabled === true)
    }
  }, [settings])

  if (isLoadingInitialData) return <AdDetailsFormSkeleton />

  return (
    <div className="max-w-[800px] mx-auto">
      <form id="ad-details-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          {!isEditMode && (<TradeTypeSelector value={type} onChange={setType} />)}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
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

            <div>
              <label className="block mb-2 text-slate-1200 text-sm font-normal leading-5">
                {type === "buy" ? t("market.payWith") : t("market.receiveIn")}
              </label>
              <CurrencyFilter
                contentClassName="w-[278px]"
                currencies={currenciesProp}
                isTitleVisible={isMobile}
                selectedCurrency={forCurrency}
                onCurrencySelect={setForCurrency}
                title={type === "buy" ? t("market.payWith") : t("market.receiveIn")}
                trigger={
                  <Button
                    variant="outline"
                    className="min-h-[48px] gap-2 min-w-[96px] w-full h-[56px] max-h-[56px] rounded-lg justify-between px-4 border border-gray-200 hover:bg-transparent font-normal bg-transparent"
                  >
                    <div className="flex items-center gap-2">
                      {currencyFlagMapper[forCurrency as keyof typeof currencyFlagMapper] && (
                        <Image
                          src={
                            currencyFlagMapper[forCurrency as keyof typeof currencyFlagMapper] || "/placeholder.svg"
                          }
                          alt={`${forCurrency} logo`}
                          width={24}
                          height={16}
                          className="me-1 object-cover"
                        />
                      )}
                      <span>{forCurrency}</span>
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
          </div>

          <div className="border-b border-grayscale-200 mt-6"></div>
        </div>

        <div>
          <PriceTypeSelector
            marketPrice={marketPrice}
            value={priceType}
            onChange={setPriceType}
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
                      if (value === "") {
                        setFixedRate("")
                        setTouched((prev) => ({ ...prev, fixedRate: true }))
                        return
                      }

                      const decimalConstraints = getDecimalConstraints(buyCurrency)
                      if (decimalConstraints) {
                        const decimalPlaces = getDecimalPlaces(value)
                        if (decimalPlaces > decimalConstraints.maximum) {
                          return
                        }
                      }

                      setFixedRate(value)
                      setTouched((prev) => ({ ...prev, fixedRate: true }))
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, fixedRate: true }))}
                    error={touched.fixedRate && !!formErrors.fixedRate}
                  />
                  {touched.fixedRate && formErrors.fixedRate && (
                    <p className="text-destructive text-xs mt-1 ms-4">{formErrors.fixedRate}</p>
                  )}
                </div>
              ) : (
                <div>
                  <FloatingRateInput
                    value={floatingRate}
                    onChange={setFloatingRate}
                    onBlur={() => setTouched((prev) => ({ ...prev, floatingRate: true }))}
                    currency={forCurrency}
                    marketPrice={marketPrice || undefined}
                    error={touched.floatingRate && !!formErrors.floatingRate}
                    errorMsg={formErrors.floatingRate}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            {priceType === "fixed" && (
              <div className="flex items-center justify-between text-xs mt-4">
                <span className="text-grayscale-text-muted">{t("adForm.yourRate")}</span>
                {fixedRate ? (
                  <span className="text-slate-1200">
                    {Number(fixedRate).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    <span className="text-xs font-normal">{forCurrency}</span>
                  </span>
                ) : (
                  <span className="text-slate-1200">-</span>
                )}
              </div>
            )}
            <div className="flex items-center justify-between text-xs ">
              <span className="text-grayscale-text-muted">{t("adForm.lowestRateInMarket")}</span>
              {priceRange?.lowestPrice ? (
                <span className="text-slate-1200">
                  {priceRange.lowestPrice.toLocaleString(undefined, {
                    minimumFractionDigits: priceType === "float" ? 6 : 2,
                    maximumFractionDigits: priceType === "float" ? 6 : 2,
                  })}{" "}
                  <span className="text-xs font-normal">{forCurrency}</span>
                </span>
              ) : (
                <span className="text-slate-1200">-</span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs ">
              <span className="text-grayscale-text-muted">{t("adForm.highestRateInMarket")}</span>
              {priceRange?.highestPrice ? (
                <span className="text-slate-1200">
                  {priceRange.highestPrice.toLocaleString(undefined, {
                    minimumFractionDigits: priceType === "float" ? 6 : 2,
                    maximumFractionDigits: priceType === "float" ? 6 : 2
                  })}{" "}
                  <span className="text-xs font-normal">{forCurrency}</span>
                </span>
              ) : (
                <span className="text-slate-1200">-</span>
              )}
            </div>
          </div>

          <div className="border-b border-grayscale-200 mt-6"></div>
        </div>

        <div>
          <h3 className="text-lg font-bold leading-6 tracking-normal mb-4">{t("adForm.amountAndOrderLimit")}</h3>
          <div className="mb-4">
            <CurrencyInput
              value={totalAmount}
              onValueChange={(value) => {
                if (value === "") {
                  setTotalAmount("")
                  setTouched((prev) => ({ ...prev, totalAmount: true }))
                  return
                }

                const decimalConstraints = getDecimalConstraints(buyCurrency)
                if (decimalConstraints) {
                  const decimalPlaces = getDecimalPlaces(value)
                  if (decimalPlaces > decimalConstraints.maximum) {
                    return
                  }
                }

                setTotalAmount(value)
                setTouched((prev) => ({ ...prev, totalAmount: true }))
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, totalAmount: true }))}
              placeholder={type === "sell" ? t("adForm.sellQuantity") : t("adForm.buyQuantity")}
              isEditMode={isEditMode}
              error={touched.totalAmount && !!formErrors.totalAmount}
              currency={buyCurrency}
            />
            {touched.totalAmount && formErrors.totalAmount && (
              <p className="text-destructive text-xs mt-1 ms-4">{formErrors.totalAmount}</p>
            )}
          </div>
          <div className="flex flex-col md:flex-row md:items-baseline gap-4">
            <div>
              <CurrencyInput
                value={minAmount}
                onValueChange={(value) => {
                  if (value === "") {
                    setMinAmount("")
                    setTouched((prev) => ({ ...prev, minAmount: true }))
                    return
                  }

                  const decimalConstraints = getDecimalConstraints(buyCurrency)
                  if (decimalConstraints) {
                    const decimalPlaces = getDecimalPlaces(value)
                    if (decimalPlaces > decimalConstraints.maximum) {
                      return
                    }
                  }

                  setMinAmount(value)
                  setTouched((prev) => ({ ...prev, minAmount: true }))
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, minAmount: true }))}
                placeholder={t("adForm.minimumOrder")}
                error={touched.minAmount && !!formErrors.minAmount}
                currency={buyCurrency}
              />
              {touched.minAmount && formErrors.minAmount && (
                <p className="text-destructive text-xs mt-1 ms-4">{formErrors.minAmount}</p>
              )}
            </div>
            <div className="text-xl hidden md:block">~</div>
            <div>
              <CurrencyInput
                value={maxAmount}
                onValueChange={(value) => {
                  if (value === "") {
                    setMaxAmount("")
                    setTouched((prev) => ({ ...prev, maxAmount: true }))
                    return
                  }

                  const decimalConstraints = getDecimalConstraints(buyCurrency)
                  if (decimalConstraints) {
                    const decimalPlaces = getDecimalPlaces(value)
                    if (decimalPlaces > decimalConstraints.maximum) {
                      return
                    }
                  }

                  setMaxAmount(value)
                  setTouched((prev) => ({ ...prev, maxAmount: true }))
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, maxAmount: true }))}
                placeholder={t("adForm.maximumOrder")}
                error={touched.maxAmount && !!formErrors.maxAmount}
                currency={buyCurrency}
              />
              {touched.maxAmount && formErrors.maxAmount && (
                <p className="text-destructive text-xs mt-1 ms-4">{formErrors.maxAmount}</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
