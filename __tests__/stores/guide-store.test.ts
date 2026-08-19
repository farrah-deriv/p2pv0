import { renderHook, act } from "@testing-library/react"
import { useGuideStore } from "@/stores/guide-store"

describe("useGuideStore", () => {
  beforeEach(() => {
    // Full reset of every field — not just the three pending/intro flags.
    // A prior test that called startGuide / nextStep / completeGuide would
    // otherwise leak isGuideActive, currentStep, guideType, etc. into the
    // next case. Zustand's setState accepts a partial, so no extra dep.
    useGuideStore.setState({
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
      guideType: "markets",
      currentStep: 0,
      advertsSettled: false,
    })
  })

  it("initializes with intro closed", () => {
    const { result } = renderHook(() => useGuideStore())

    expect(result.current.isIntroOpen).toBe(false)
  })

  it("openIntro mounts the intro directly and marks it shown", () => {
    const { result } = renderHook(() => useGuideStore())

    act(() => {
      result.current.openIntro()
    })

    expect(result.current.isIntroOpen).toBe(true)
    expect(result.current.hasShownIntro).toBe(true)
  })

  it("openIntro does not mount a second copy once already shown", () => {
    const { result } = renderHook(() => useGuideStore())

    act(() => {
      result.current.openIntro()
      result.current.dismissIntro()
      result.current.openIntro()
    })

    // The second open is ignored — the intro is only shown once per session.
    expect(result.current.isIntroOpen).toBe(false)
  })

  it("requestOpenIntro is ignored after the intro has already been shown", () => {
    const { result } = renderHook(() => useGuideStore())

    act(() => {
      result.current.openIntro()
      result.current.dismissIntro()
      result.current.requestOpenIntro()
    })

    expect(result.current.pendingOpenIntro).toBe(false)
    expect(result.current.isIntroOpen).toBe(false)
  })

  it("reopenIntro can bring the intro back after a tour even if it was already shown", () => {
    const { result } = renderHook(() => useGuideStore())

    act(() => {
      result.current.openIntro()
      result.current.dismissIntro()
      result.current.reopenIntro()
    })

    expect(result.current.isIntroOpen).toBe(true)
  })

  it("requestOpenIntro queues the intro without mounting it", () => {
    const { result } = renderHook(() => useGuideStore())

    act(() => {
      result.current.requestOpenIntro()
    })

    expect(result.current.pendingOpenIntro).toBe(true)
    expect(result.current.isIntroOpen).toBe(false)
  })

  it("clearPendingOpenIntro drops the queued intro open", () => {
    const { result } = renderHook(() => useGuideStore())

    act(() => {
      result.current.requestOpenIntro()
      result.current.clearPendingOpenIntro()
    })

    expect(result.current.pendingOpenIntro).toBe(false)
    expect(result.current.isIntroOpen).toBe(false)
  })

  it("requestStartGuide dismisses the intro and queues the tour without starting it", () => {
    const { result } = renderHook(() => useGuideStore())

    act(() => {
      result.current.openIntro()
    })
    expect(result.current.isIntroOpen).toBe(true)

    act(() => {
      result.current.requestStartGuide()
    })

    // The tour must NOT start synchronously — that's the stranded-backdrop
    // bug. Only the pending flag flips; Main starts the tour once the intro
    // has actually unmounted.
    expect(result.current.isIntroOpen).toBe(false)
    expect(result.current.pendingStartGuideFromIntro).toBe(true)
    expect(result.current.isGuideActive).toBe(false)
  })

  it("Main flushing the pending tour start activates the guide and clears the queue", () => {
    const { result } = renderHook(() => useGuideStore())

    act(() => {
      result.current.requestStartGuide()
    })
    expect(result.current.pendingStartGuideFromIntro).toBe(true)
    expect(result.current.isGuideActive).toBe(false)

    // Simulate Main flushing once the intro overlay has left the DOM.
    act(() => {
      result.current.startGuide("markets")
      result.current.clearPendingStartGuideFromIntro()
    })

    expect(result.current.isGuideActive).toBe(true)
    expect(result.current.pendingStartGuideFromIntro).toBe(false)
    expect(result.current.guideType).toBe("markets")
  })

  it("off-markets Explore marketplace queues Markets to start the tour after navigation", () => {
    const { result } = renderHook(() => useGuideStore())

    act(() => {
      result.current.requestStartGuide()
    })

    // Simulate Main: not on /, so hand the tour to Markets instead of
    // starting it over Ads / Orders / Profile / Wallet.
    act(() => {
      result.current.setPendingStartGuide(true)
      result.current.clearPendingStartGuideFromIntro()
    })

    expect(result.current.pendingStartGuide).toBe(true)
    expect(result.current.pendingStartGuideFromIntro).toBe(false)
    expect(result.current.isGuideActive).toBe(false)
  })
})
