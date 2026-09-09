import { create } from "zustand"

interface ChatVisibilityState {
  isChatVisible: boolean
  setIsChatVisible: (visible: boolean) => void
  resetFilters: () => void
}

const initialState = {
  isChatVisible: false,
}

export const useChatVisibilityStore = create<ChatVisibilityState>((set) => ({
  ...initialState,

  setIsChatVisible: (visible) => set({ isChatVisible: visible }),

  resetFilters: () => set(initialState),
}))
