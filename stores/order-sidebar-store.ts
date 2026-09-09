import { create } from "zustand"
import type { Advertisement } from "@/services/api/api-buy-sell"

interface OrderSidebarState {
  pendingAd: Advertisement | null
  openedFromSearch: boolean
  triggerSearchReopen: boolean
  shouldReopenSearchOnReturn: boolean
  setPendingAd: (ad: Advertisement | null, fromSearch?: boolean) => void
  setTriggerSearchReopen: (value: boolean) => void
  setShouldReopenSearchOnReturn: (value: boolean) => void
}

export const useOrderSidebarStore = create<OrderSidebarState>((set) => ({
  pendingAd: null,
  openedFromSearch: false,
  triggerSearchReopen: false,
  shouldReopenSearchOnReturn: false,
  setPendingAd: (ad, fromSearch = false) => set({ pendingAd: ad, openedFromSearch: fromSearch }),
  setTriggerSearchReopen: (value) => set({ triggerSearchReopen: value }),
  setShouldReopenSearchOnReturn: (value) => set({ shouldReopenSearchOnReturn: value }),
}))
