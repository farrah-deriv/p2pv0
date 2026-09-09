import { P2P_MAINTENANCE_ALLOWED_ROOTS } from "@/lib/p2p-maintenance-constants"

/**
 * Maps a blocked pathname to the nearest allowed tab root.
 * Returns `null` when [pathname] is already allowed.
 */
export function p2pMaintenanceRedirectFor(pathname: string): string | null {
  const cleanPath = pathname.split("?")[0].split("#")[0]

  if ((P2P_MAINTENANCE_ALLOWED_ROOTS as readonly string[]).includes(cleanPath)) {
    return null
  }

  if (cleanPath === "/advertiser" || cleanPath.startsWith("/advertiser/")) {
    return "/"
  }
  if (cleanPath.startsWith("/orders/")) {
    return "/orders"
  }
  if (cleanPath.startsWith("/ads/")) {
    return "/ads"
  }
  if (cleanPath.startsWith("/wallet/")) {
    return "/wallet"
  }
  if (cleanPath.startsWith("/profile/")) {
    return "/profile"
  }

  return "/"
}
