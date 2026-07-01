import type { AdFormData } from "@/app/ads/types"
import {
  MINIMUM_JOIN_DAYS_API_KEY,
  minimumCompletionRateForEditPatch,
  minimumJoinedDaysForEditPatch,
  normalizeMinimumCompletionRateForEditPrefill,
  normalizeMinimumJoinedDaysForEditPrefill,
} from "@/lib/ads/ad-condition-values"

export interface AdvertEditSnapshot {
  advertType: "buy" | "sell"
  minOrderAmount: number
  maxOrderAmount: number
  exchangeRate: number
  exchangeRateType: "fixed" | "float"
  orderExpiryPeriod: number
  availableCountries: string[]
  /** Restricted tier from original advert (`silver`/`gold`/`diamond`), or null when unrestricted. */
  minimumTradeBand: string | null
  minimumJoinedDays: number | null
  minimumCompletionRate30Day: number | null
  isPrivate: boolean
  instructions: string
  paymentMethodNames: string[]
  paymentMethodIds: number[]
}

/** Maps BE `bronze` and UI `null` to the same unrestricted value for diffing. */
export function normalizeTradeBandForComparison(
  band: string | null | undefined,
): string | null {
  if (!band || band === "bronze") return null
  return band
}

export function createAdvertEditSnapshot(params: {
  type: "buy" | "sell"
  minimumOrderAmount: number
  maximumOrderAmount: number
  exchangeRate: number
  exchangeRateType: "fixed" | "float"
  orderExpiryPeriod: number
  availableCountries?: string[] | null
  minimumTradeBand?: string | null
  minimumJoinedDays?: number | null
  minimumCompletionRate30Day?: number | null
  isPrivate: boolean
  description?: string | null
  paymentMethodNames: string[]
  paymentMethodIds: number[]
}): AdvertEditSnapshot {
  return {
    advertType: params.type,
    minOrderAmount: params.minimumOrderAmount,
    maxOrderAmount: params.maximumOrderAmount,
    exchangeRate: params.exchangeRate,
    exchangeRateType: params.exchangeRateType,
    orderExpiryPeriod: params.orderExpiryPeriod,
    availableCountries: params.availableCountries ?? [],
    minimumTradeBand: normalizeTradeBandForComparison(params.minimumTradeBand),
    minimumJoinedDays: normalizeMinimumJoinedDaysForEditPrefill(
      params.minimumJoinedDays,
      params.minimumTradeBand,
    ),
    minimumCompletionRate30Day: normalizeMinimumCompletionRateForEditPrefill(
      params.minimumCompletionRate30Day,
      params.minimumTradeBand,
    ),
    isPrivate: params.isPrivate,
    instructions: (params.description ?? "").trim(),
    paymentMethodNames: params.paymentMethodNames,
    paymentMethodIds: params.paymentMethodIds,
  }
}

export function buildCurrentEditState(
  formData: Partial<AdFormData>,
  options: {
    orderTimeLimit: number
    selectedCountries: string[]
    minimumJoinedDays: number | null
    minimumCompletionRate30Day: number | null
    isPrivate: boolean
    selectedPaymentMethodIds: (string | number)[]
  },
): AdvertEditSnapshot {
  const priceType = (formData.priceType as string) || "fixed"
  const exchangeRate =
    priceType === "float"
      ? Number(formData.floatingRate)
      : Number(formData.fixedRate)

  const paymentMethodIds = options.selectedPaymentMethodIds
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id))

  const advertType = (formData.type as "buy" | "sell") || "buy"

  return {
    advertType,
    minOrderAmount: Number(formData.minAmount) || 0,
    maxOrderAmount: Number(formData.maxAmount) || 0,
    exchangeRate: exchangeRate || 0,
    exchangeRateType: priceType as "fixed" | "float",
    orderExpiryPeriod: options.orderTimeLimit,
    availableCountries: options.selectedCountries,
    minimumTradeBand: null,
    minimumJoinedDays: options.minimumJoinedDays,
    minimumCompletionRate30Day: options.minimumCompletionRate30Day,
    isPrivate: options.isPrivate,
    instructions: String(formData.instructions ?? "").trim(),
    paymentMethodNames:
      advertType === "buy"
        ? ((formData.paymentMethods as string[]) ?? [])
        : [],
    paymentMethodIds: advertType === "sell" ? paymentMethodIds : [],
  }
}

const doublesEqual = (a: number, b: number) => Math.abs(a - b) < 1e-9

const nullableNumbersEqual = (a: number | null, b: number | null) => {
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return doublesEqual(a, b)
}

