"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import { p2pMaintenanceRedirectFor } from "@/lib/p2p-maintenance-route-guard"

/** Redirects deep links to tab roots during maintenance. */
export function P2PMaintenanceController() {
  const pathname = usePathname()
  const router = useRouter()
  const { isActive } = useP2PSystemMaintenance()

  useEffect(() => {
    if (!isActive) return

    const redirect = p2pMaintenanceRedirectFor(pathname)
    if (redirect && redirect !== pathname) {
      router.replace(redirect)
    }
  }, [isActive, pathname, router])

  return null
}
