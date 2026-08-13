import { create } from "zustand"

export const GUIDE_TOTAL_STEPS = 6
export type GuideType = "markets" | "ads"

interface GuideState {
  isGuideActive: boolean
  isIntroOpen: boolean
  pendingStartGuide: boolean
  guideStartedFromIntro: boolean
  adTradeType: "buy" | "sell" | null
  marketTradeType: "buy" | "sell" | null
  guideType: GuideType
  currentStep: number
  advertsSettled: boolean
  setAdvertsSettled: () => void
  openIntro: () => void
  reopenIntro: () => void
  dismissIntro: () => void
  startGuide: (type?: GuideType) => void
  setGuideStartedFromIntro: (value: boolean) => void
  setAdTradeType: (type: "buy" | "sell" | null) => void
  setMarketTradeType: (type: "buy" | "sell" | null) => void
  nextStep: () => void
  goToStep: (step: number) => void
  completeGuide: () => void
  setPendingStartGuide: (value: boolean) => void
}

// The guide intro is shown once, right after the P2P user is created
// (see app/main.tsx — the `!currentUserId` guard there is what prevents
// re-showing, not any persisted "seen" flag). All transient guide state
// lives in memory only; nothing here is persisted to localStorage.
export const useGuideStore = create<GuideState>()((set, get) => ({
  isGuideActive: false,
  isIntroOpen: false,
  pendingStartGuide: false,
  guideStartedFromIntro: false,
  adTradeType: null,
  marketTradeType: null,
  guideType: "markets" as GuideType,
  currentStep: 0,
  advertsSettled: false,
  setAdvertsSettled: () => set((s) => s.advertsSettled ? s : { advertsSettled: true }),
  openIntro: () => set({ isIntroOpen: true }),
  reopenIntro: () => set({ isIntroOpen: true }),
  dismissIntro: () => set({ isIntroOpen: false }),
  startGuide: (type: GuideType = "markets") => set({ isGuideActive: true, currentStep: 0, guideType: type }),
  setGuideStartedFromIntro: (value: boolean) => set({ guideStartedFromIntro: value }),
  setAdTradeType: (type: "buy" | "sell" | null) => set({ adTradeType: type }),
  setMarketTradeType: (type: "buy" | "sell" | null) => set({ marketTradeType: type }),
  setPendingStartGuide: (value: boolean) => set({ pendingStartGuide: value }),
  nextStep: () => {
    const { currentStep } = get()
    if (currentStep < GUIDE_TOTAL_STEPS - 1) {
      set({ currentStep: currentStep + 1 })
    } else {
      get().completeGuide()
    }
  },
  goToStep: (step: number) => {
    if (step >= 0 && step < GUIDE_TOTAL_STEPS) {
      set({ currentStep: step })
    }
  },
  completeGuide: () => {
    const fromIntro = get().guideStartedFromIntro
    set({
      isGuideActive: false,
      currentStep: 0,
      guideStartedFromIntro: false,
      adTradeType: null,
      marketTradeType: null,
    })
    if (fromIntro) get().reopenIntro()
  },
}))
