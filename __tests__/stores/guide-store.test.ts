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

  it("openIntro mounts the intro directly", () => {
    const { result } = renderHook(() => useGuideStore())

    act(() => {
      result.current.openIntro()
    })

    expect(result.current.isIntroOpen).toBe(true)
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
})
