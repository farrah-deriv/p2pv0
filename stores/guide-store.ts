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
  // Set when the intro's "Place an order" card is tapped. The intro must
  // fully unmount first — starting the tour in the same tick as dismissIntro()
  // mounts P2PGuide (z-[60] overlay + tooltip) on top of the intro's still-
  // tearing-down Radix Dialog/Drawer, stranding a backdrop so the tour's
  // Next/Close CTAs sit under it and cannot be clicked. requestStartGuide()
  // only dismisses the intro and sets this flag; Main starts the tour once
  // isIntroOpen is false (see app/main.tsx). Mirrors pendingAskAmy.
  pendingStartGuideFromIntro: boolean
  // Queue an intro open without mounting it. Used when KYC is already
  // showing: hide the alert first, then Main opens the intro after the
  // overlay fade so the two DismissableLayers never stack.
  pendingOpenIntro: boolean
  // First auto-open after verification (Main onboarding / CTA). Stops the
  // intro from remounting when Main's effect re-runs after ensureP2PUser or
  // a status refresh. reopenIntro() after a tour does not use this flag.
  hasShownIntro: boolean
  guideStartedFromIntro: boolean
  adTradeType: "buy" | "sell" | null
  marketTradeType: "buy" | "sell" | null
  guideType: GuideType
  currentStep: number
  advertsSettled: boolean
  setAdvertsSettled: () => void
  // First-time open (create ad, onboarding). Marks hasShownIntro so Main
  // cannot auto-open a second copy after verification. If KYC is showing,
  // use requestOpenIntro() after hideAlert() instead.
  openIntro: () => void
  requestOpenIntro: () => void
  clearPendingOpenIntro: () => void
  // Bring the intro back after a tour that started from it. Not a first-time
  // open — does not consult hasShownIntro.
  reopenIntro: () => void
  dismissIntro: () => void
  requestAskAmy: () => void
  clearPendingAskAmy: () => void
  // Dismiss the intro and queue the markets tour. Main starts the tour once
  // the intro has actually closed (see pendingStartGuideFromIntro).
  requestStartGuide: () => void
  clearPendingStartGuideFromIntro: () => void
  startGuide: (type?: GuideType) => void
  setGuideStartedFromIntro: (value: boolean) => void
  setAdTradeType: (type: "buy" | "sell" | null) => void
  setMarketTradeType: (type: "buy" | "sell" | null) => void
  nextStep: () => void
  goToStep: (step: number) => void
  completeGuide: () => void
  setPendingStartGuide: (value: boolean) => void
}

// The guide intro is shown once per session (hasShownIntro). Main's
// !currentUserId guard is not enough: after ensureP2PUser the effect
// re-runs with a userId and leftover ?show_kyc_popup and would open
// again. All transient guide state lives in memory only.
export const useGuideStore = create<GuideState>()((set, get) => ({
  isGuideActive: false,
  isIntroOpen: false,
  pendingStartGuide: false,
  pendingAskAmy: false,
  pendingStartGuideFromIntro: false,
  pendingOpenIntro: false,
  hasShownIntro: false,
  guideStartedFromIntro: false,
  adTradeType: null,
  marketTradeType: null,
  guideType: "markets" as GuideType,
  currentStep: 0,
  advertsSettled: false,
  setAdvertsSettled: () => set((s) => s.advertsSettled ? s : { advertsSettled: true }),
  openIntro: () => {
    if (get().hasShownIntro) return
    set({ isIntroOpen: true, hasShownIntro: true })
  },
  requestOpenIntro: () => {
    if (get().hasShownIntro) return
    set({ pendingOpenIntro: true })
  },
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
  // Same contract as requestAskAmy: dismiss first, start later. The tour
  // overlay (z-[60]) must not mount while the intro's Radix portal is still
  // tearing down — that is what stranded a backdrop over the tour CTAs.
  requestStartGuide: () => set({ isIntroOpen: false, pendingStartGuideFromIntro: true }),
  clearPendingStartGuideFromIntro: () =>
    set((s) => (s.pendingStartGuideFromIntro ? { pendingStartGuideFromIntro: false } : s)),
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
