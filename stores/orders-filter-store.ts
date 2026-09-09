import { create } from "zustand"

export type DateFilterType = "all" | "today" | "week" | "month" | "custom"

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface OrdersFilterState {
  activeTab: "active" | "past"
  dateFilter: DateFilterType
  customDateRange: DateRange
  setActiveTab: (tab: "active" | "past") => void
  setDateFilter: (filter: DateFilterType) => void
  setCustomDateRange: (range: DateRange) => void
  resetFilters: () => void
}

const initialState = {
  activeTab: "active" as const,
  dateFilter: "all" as DateFilterType,
  customDateRange: { from: undefined, to: undefined },
}

export const useOrdersFilterStore = create<OrdersFilterState>((set) => ({
  ...initialState,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setDateFilter: (filter) => set({ dateFilter: filter }),

  setCustomDateRange: (range) => set({ customDateRange: range }),

  resetFilters: () => set(initialState),
}))
