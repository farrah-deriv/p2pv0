"use client"

import { useMemo } from "react"
import { useTranslations } from "@/lib/i18n/use-translations"
import { formatPaymentMethodName, cn } from "@/lib/utils"
import { IS_AD_CONDITIONS_ENABLED } from "@/lib/utils"
import type { AdFormData } from "@/app/ads/types"
import type { AdvertEditSnapshot } from "@/lib/ads/advert-edit-patch"
import { normalizeTradeBandForComparison } from "@/lib/ads/advert-edit-patch"

interface AvailablePaymentMethod {
  display_name: string
  type: string
  method: string
}

interface UserPaymentMethod {
  id: string
  display_name: string
  method: string
}

interface AdReviewSummaryProps {
  formData: Partial<AdFormData>
  orderTimeLimit: number
  selectedCountries: string[]
  minimumJoinedDays: number | null
  minimumCompletionRate30Day: number | null
  minimumTradeBand: string | null
  adVisibility: string
  showVisibility: boolean
  selectedPaymentMethodIds: (string | number)[]
  availablePaymentMethods: AvailablePaymentMethod[]
  userPaymentMethods: UserPaymentMethod[]
  originalEditSnapshot: AdvertEditSnapshot | null
  isEditMode: boolean
  marketPrice?: number | null
  className?: string
}

interface SummaryItem {
  label: string
  value: string
  changed: boolean
  stacked?: boolean
}

interface SummarySection {
  title: string
  items: SummaryItem[]
}

const doublesEqual = (a: number, b: number) => Math.abs(a - b) < 1e-9

function listsEqual(a: string[], b: string[]) {
  const sa = [...a].sort()
  const sb = [...b].sort()
  return sa.length === sb.length && sa.every((v, i) => v === sb[i])
}

function intListsEqual(a: number[], b: number[]) {
  const sa = [...a].sort((x, y) => x - y)
  const sb = [...b].sort((x, y) => x - y)
  return sa.length === sb.length && sa.every((v, i) => v === sb[i])
}

