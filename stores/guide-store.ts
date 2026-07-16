import { create } from "zustand"
import { persist } from "zustand/middleware"

export const GUIDE_TOTAL_STEPS = 6

interface GuideState {
  hasSeenGuide: boolean
  isGuideActive: boolean
  currentStep: number
  startGuide: () => void
  nextStep: () => void
  goToStep: (step: number) => void
  completeGuide: () => void
}

export const useGuideStore = create<GuideState>()(
  persist(
    (set, get) => ({
      hasSeenGuide: false,
      isGuideActive: false,
      currentStep: 0,
      startGuide: () => set({ isGuideActive: true, currentStep: 0 }),
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
      completeGuide: () => set({ hasSeenGuide: true, isGuideActive: false, currentStep: 0 }),
    }),
    {
      name: "p2p-guide",
      partialize: (state) => ({ hasSeenGuide: state.hasSeenGuide }),
    }
  )
)
