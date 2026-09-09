import { create } from "zustand"

interface P2PMaintenanceState {
  isApiMaintenanceActive: boolean
  setApiMaintenanceActive: (active: boolean) => void
  clearMaintenance: () => void
}

export const useP2PMaintenanceStore = create<P2PMaintenanceState>((set) => ({
  isApiMaintenanceActive: false,
  setApiMaintenanceActive: (active) => set({ isApiMaintenanceActive: active }),
  clearMaintenance: () => set({ isApiMaintenanceActive: false }),
}))