export function AdReviewSummary({
  formData,
  orderTimeLimit,
  selectedCountries,
  minimumJoinedDays,
  minimumCompletionRate30Day,
  minimumTradeBand,
  adVisibility,
  showVisibility,
  selectedPaymentMethodIds,
  availablePaymentMethods,
  userPaymentMethods,
  originalEditSnapshot,
  isEditMode,
  marketPrice = null,
  className,
}: AdReviewSummaryProps) {
  const { t } = useTranslations()
  const showHighlights = isEditMode && originalEditSnapshot != null
  const isBuy = formData.type !== "sell"
  const account = formData.buyCurrency || "USD"
  const payment = formData.forCurrency || ""

  const sections = useMemo((): SummarySection[] => {
    const snap = originalEditSnapshot
    const changed = (test: (s: AdvertEditSnapshot) => boolean) =>
      showHighlights && snap != null && test(snap)

    const priceType = formData.priceType || "fixed"
    const rateTypeLabel = priceType === "float" ? t("adForm.floating") : t("adForm.fixed")
    const floatPct = Number(formData.floatingRate)
    const fixedRate = Number(formData.fixedRate)
    const effectiveFloat =
      priceType === "float" && marketPrice != null && Number.isFinite(floatPct)
        ? marketPrice * (1 + floatPct / 100)
        : null

    const rateValueLabel =
      priceType === "float"
        ? effectiveFloat != null
          ? `${formData.floatingRate}% · ${effectiveFloat.toFixed(6)} ${payment}`
          : `${formData.floatingRate}%`
        : `${formData.fixedRate} ${payment}`

    const paymentMethodsLabel = (() => {
      if (isBuy) {
        const keys = (formData.paymentMethods as string[]) || []
        if (keys.length === 0) return t("adForm.selected", { count: 0 })
        return keys
          .map((key) => {
            const found = availablePaymentMethods.find((m) => m.method === key)
            return found?.display_name || formatPaymentMethodName(key, t)
          })
          .join(", ")
      }
      const ids = selectedPaymentMethodIds.map(String)
      if (ids.length === 0) return t("adForm.selected", { count: 0 })
      return ids
        .map((id) => {
          const found = userPaymentMethods.find((m) => String(m.id) === id)
          return found?.display_name || id
        })
        .join(", ")
    })()

    const countriesLabel =
      selectedCountries.length === 0
        ? t("adForm.countryAll")
        : t("adForm.selected", { count: selectedCountries.length })

    const timeLabel =
      orderTimeLimit === 15
        ? t("adForm.timeLimit15Minutes")
        : orderTimeLimit === 30
          ? t("adForm.timeLimit30Minutes")
          : orderTimeLimit === 45
            ? t("adForm.timeLimit45Minutes")
            : orderTimeLimit === 60
              ? t("adForm.timeLimit60Minutes")
              : t("adForm.timeLimitMinutes", { minutes: orderTimeLimit })

    const joinedLabel =
      minimumJoinedDays == null
        ? t("adForm.conditionAny")
        : minimumJoinedDays === 15
          ? t("adForm.joinedMoreThan15Days")
          : minimumJoinedDays === 30
            ? t("adForm.joinedMoreThan30Days")
            : minimumJoinedDays === 60
              ? t("adForm.joinedMoreThan60Days")
              : t("adForm.joinedMoreThanDays", { days: minimumJoinedDays })

    const completionLabel =
      minimumCompletionRate30Day == null
        ? t("adForm.conditionAny")
        : minimumCompletionRate30Day === 50
          ? t("adForm.completionRate50Percent")
          : minimumCompletionRate30Day === 70
            ? t("adForm.completionRate70Percent")
            : minimumCompletionRate30Day === 90
              ? t("adForm.completionRate90Percent")
              : `${minimumCompletionRate30Day}%`

    const tierLabel = (() => {
      const band = normalizeTradeBandForComparison(minimumTradeBand)
      if (!band) return t("adForm.tierAllTiers")
      if (band === "silver") return t("adForm.tierSilverAndAbove")
      if (band === "gold") return t("adForm.tierGoldAndAbove")
      if (band === "diamond") return t("adForm.tierDiamondOnly")
      return t("adForm.tierAllTiers")
    })()

    const instructions = String(formData.instructions ?? "").trim() || "—"

    const typeRateItems: SummaryItem[] = [
      {
        label: t("adForm.reviewAdType"),
        value: isBuy
          ? t("common.buyCurrency", { currency: account })
          : t("common.sellCurrency", { currency: account }),
        changed: false,
      },
      {
        label: isBuy ? t("adForm.payingWith") : t("adForm.receiveIn"),
        value: payment || "—",
        changed: false,
      },
      {
        label: t("adForm.rate"),
        value: `${rateTypeLabel} · ${rateValueLabel}`,
        changed: changed(
          (s) =>
            priceType !== s.exchangeRateType ||
            !doublesEqual(
              priceType === "float" ? floatPct : fixedRate,
              s.exchangeRate,
            ),
        ),
      },
    ]

    const amountItems: SummaryItem[] = [
      {
        label: isBuy ? t("adForm.buyQuantity") : t("adForm.sellQuantity"),
        value: `${formData.totalAmount ?? "—"} ${account}`,
        changed: false,
      },
      {
        label: t("adForm.minimumOrder"),
        value: `${formData.minAmount ?? "—"} ${account}`,
        changed: changed(
          (s) => !doublesEqual(Number(formData.minAmount) || 0, s.minOrderAmount),
        ),
      },
      {
        label: t("adForm.maximumOrder"),
        value: `${formData.maxAmount ?? "—"} ${account}`,
        changed: changed(
          (s) => !doublesEqual(Number(formData.maxAmount) || 0, s.maxOrderAmount),
        ),
      },
      {
        label: t("adForm.paymentDetails"),
        value: paymentMethodsLabel,
        changed: changed((s) => {
          if (isBuy) {
            return !listsEqual(
              (formData.paymentMethods as string[]) || [],
              s.paymentMethodNames,
            )
          }
          const ids = selectedPaymentMethodIds
            .map(Number)
            .filter((n) => !Number.isNaN(n))
          return !intListsEqual(ids, s.paymentMethodIds)
        }),
      },
      {
        label: isBuy ? t("adForm.sellerInstructions") : t("adForm.buyerInstructions"),
        value: instructions,
        changed: changed(
          (s) => String(formData.instructions ?? "").trim() !== s.instructions,
        ),
        stacked: true,
      },
    ]

    const conditionItems: SummaryItem[] = [
      {
        label: t("adForm.orderTimeLimit"),
        value: timeLabel,
        changed: changed((s) => orderTimeLimit !== s.orderExpiryPeriod),
      },
      {
        label: t("adForm.country"),
        value: countriesLabel,
        changed: changed((s) => !listsEqual(selectedCountries, s.availableCountries)),
      },
    ]

    if (IS_AD_CONDITIONS_ENABLED) {
      conditionItems.push(
        {
          label: t("adForm.joinedMoreThan"),
          value: joinedLabel,
          changed: changed((s) => minimumJoinedDays !== s.minimumJoinedDays),
        },
        {
          label: t("adForm.completionRateMoreThan"),
          value: completionLabel,
          changed: changed((s) => {
            const a = minimumCompletionRate30Day
            const b = s.minimumCompletionRate30Day
            if (a == null && b == null) return false
            if (a == null || b == null) return true
            return !doublesEqual(a, b)
          }),
        },
      )
    } else {
      conditionItems.push({
        label: isBuy ? t("adForm.minimumSellerTier") : t("adForm.minimumBuyerTier"),
        value: tierLabel,
        changed: changed(
          (s) =>
            normalizeTradeBandForComparison(minimumTradeBand) !== s.minimumTradeBand,
        ),
      })
    }

    if (showVisibility) {
      conditionItems.push({
        label: t("adForm.adVisibility"),
        value:
          adVisibility === "closed-group"
            ? t("adForm.visibilityClosedGroup")
            : t("adForm.visibilityEveryone"),
        changed: changed(
          (s) => (adVisibility === "closed-group") !== s.isPrivate,
        ),
      })
    }

    return [
      { title: t("adForm.setTypeAndPrice"), items: typeRateItems },
      { title: t("adForm.setAmountAndPayment"), items: amountItems },
      { title: t("adForm.setAdConditions"), items: conditionItems },
    ]
  }, [
    formData,
    orderTimeLimit,
    selectedCountries,
    minimumJoinedDays,
    minimumCompletionRate30Day,
    minimumTradeBand,
    adVisibility,
    showVisibility,
    selectedPaymentMethodIds,
    availablePaymentMethods,
    userPaymentMethods,
    originalEditSnapshot,
    showHighlights,
    isBuy,
    account,
    payment,
    marketPrice,
    t,
  ])

  return (
    <div className={cn("space-y-6", className)} data-testid="ad-form-review-summary">
      <p className="text-base text-grayscale-text-muted text-start">
        {t("adForm.reviewAdSubtitle")}
      </p>

      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="mb-2 text-sm font-bold text-slate-1200 text-start">
            {section.title}
          </h3>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {section.items.map((item, i) => (
              <div key={`${section.title}-${item.label}`}>
                {i > 0 && <div className="border-t border-slate-200" />}
                <SummaryRow
                  label={item.label}
                  value={item.value}
                  changed={item.changed}
                  stacked={item.stacked}
                  changedLabel={t("adForm.reviewAdChanged")}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  changed,
  stacked,
  changedLabel,
}: {
  label: string
  value: string
  changed: boolean
  stacked?: boolean
  changedLabel: string
}) {
  return (
    <div
      className={cn(
        "px-4 py-4",
        changed && "border-s-[3px] border-s-notification-badge bg-notification-badge/[0.08]",
      )}
    >
      {stacked ? (
        <div className="flex flex-col items-start gap-2">
          <div>
            <div className="text-sm md:text-base text-slate-500 text-start">
              {label}
            </div>
            {changed && (
              <div className="mt-1 text-xs font-semibold text-notification-badge">{changedLabel}</div>
            )}
          </div>
          <div className="w-full text-sm md:text-base font-bold text-slate-1200 text-start whitespace-pre-wrap break-words">
            {value}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <div className="text-sm md:text-base text-slate-500 text-start">
              {label}
            </div>
            {changed && (
              <div className="mt-1 text-xs font-semibold text-notification-badge">{changedLabel}</div>
            )}
          </div>
          <div className="min-w-0 flex-1 text-sm md:text-base font-bold text-slate-1200 text-end break-words">
            {value}
          </div>
        </div>
      )}
    </div>
  )
}
