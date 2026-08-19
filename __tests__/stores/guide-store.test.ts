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
      pendingOpenIntro: false,
      guideStartedFromIntro: false,
      adTradeType: null,
      marketTradeType: null,
      guideType: "markets",
      currentStep: 0,
      advertsSettled: false,
    })
  })

  it("initializes with intro closed and no pending open", () => {
    const { result } = renderHook(() => useGuideStore())

    expect(result.current.isIntroOpen).toBe(false)
    expect(result.current.pendingOpenIntro).toBe(false)
  })

  it("requestOpenIntro queues the intro without mounting it", () => {
    const { result } = renderHook(() => useGuideStore())

    act(() => {
      result.current.requestOpenIntro()
    })

    // The intro must NOT be opened synchronously — that's the bug. Only the
    // pending flag flips; Main opens it once the alert dialog has closed.
    expect(result.current.pendingOpenIntro).toBe(true)
    expect(result.current.isIntroOpen).toBe(false)
  })

  it("Main flushing the pending flag opens the intro and clears the queue", () => {
    const { result } = renderHook(() => useGuideStore())

    act(() => {
      result.current.requestOpenIntro()
    })
    expect(result.current.pendingOpenIntro).toBe(true)
    expect(result.current.isIntroOpen).toBe(false)

    // Simulate Main's rAF flush once the alert dialog has closed.
    act(() => {
      result.current.openIntro()
      result.current.clearPendingOpenIntro()
    })

    expect(result.current.isIntroOpen).toBe(true)
    expect(result.current.pendingOpenIntro).toBe(false)
  })

  it("clearPendingOpenIntro is a no-op when nothing is pending", () => {
    const { result } = renderHook(() => useGuideStore())

    act(() => {
      result.current.clearPendingOpenIntro()
    })

    expect(result.current.pendingOpenIntro).toBe(false)
  })

  it("openIntro mounts the intro directly", () => {
    const { result } = renderHook(() => useGuideStore())

    act(() => {
      result.current.openIntro()
    })

    expect(result.current.isIntroOpen).toBe(true)
    expect(result.current.pendingOpenIntro).toBe(false)
  })
})
