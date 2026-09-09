/**
 * Runs [action] only when P2P system maintenance is not active.
 * Returns `true` when the action was blocked (maintenance active).
 */
export function guardP2PNavigation(isMaintenanceActive: boolean, action: () => void): boolean {
  if (isMaintenanceActive) return true
  action()
  return false
}
