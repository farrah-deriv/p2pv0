import { act, renderHook } from "@testing-library/react"
import { useWizardExchangeRate } from "@/app/ads/hooks/use-wizard-exchange-rate"
import jest from "jest"

const joinExchangeRatesChannel = jest.fn()
const leaveExchangeRatesChannel = jest.fn()
const requestExchangeRate = jest.fn()
const subscribers: Array<(message: unknown) => void> = []
const subscribe = jest.fn((callback: (message: unknown) => void) => {
  subscribers.push(callback)
  return () => {
    const index = subscribers.indexOf(callback)
    if (index !== -1) subscribers.splice(index, 1)
  }
})

const wsContext = {
  isConnected: true,
  joinExchangeRatesChannel,
  leaveExchangeRatesChannel,
  requestExchangeRate,
  subscribe,
}

jest.mock("@/contexts/websocket-context", () => ({
  useWebSocketContext: () => wsContext,
}))

const emit = (payload: unknown, channel = "exchange_rates/USD") => {
  act(() => {
    for (const callback of [...subscribers]) callback({ options: { channel }, payload })
  })
}

describe("useWizardExchangeRate — feed start", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    subscribers.length = 0
  })

  // The edit wizard passes enabled=false while the advert loads and cannot know the
  // payment currency until it resolves. Serialising the websocket round trip behind
  // that is what left the recovered fixed rate unavailable at prefill time.
  it("joins and requests rates from the account currency alone", () => {
    renderHook(() => useWizardExchangeRate("USD", undefined, false))

    expect(joinExchangeRatesChannel).toHaveBeenCalledWith("USD", "")
    expect(requestExchangeRate).toHaveBeenCalledWith("USD", "")
  })

  it("caches rates for pairs the wizard has not selected yet", () => {
    const { result } = renderHook(() => useWizardExchangeRate("USD", undefined, false))

    emit({ AFN: { rate: 68.5, status: "inactive" }, EUR: { rate: 0.92, status: "active" } })

    // getCachedRate takes an explicit pair because the hook's own pairKey is still
    // empty here — which is exactly the situation the edit prefill runs in.
    expect(result.current.getCachedRate("USD:AFN")).toBe(68.5)
    expect(result.current.getCachedRate("USD:EUR")).toBe(0.92)
    expect(result.current.getCachedRate("USD:GBP")).toBeNull()
    expect(result.current.cachedRate).toBeNull()
  })

  it("does not restart the round trip when the payment currency arrives later", () => {
    const { rerender } = renderHook(
      ({ payment, enabled }: { payment?: string; enabled: boolean }) =>
        useWizardExchangeRate("USD", payment, enabled),
      { initialProps: { payment: undefined as string | undefined, enabled: false } },
    )

    expect(joinExchangeRatesChannel).toHaveBeenCalledTimes(1)

    rerender({ payment: "AFN", enabled: true })

    expect(joinExchangeRatesChannel).toHaveBeenCalledTimes(1)
    expect(leaveExchangeRatesChannel).not.toHaveBeenCalled()
    expect(subscribe).toHaveBeenCalledTimes(1)
  })

  it("resolves the selected pair from an update that arrived before it was selected", () => {
    const { result, rerender } = renderHook(
      ({ payment, enabled }: { payment?: string; enabled: boolean }) =>
        useWizardExchangeRate("USD", payment, enabled),
      { initialProps: { payment: undefined as string | undefined, enabled: false } },
    )

    emit({ AFN: { rate: 68.5, status: "inactive" } })
    rerender({ payment: "AFN", enabled: true })

    // The first render the wizard sees already has the rate, so there is nothing to
    // skeletonise and no empty field to fill in a moment later.
    expect(result.current.rate).toBe(68.5)
    expect(result.current.cachedRate).toBe(68.5)
    expect(result.current.hasResolvedStatus).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isExplicitlyUnavailable).toBe(true)
  })

  it("leaves the channel on unmount", () => {
    const { unmount } = renderHook(() => useWizardExchangeRate("USD", "AFN", true))
    unmount()
    expect(leaveExchangeRatesChannel).toHaveBeenCalledWith("USD", "")
  })
})
