import { useP2PMaintenanceStore } from "@/stores/p2p-maintenance-store"

/** Maintenance kill-switch for web — env flag or API `P2PDisabled` latch. */

/** Whether the build-time env kill-switch is enabled. */
export function isP2PEnvMaintenanceEnabled(): boolean {
  return process.env.NEXT_PUBLIC_P2P_SYSTEM_MAINTENANCE_ENABLED === "1"
}

/** Whether P2P system maintenance mode is active (banner, gates, query blocking). */
export function isP2PMaintenanceActive(): boolean {
  return isP2PEnvMaintenanceEnabled() || useP2PMaintenanceStore.getState().isApiMaintenanceActive
}
