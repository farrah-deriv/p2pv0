import { create } from "zustand"
import { persist } from "zustand/middleware"

export const GUIDE_TOTAL_STEPS = 6
export type GuideType = "markets" | "ads"

interface GuideState {
  hasSeenGuide: boolean
  hasSeenIntro: boolean
  isGuideActive: boolean
  isIntroOpen: boolean
  pendingStartGuide: boolean
  guideStartedFromIntro: boolean
  adTradeType: "buy" | "sell" | null
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
  nextStep: () => void
  goToStep: (step: number) => void
  completeGuide: () => void
  setPendingStartGuide: (value: boolean) => void
}

export const useGuideStore = create<GuideState>()(
  persist(
    (set, get) => ({
      hasSeenGuide: false,
      hasSeenIntro: false,
      isGuideActive: false,
      isIntroOpen: false,
      pendingStartGuide: false,
      guideStartedFromIntro: false,
      adTradeType: null,
      guideType: "markets" as GuideType,
      currentStep: 0,
      advertsSettled: false,
      setAdvertsSettled: () => set((s) => s.advertsSettled ? s : { advertsSettled: true }),
      openIntro: () => {
        if (!get().hasSeenIntro) set({ isIntroOpen: true })
      },
      reopenIntro: () => set({ isIntroOpen: true }),
      dismissIntro: () => set({ isIntroOpen: false, hasSeenIntro: true }),
      startGuide: (type: GuideType = "markets") => set({ isGuideActive: true, currentStep: 0, guideType: type }),
      setGuideStartedFromIntro: (value: boolean) => set({ guideStartedFromIntro: value }),
      setAdTradeType: (type: "buy" | "sell" | null) => set({ adTradeType: type }),
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
        set({ hasSeenGuide: true, isGuideActive: false, currentStep: 0, guideStartedFromIntro: false, adTradeType: null })
        if (fromIntro) get().reopenIntro()
      },
    }),
    {
      name: "p2p-guide",
      partialize: (state) => ({ hasSeenGuide: state.hasSeenGuide, hasSeenIntro: state.hasSeenIntro }),
    }
  )
)
