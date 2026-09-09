/** Same-origin BFF proxy used in local dev — see app/api/proxy/api/[...path]/route.ts */
const LOCAL_CORE_PROXY_PATH = "/api/proxy/api"

/**
 * Get the correct core URL based on the current domain
 * - local dev (browser) → same-origin BFF proxy, to avoid CORS
 * - .com domain → NEXT_PUBLIC_CORE_URL
 * - .me domain → NEXT_PUBLIC_CORE_ME_URL
 * - .be domain → NEXT_PUBLIC_CORE_BE_URL
 */
export function getCoreUrl(): string {
  if (typeof window === "undefined") {
    // Server-side: default to .com URL
    return process.env.NEXT_PUBLIC_CORE_URL || ""
  }

  // Compared inline rather than via isLocalDev() on purpose: webpack const-folds
  // `process.env.NODE_ENV` in place, so this whole branch — and the proxy path
  // literal — is eliminated from the production client bundle. Calling the helper
  // would leave the dead branch in the output. Keep in sync with lib/is-local-dev.ts.
  if (process.env.NODE_ENV === "development") {
    return LOCAL_CORE_PROXY_PATH
  }

  const domain = window.location.hostname
  const tld = domain.split(".").pop()?.toLowerCase()

  switch (tld) {
    case "me":
      return process.env.NEXT_PUBLIC_CORE_ME_URL || process.env.NEXT_PUBLIC_CORE_URL || ""
    case "be":
      return process.env.NEXT_PUBLIC_CORE_BE_URL || process.env.NEXT_PUBLIC_CORE_URL || ""
    case "com":
    default:
      return process.env.NEXT_PUBLIC_CORE_URL || ""
  }
}
