export type MyAdsTab = "active" | "inactive"

export const MY_ADS_TAB_QUERY = "tab"
export const MY_ADS_FROM_TAB_QUERY = "fromTab"

export function parseMyAdsTab(value: string | null | undefined): MyAdsTab | undefined {
  if (value === "inactive") return "inactive"
  if (value === "active") return "active"
  return undefined
}

/** My Ads list path; include tab query only when returning to Inactive. */
export function myAdsPath(tab?: MyAdsTab): string {
  if (tab === "inactive") {
    return `/ads?${MY_ADS_TAB_QUERY}=inactive`
  }
  return "/ads"
}

/** Edit-ad entry path preserving the list tab the user came from. */
export function editAdPath(adId: string, fromTab?: MyAdsTab): string {
  const base = `/ads/edit/${adId}`
  if (fromTab === "inactive") {
    return `${base}?${MY_ADS_FROM_TAB_QUERY}=inactive`
  }
  return base
}
