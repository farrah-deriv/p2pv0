import type { Advertisement } from "@/services/api/api-buy-sell"

/**
 * Rate half of an advert `update` frame. The order sheet keeps it apart from the
 * non-rate half because a rate move alone is confirmed through its own dialog.
 */
export type PendingRateUpdate = {
  effective_rate: number
  effective_rate_display: number
  version: number
}

type ApplyPendingAdvertUpdateArgs = {
  localAd: Advertisement
  pendingAdvertUpdate: Advertisement
  /** Set when the same seller save also moved the rate. */
  pendingRateUpdate: PendingRateUpdate | null
}

/**
 * Merge the pending advert terms — and, when the seller changed the rate in the
 * same save, the pending rate — into one advert state.
 *
 * A seller who edits the rate *and* a non-rate field in a single save produces
 * two pending states from one frame. The "Ad updated" sheet wins, so the rate has
 * to ride along with it: applying only the non-rate fields would leave the sheet
 * quoting the pre-edit price and then ambush the buyer with a "Rate updated"
 * dialog after they had already tapped Place order.
 *
 * The newer of the two versions is carried so the submitted `advert_version` is
 * not stale. Frame order is not guaranteed, hence the max rather than a
 * preference for either side.
 */
export function applyPendingAdvertUpdate({
  localAd,
  pendingAdvertUpdate,
  pendingRateUpdate,
}: ApplyPendingAdvertUpdateArgs): Advertisement {
  const merged: Advertisement = {
    ...localAd,
    minimum_order_amount: pendingAdvertUpdate.minimum_order_amount,
    actual_maximum_order_amount: pendingAdvertUpdate.actual_maximum_order_amount,
    description: pendingAdvertUpdate.description,
    payment_methods: pendingAdvertUpdate.payment_methods,
    payment_method_names: pendingAdvertUpdate.payment_method_names,
    order_expiry_period: pendingAdvertUpdate.order_expiry_period,
    version: pendingAdvertUpdate.version,
  }

  if (!pendingRateUpdate) return merged

  return {
    ...merged,
    effective_rate: pendingRateUpdate.effective_rate,
    effective_rate_display: pendingRateUpdate.effective_rate_display,
    version: pickNewerVersion(pendingAdvertUpdate.version, pendingRateUpdate.version),
  }
}

const pickNewerVersion = (advertVersion?: number, rateVersion?: number) => {
  if (advertVersion == null) return rateVersion
  if (rateVersion == null) return advertVersion
  return Math.max(advertVersion, rateVersion)
}
