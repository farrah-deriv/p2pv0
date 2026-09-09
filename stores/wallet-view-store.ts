import { create } from "zustand"

interface WalletViewState {
  isTransactionListVisible: boolean
  setIsTransactionListVisible: (visible: boolean) => void
}

export const useWalletViewStore = create<WalletViewState>((set) => ({
  isTransactionListVisible: false,
  setIsTransactionListVisible: (visible) => set({ isTransactionListVisible: visible }),
}))
