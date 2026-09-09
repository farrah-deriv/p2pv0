import { create } from "zustand"

export interface MarketFilterOptions {
  fromFollowing: boolean
}

interface MarketFilterState {
  activeTab: "buy" | "sell"
  currency: string
  sortBy: string
  filterOptions: MarketFilterOptions
  selectedPaymentMethods: string[]
  selectedAccountCurrency: string
  nickname: string
  setActiveTab: (tab: "buy" | "sell") => void
  setCurrency: (currency: string) => void
  setSortBy: (sortBy: string) => void
  setFilterOptions: (options: MarketFilterOptions) => void
  setSelectedPaymentMethods: (methods: string[]) => void
  setSelectedAccountCurrency: (currency: string) => void
  setNickname: (nickname: string) => void
  resetFilters: () => void
}

const initialState = {
  activeTab: "sell" as const,
  currency: "",
  sortBy: "trade_band_rank",
  filterOptions: { fromFollowing: false },
  selectedPaymentMethods: [] as string[],
  selectedAccountCurrency: "USD",
  nickname: "",
}

export const useMarketFilterStore = create<MarketFilterState>()(
  (set: (partial: Partial<MarketFilterState>) => void) => ({
    ...initialState,

    setActiveTab: (tab: "buy" | "sell") => set({ activeTab: tab }),
    setCurrency: (currency: string) => set({ currency }),
    setSortBy: (sortBy: string) => set({ sortBy }),
    setFilterOptions: (options: MarketFilterOptions) => set({ filterOptions: options }),
    setSelectedPaymentMethods: (methods: string[]) => set({ selectedPaymentMethods: methods }),
    setSelectedAccountCurrency: (currency: string) => set({ selectedAccountCurrency: currency }),
    setNickname: (nickname: string) => set({ nickname }),
    resetFilters: () => set(initialState),
  }),
)
