/** Next.js public env var set in GitHub Actions / Cloudflare deploy. */
export const P2P_SYSTEM_MAINTENANCE_ENV_KEY = "NEXT_PUBLIC_P2P_SYSTEM_MAINTENANCE_ENABLED"

export const P2P_MAINTENANCE_ALLOWED_ROOTS = ["/", "/orders", "/ads", "/wallet", "/profile"] as const

/** Tab roots that show the system-maintenance banner (profile excluded). */
export const P2P_MAINTENANCE_BANNER_ROOTS = ["/", "/orders", "/ads", "/wallet"] as const

export function shouldShowP2PMaintenanceBanner(pathname: string): boolean {
  const cleanPath = pathname.split("?")[0].split("#")[0]
  return (P2P_MAINTENANCE_BANNER_ROOTS as readonly string[]).includes(cleanPath)
}
