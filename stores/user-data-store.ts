import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { OnboardingStatusResponse } from "@/services/api/api-auth"

export interface UserData {
  adverts_are_listed?: boolean
  email?: string
  first_name?: string
  last_name?: string
  nickname?: string
  signup?: string
  wallet_id?: string
  temp_ban_until?: number | null
  is_online?: boolean
  balances?: { amount: string; currency: string }
  status?: string
  feedback_exist?: boolean
  trade_band?: string
}

export interface VerificationStatus {
  email_verified: boolean
  phone_verified: boolean
  kyc_verified: boolean
  p2p_allowed: boolean
}

export type EmailEligibility = "unknown" | "loading" | "eligible" | "missing" | "error"

interface UserDataState {
  userData: UserData | null
  userId: string | null
  externalId: string | null
  clientId: string | null
  residenceCountry: string | null
  localCurrency: string | null
  brandClientId: string | null
  brand: string | null
  verificationStatus: VerificationStatus | null
  onboardingStatus: OnboardingStatusResponse | null
  socketToken: string | null
  isWalletAccount: boolean
  isOnboardingStatusRefreshing: boolean
  emailEligibility: EmailEligibility
  oryEmailVerified: boolean
  setUserData: (data: UserData) => void
  setExternalId: (id: string) => void
  setUserId: (id: string) => void
  setClientId: (id: string) => void
  setResidenceCountry: (country: string) => void
  setLocalCurrency: (currency: string | null) => void
  setBrandClientId: (id: string) => void
  setBrand: (brand: string) => void
  updateUserData: (data: Partial<UserData>) => void
  updateBalances: (balances: { amount: string; currency: string }) => void
  setVerificationStatus: (status: VerificationStatus) => void
  setOnboardingStatus: (status: OnboardingStatusResponse) => void
  setSocketToken: (token: string | null) => void
  setIsWalletAccount: (isWallet: boolean) => void
  setIsOnboardingStatusRefreshing: (isRefreshing: boolean) => void
  setEmailEligibility: (eligibility: EmailEligibility) => void
  setOryEmailVerified: (verified: boolean) => void
  clearUserData: () => void
}

const initialState = {
  userData: null,
  userId: null,
  clientId: null,
  externalId: null,
  residenceCountry: null,
  localCurrency: null,
  brandClientId: null,
  brand: null,
  verificationStatus: null,
  onboardingStatus: null,
  socketToken: null,
  isWalletAccount: typeof window !== "undefined" ? localStorage.getItem("is_wallet_account") === "true" : false,
  isOnboardingStatusRefreshing: false,
  emailEligibility: "unknown",
  oryEmailVerified: false,
}

const cacheWalletAccount = (isWallet: boolean) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("is_wallet_account", isWallet.toString())
  } catch {
    // localStorage quota exceeded — value will be re-derived on next load
  }
}

export const useUserDataStore = create<UserDataState>()(
  persist(
    (set: (partial: Partial<UserDataState> | ((state: UserDataState) => Partial<UserDataState>)) => void) => ({
      ...initialState,

      setUserData: (data: UserData) => {
        set({ userData: data })
      },

      setExternalId: (id) => set({ externalId: id }),

      setUserId: (id: string) => set({ userId: id }),

      setClientId: (id: string) => set({ clientId: id }),

      setResidenceCountry: (country: string) => set({ residenceCountry: country }),

      setLocalCurrency: (currency: string | null) => set({ localCurrency: currency }),

      setBrandClientId: (id: string) => set({ brandClientId: id }),

      setBrand: (brand: string) => set({ brand }),

      updateUserData: (data: Partial<UserData>) =>
        set((state: UserDataState) => {
          const newUserData = state.userData ? { ...state.userData, ...data } : data
          return { userData: newUserData }
        }),

      updateBalances: (balances: { amount: string; currency: string }) =>
        set((state: UserDataState) => {
          const newUserData = state.userData ? { ...state.userData, balances } : { balances }
          return { userData: newUserData }
        }),

      setVerificationStatus: (status: VerificationStatus) => set({ verificationStatus: status }),

      setOnboardingStatus: (status: OnboardingStatusResponse) => set({ onboardingStatus: status }),

      setSocketToken: (token: string | null) => set({ socketToken: token }),

      setIsWalletAccount: (isWallet: boolean) => {
        cacheWalletAccount(isWallet)
        set({ isWalletAccount: isWallet })
      },

      setIsOnboardingStatusRefreshing: (isRefreshing) => set({ isOnboardingStatusRefreshing: isRefreshing }),

      setEmailEligibility: (eligibility) => set({ emailEligibility: eligibility }),

      setOryEmailVerified: (verified) => set({ oryEmailVerified: verified }),

      clearUserData: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("is_wallet_account")
        }
        set(initialState)
      },
    }),
    {
      name: "user-data-storage",
      partialize: (state: UserDataState) => ({ userId: state.userId, localCurrency: state.localCurrency }),
    }
  )
)
