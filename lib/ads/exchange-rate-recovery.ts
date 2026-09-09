export interface ExchangeRateUpdate {
  rate?: number
  status?: string
}

export interface StaleEpisodeState {
  pairKey: string | null
  unavailable: boolean
  notified: boolean
}

export const INITIAL_STALE_EPISODE_STATE: StaleEpisodeState = {
  pairKey: null,
  unavailable: false,
  notified: false,
}

function parseRateNumber(raw: unknown): number | undefined {
  if (raw == null || raw === "") return undefined
  const parsed = typeof raw === "number" ? raw : Number.parseFloat(String(raw))
  return Number.isFinite(parsed) ? parsed : undefined
}

function normalizeEntry(entry: unknown): ExchangeRateUpdate | null {
  if (!entry || typeof entry !== "object") return null
  const value = entry as Record<string, unknown>
  const rate = parseRateNumber(value.rate)
  const status = typeof value.status === "string" && value.status.trim()
    ? value.status.trim().toLowerCase()
    : undefined
  if (rate === undefined && status === undefined) return null
  return {
    ...(rate !== undefined ? { rate } : {}),
    ...(status !== undefined ? { status } : {}),
  }
}

export function extractExchangeRateUpdates(
  payload: unknown,
  channel: string | undefined,
  fallbackCurrency: string,
): Record<string, ExchangeRateUpdate> {
  if (!payload || typeof payload !== "object") return {}

  const value = payload as Record<string, unknown>
  const nested =
    value.data && typeof value.data === "object"
      ? value.data as Record<string, unknown>
      : null
  const updates: Record<string, ExchangeRateUpdate> = {}

  const ingestMap = (map: Record<string, unknown>) => {
    for (const [currency, entry] of Object.entries(map)) {
      if (currency === "data" || currency === "rate" || currency === "status") continue
      const normalized = normalizeEntry(entry)
      if (normalized) updates[currency] = normalized
    }
  }

  ingestMap(value)
  if (nested) ingestMap(nested)

  if (Object.keys(updates).length === 0) {
    const normalized = normalizeEntry(value) ?? normalizeEntry(nested)
    if (normalized) {
      const channelCurrency = channel?.split("/")[2]
      const currency = channelCurrency || fallbackCurrency
      if (currency) updates[currency] = normalized
    }
  }

  return updates
}

export function isExplicitlyUnavailableRate(status: string | null | undefined): boolean {
  return typeof status === "string" && status.trim() !== "" && status.toLowerCase() !== "active"
}

/**
 * The advert-level flag My ads already reads to render "Your ad isn't visible":
 * floating is no longer available for this advert's currency pair. Unlike the
 * websocket status it travels with the advert itself, so it is known before the
 * edit wizard's first paint.
 */
export const FLOAT_RATE_DISABLED_VISIBILITY_STATUS = "advert_float_rate_disabled"

export function hasFloatRateDisabledStatus(visibilityStatus: unknown): boolean {
  return (
    Array.isArray(visibilityStatus) &&
    visibilityStatus.some(
      (entry) =>
        typeof entry === "string" &&
        entry.trim().toLowerCase() === FLOAT_RATE_DISABLED_VISIBILITY_STATUS,
    )
  )
}

/**
 * Records a pair as already recovered, so the websocket status tick that arrives
 * later finds the episode closed and does not run a second, redundant recovery
 * (which would remount the form under the user for no visible reason).
 */
export function markStaleEpisodeHandled(pairKey: string): StaleEpisodeState {
  return { pairKey, unavailable: true, notified: true }
}

export function advanceStaleEpisode(
  previous: StaleEpisodeState,
  pairKey: string,
  status: string | null | undefined,
  shouldNotify: boolean,
): { state: StaleEpisodeState; notify: boolean } {
  const unavailable = isExplicitlyUnavailableRate(status)
  const samePair = previous.pairKey === pairKey
  const notified = samePair && unavailable ? previous.notified : false
  const notify = unavailable && shouldNotify && !notified

  return {
    state: {
      pairKey,
      unavailable,
      notified: notified || notify,
    },
    notify,
  }
}

