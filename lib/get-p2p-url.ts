/**
 * Get the correct P2P URL based on the current domain
 * - .com domain → p2p.deriv.com
 * - .me domain → p2p.deriv.me
 * - .be domain → p2p.deriv.be
 * - Staging mode → staging-p2p.deriv.[tld]
 */
export function getP2pUrl(isProduction: boolean = true): string {
  let baseDomain: string

  if (typeof window === "undefined") {
    // Server-side: default to .com domain
    baseDomain = "deriv.com"
  } else {
    const domain = window.location.hostname
    const tld = domain.split(".").pop()?.toLowerCase()

    switch (tld) {
      case "me":
        baseDomain = "deriv.me"
        break
      case "be":
        baseDomain = "deriv.be"
        break
      case "com":
      default:
        baseDomain = "deriv.com"
        break
    }
  }

  if (isProduction) {
    return `https://p2p.${baseDomain}`
  } else {
    return `https://staging-p2p.${baseDomain}`
  }
}
