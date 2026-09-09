import { create } from "zustand"

interface UserCountryInvalidState {
  isUserCountryInvalid: boolean
  setUserCountryInvalid: (active: boolean) => void
  clearUserCountryInvalid: () => void
}

export const useUserCountryInvalidStore = create<UserCountryInvalidState>((set) => ({
  isUserCountryInvalid: false,
  setUserCountryInvalid: (active) => set({ isUserCountryInvalid: active }),
  clearUserCountryInvalid: () => set({ isUserCountryInvalid: false }),
}))