const stringListsEqual = (a: string[], b: string[]) => {
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.length === sortedB.length && sortedA.every((value, index) => value === sortedB[index])
}

const intListsEqual = (a: number[], b: number[]) => {
  const sortedA = [...a].sort((x, y) => x - y)
  const sortedB = [...b].sort((x, y) => x - y)
  return sortedA.length === sortedB.length && sortedA.every((value, index) => value === sortedB[index])
}

/** Builds a PATCH payload containing only advert fields that changed in edit mode. */
export function buildAdvertEditPatch(
  original: AdvertEditSnapshot,
  current: AdvertEditSnapshot,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {}

  if (!doublesEqual(current.minOrderAmount, original.minOrderAmount)) {
    patch.minimum_order_amount = current.minOrderAmount
  }

  if (!doublesEqual(current.maxOrderAmount, original.maxOrderAmount)) {
    patch.maximum_order_amount = current.maxOrderAmount
  }

  if (!doublesEqual(current.exchangeRate, original.exchangeRate)) {
    patch.exchange_rate = current.exchangeRate
  }

  if (current.exchangeRateType !== original.exchangeRateType) {
    patch.exchange_rate_type = current.exchangeRateType
  }

  if (current.orderExpiryPeriod !== original.orderExpiryPeriod) {
    patch.order_expiry_period = current.orderExpiryPeriod
  }

  if (!stringListsEqual(current.availableCountries, original.availableCountries)) {
    patch.available_countries = current.availableCountries
  }

  if (current.instructions !== original.instructions) {
    patch.description = current.instructions.length === 0 ? null : current.instructions
  }

  if (current.isPrivate !== original.isPrivate) {
    patch.is_private = current.isPrivate
  }

  if (current.minimumJoinedDays !== original.minimumJoinedDays) {
    patch[MINIMUM_JOIN_DAYS_API_KEY] = minimumJoinedDaysForEditPatch(
      current.minimumJoinedDays,
    )
  }

  if (
    !nullableNumbersEqual(
      current.minimumCompletionRate30Day,
      original.minimumCompletionRate30Day,
    )
  ) {
    patch.minimum_completion_rate_30day = minimumCompletionRateForEditPatch(
      current.minimumCompletionRate30Day,
    )
  }

  if (original.minimumTradeBand != null) {
    patch.minimum_trade_band = "bronze"
  }

  if (current.advertType === "buy") {
    if (!stringListsEqual(current.paymentMethodNames, original.paymentMethodNames)) {
      patch.payment_method_names = current.paymentMethodNames
    }
  } else if (!intListsEqual(current.paymentMethodIds, original.paymentMethodIds)) {
    patch.payment_method_ids = current.paymentMethodIds
  }

  return patch
}

export function hasAdvertEditChanges(
  original: AdvertEditSnapshot,
  current: AdvertEditSnapshot,
): boolean {
  if (original.minimumTradeBand != null) return true
  if (current.minimumJoinedDays !== original.minimumJoinedDays) return true
  if (
    !nullableNumbersEqual(
      current.minimumCompletionRate30Day,
      original.minimumCompletionRate30Day,
    )
  ) {
    return true
  }

  return Object.keys(buildAdvertEditPatch(original, current)).length > 0
}

/** Ensures edit PATCH always includes ad condition fields (mirrors mobile toEditPatchBody). */
export function finalizeAdvertEditPatch(
  patch: Record<string, unknown>,
  minimumJoinedDays: number | null,
  minimumCompletionRate30Day: number | null,
): Record<string, unknown> {
  return {
    ...patch,
    [MINIMUM_JOIN_DAYS_API_KEY]: minimumJoinedDaysForEditPatch(minimumJoinedDays),
    minimum_completion_rate_30day:
      minimumCompletionRateForEditPatch(minimumCompletionRate30Day),
  }
}

/** Normalizes only keys present on a partial PATCH payload. */
export function normalizeUpdateAdPayload(
  adData: Record<string, unknown>,
): Record<string, unknown> {
  const payload = { ...adData }

  if (Object.prototype.hasOwnProperty.call(payload, "payment_method_names")) {
    const names = payload.payment_method_names
    if (!Array.isArray(names)) {
      payload.payment_method_names = [String(names)]
    } else {
      payload.payment_method_names = names.map((method) => String(method))
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "payment_method_ids")) {
    if (payload.payment_method_ids == null) {
      payload.payment_method_ids = null
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, "available_countries")) {
    if (payload.available_countries == null) {
      payload.available_countries = null
    }
  }

  return payload
}
