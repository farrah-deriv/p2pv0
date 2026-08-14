/**
 * Get the correct socket URL based on the current domain
 * - .com domain → NEXT_PUBLIC_SOCKET_URL
 * - .me domain → NEXT_PUBLIC_SOCKET_ME_URL
 * - .be domain → NEXT_PUBLIC_SOCKET_BE_URL
 */
export function getSocketUrl(): string {
  if (typeof window === "undefined") {
    // Server-side: default to .com URL
    return process.env.NEXT_PUBLIC_SOCKET_URL || ""
  }

  // Local auth cookies belong to localhost, while the socket upstream is on a
  // Deriv domain. Route through the dev server so it can forward that cookie
  // during the WebSocket upgrade.
  if (process.env.NODE_ENV === "development") {
    return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/api/proxy/ws`
  }

  const domain = window.location.hostname
  const tld = domain.split(".").pop()?.toLowerCase()

  switch (tld) {
    case "me":
      return process.env.NEXT_PUBLIC_SOCKET_ME_URL || process.env.NEXT_PUBLIC_SOCKET_URL || ""
    case "be":
      return process.env.NEXT_PUBLIC_SOCKET_BE_URL || process.env.NEXT_PUBLIC_SOCKET_URL || ""
    case "com":
    default:
      return process.env.NEXT_PUBLIC_SOCKET_URL || ""
  }
}
