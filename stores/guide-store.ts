import { create } from "zustand"

// Step counts are per guide type — the markets and ads guides no longer have the
// same number of steps (markets merges its payment-method + advanced-filter steps
// into one, but adds a separate advertiser-profile step), so they are tracked
// separately rather than via a single constant.
export const GUIDE_STEP_COUNTS: Record<GuideType, number> = {
  markets: 6,
  ads: 6,
}
export type GuideType = "markets" | "ads"

interface GuideState {
  isGuideActive: boolean
  isIntroOpen: boolean
  pendingStartGuide: boolean
  pendingAskAmy: boolean
  // Set when a caller wants the intro opened but cannot do so immediately —
  // specifically when the KYC onboarding AlertDialog is still open and its
  // Radix teardown has not finished. Main flushes this once the alert dialog
  // is closed (see app/main.tsx). Mirrors pendingAskAmy: a signal that the
  // actual open must wait for a Radix unmount to complete.
  pendingOpenIntro: boolean
  guideStartedFromIntro: boolean
  adTradeType: "buy" | "sell" | null
  marketTradeType: "buy" | "sell" | null
  guideType: GuideType
  currentStep: number
  advertsSettled: boolean
  setAdvertsSettled: () => void
  openIntro: () => void
  // Queue an intro open without mounting it. Used by KycOnboardingSheet when
  // it closes itself after verification succeeds: calling openIntro() in the
  // same tick as onClose() mounts the intro's Radix Dialog/Drawer on top of
  // the still-tearing-down KYC overlay, stranding a backdrop and leaving the
  // intro CTAs unclickable. requestOpenIntro() only sets the flag; Main opens
  // the intro once the alert dialog has closed.
  requestOpenIntro: () => void
  clearPendingOpenIntro: () => void
  reopenIntro: () => void
  dismissIntro: () => void
  requestAskAmy: () => void
  clearPendingAskAmy: () => void
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
  pendingAskAmy: false,
  pendingOpenIntro: false,
  guideStartedFromIntro: false,
  adTradeType: null,
  marketTradeType: null,
  guideType: "markets" as GuideType,
  currentStep: 0,
  advertsSettled: false,
  setAdvertsSettled: () => set((s) => s.advertsSettled ? s : { advertsSettled: true }),
  openIntro: () => set({ isIntroOpen: true }),
  // Only queue; do not mount. Main flips isIntroOpen once the alert dialog
  // has closed and Radix has torn its overlay down.
  requestOpenIntro: () => set({ pendingOpenIntro: true }),
  clearPendingOpenIntro: () => set((s) => (s.pendingOpenIntro ? { pendingOpenIntro: false } : s)),
  reopenIntro: () => set({ isIntroOpen: true }),
  dismissIntro: () => set({ isIntroOpen: false }),
  // Ask Amy opens the Intercom messenger. The dialog must fully unmount first —
  // opening Intercom on top of Radix's exit transition leaves the page's
  // scroll-lock / aria-hidden state stuck (the "greyed out" page after closing
  // Ask Amy, see issue #1469). requestAskAmy() only dismisses the intro here;
  // the Intercom("show") call is fired from Main *after* the intro has closed
  // so it never races the Radix teardown. pendingAskAmy is cleared once Intercom
  // is actually shown (see clearPendingAskAmy).
  requestAskAmy: () => set({ isIntroOpen: false, pendingAskAmy: true }),
  clearPendingAskAmy: () => set((s) => (s.pendingAskAmy ? { pendingAskAmy: false } : s)),
  startGuide: (type: GuideType = "markets") => set({ isGuideActive: true, currentStep: 0, guideType: type }),
  setGuideStartedFromIntro: (value: boolean) => set({ guideStartedFromIntro: value }),
  setAdTradeType: (type: "buy" | "sell" | null) => set({ adTradeType: type }),
  setMarketTradeType: (type: "buy" | "sell" | null) => set({ marketTradeType: type }),
  setPendingStartGuide: (value: boolean) => set({ pendingStartGuide: value }),
  nextStep: () => {
    const { currentStep, guideType } = get()
    if (currentStep < GUIDE_STEP_COUNTS[guideType] - 1) {
      set({ currentStep: currentStep + 1 })
    } else {
      get().completeGuide()
    }
  },
  goToStep: (step: number) => {
    if (step >= 0 && step < GUIDE_STEP_COUNTS[get().guideType]) {
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
