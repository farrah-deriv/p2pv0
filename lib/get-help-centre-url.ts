/**
 * Get the correct help centre URL based on the current domain
 * - .com domain → trade.deriv.com
 * - .me domain → trade.deriv.me
 * - .be domain → trade.deriv.be
 */
export function getHelpCentreUrl(locale?: string): string {
  let baseUrl: string

  if (typeof window === "undefined") {
    // Server-side: default to .com URL
    baseUrl = "https://trade.deriv.com"
  } else {
    const domain = window.location.hostname
    const tld = domain.split(".").pop()?.toLowerCase()

    switch (tld) {
      case "me":
        baseUrl = "https://trade.deriv.me"
        break
      case "be":
        baseUrl = "https://trade.deriv.be"
        break
      case "com":
      default:
        baseUrl = "https://trade.deriv.com"
        break
    }
  }

  // Append locale to URL if provided and not "en"
  if (locale && locale !== "en") {
    return `${baseUrl}/${locale}`
  }

  return baseUrl
}