/**
 * "none"    — nothing to do for this tick.
 * "notify"  — interrupt with the "Exchange rate outdated" dialog.
 * "recover" — downgrade the draft to fixed silently, no dialog.
 */
export type StaleRateRecoveryAction = "none" | "notify" | "recover"

/**
 * Decides how the wizard should react when the exchange rate for the current pair
 * turns out to be unavailable while the draft is still floating.
 *
 * The split is by mode, because the two situations are not the same event:
 * in create mode the user actively chose Floating and the feed went stale under
 * them, so a dialog is a fair interruption. In edit mode the advert was already
 * floating when it was opened, so the dialog fires on landing from nothing the
 * user did — and its advice is unreachable, since the rate-type selector is
 * disabled in edit mode and the currency dropdown sits behind the overlay. There
 * the only sensible outcome is the recovery itself, applied silently.
 *
 * Episode bookkeeping is shared with advanceStaleEpisode, so a recovery fires at
 * most once per pair and survives a currency round-trip.
 */
export function resolveStaleRateRecovery(
  previous: StaleEpisodeState,
  pairKey: string,
  status: string | null | undefined,
  options: { isFloatingDraft: boolean; mode: "create" | "edit" },
): { state: StaleEpisodeState; action: StaleRateRecoveryAction } {
  const { state, notify } = advanceStaleEpisode(previous, pairKey, status, options.isFloatingDraft)
  if (!notify) return { state, action: "none" }
  return { state, action: options.mode === "edit" ? "recover" : "notify" }
}

export function calculateRecoveredFixedRate(
  marketRate: number | null | undefined,
  floatingRate: number | string | null | undefined,
  paymentCurrencyDecimals: number,
): string | null {
  const percentage =
    typeof floatingRate === "number" ? floatingRate : Number.parseFloat(String(floatingRate ?? ""))
  if (
    marketRate == null ||
    !Number.isFinite(marketRate) ||
    !Number.isFinite(percentage)
  ) {
    return null
  }

  const decimals = Math.max(0, Math.min(paymentCurrencyDecimals, 6))
  return (marketRate * (1 + percentage / 100)).toFixed(decimals)
}

export function buildRecoveredRateFormData<T extends Record<string, unknown>>(
  current: T,
  marketRate: number | null | undefined,
  paymentCurrencyDecimals: number,
): T & { priceType: "fixed"; fixedRate: number | "" } {
  const recovered =
    calculateRecoveredFixedRate(
      marketRate,
      current.floatingRate as number | string | null | undefined,
      paymentCurrencyDecimals,
    ) ?? ""
  // Store as number so AdDetailsForm validation events (parseFloat) do not
  // oscillate string↔number against parent form sync.
  const fixedRate =
    recovered === "" ? "" : Number.parseFloat(recovered)

  return {
    ...current,
    priceType: "fixed",
    fixedRate: Number.isFinite(fixedRate) ? fixedRate : "",
  }
}

export function getAdvertRatePrefill(
  exchangeRate: string | number,
  exchangeRateType: "fixed" | "float",
): { fixedRate?: number; floatingRate: number | "" } {
  const parsed = Number.parseFloat(String(exchangeRate))
  const value = Number.isFinite(parsed) ? parsed : ""
  return exchangeRateType === "fixed"
    ? { fixedRate: value === "" ? undefined : value, floatingRate: "" }
    : { fixedRate: undefined, floatingRate: value }
}

export function isFloatingRateRecoveryError(
  errorCode: string,
  submittedPriceType: "fixed" | "float" | undefined,
): boolean {
  return submittedPriceType === "float" &&
    (errorCode === "InvalidExchangeRate" || errorCode === "AdvertFloatRateDisabled")
}
