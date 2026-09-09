import type { Ad } from "@/types"

type ShareAdTranslator = (
  key: string,
  params: Record<string, string>,
) => string

/** HTTPS ad URL for QR, copy field, and share messages — never deep links. */
export function buildAdUrl(ad: Ad, origin: string): string {
  const advertiserId = ad.user?.id ?? ad.advertiser_id
  return `${origin}/advertiser/${advertiserId}?adId=${ad.id}`
}

/** Rate string for share messages — mirrors Flutter share_ad_link.dart. */
export function buildShareAdRateValue(ad: Ad): string {
  if (ad.exchange_rate_type === "float" && ad.exchange_rate != null) {
    const prefix = ad.exchange_rate > 0 ? "+" : ""
    const rateStr =
      ad.exchange_rate === Math.trunc(ad.exchange_rate)
        ? String(Math.trunc(ad.exchange_rate))
        : String(ad.exchange_rate)
    return `${prefix}${rateStr}%`
  }
  return ad.rate?.value ?? ""
}

export function buildShareAdShareMessage(
  ad: Ad,
  adUrl: string,
  translate: ShareAdTranslator,
): string {
  return translate("shareAdPage.shareMessage", {
    currency: ad.account_currency ?? "",
    rate: buildShareAdRateValue(ad),
    url: adUrl,
  })
}

export function buildShareAdTelegramMessage(
  ad: Ad,
  translate: ShareAdTranslator,
): string {
  return translate("shareAdPage.shareTelegramMessage", {
    currency: ad.account_currency ?? "",
    rate: buildShareAdRateValue(ad),
  })
}
