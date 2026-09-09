"use client"

import { isP2PEnvMaintenanceEnabled } from "@/lib/p2p-maintenance-env"
import { useP2PMaintenanceStore } from "@/stores/p2p-maintenance-store"

export function useP2PSystemMaintenance(): { isActive: boolean } {
  const isApiMaintenanceActive = useP2PMaintenanceStore((state) => state.isApiMaintenanceActive)
  const isEnvEnabled = isP2PEnvMaintenanceEnabled()

  return { isActive: isEnvEnabled || isApiMaintenanceActive }
}

export function useP2PQueriesBlocked(): boolean {
  const isApiMaintenanceActive = useP2PMaintenanceStore((state) => state.isApiMaintenanceActive)
  const isEnvEnabled = isP2PEnvMaintenanceEnabled()

  return isEnvEnabled || isApiMaintenanceActive
}
