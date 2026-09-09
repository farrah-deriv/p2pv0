import { renderHook, act } from "@testing-library/react"
import { useMarketFilterStore } from "@/stores/market-filter-store"

describe("useMarketFilterStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useMarketFilterStore())
    act(() => {
      result.current.resetFilters()
    })
  })

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useMarketFilterStore())

    expect(result.current.activeTab).toBe("sell")
    expect(result.current.currency).toBe("")
    expect(result.current.sortBy).toBe("trade_band_rank")
    expect(result.current.filterOptions).toEqual({ fromFollowing: false })
    expect(result.current.selectedPaymentMethods).toEqual([])
    expect(result.current.selectedAccountCurrency).toBe("USD")
  })

  it("should update activeTab", () => {
    const { result } = renderHook(() => useMarketFilterStore())

    act(() => {
      result.current.setActiveTab("buy")
    })

    expect(result.current.activeTab).toBe("buy")
  })

  it("should update currency", () => {
    const { result } = renderHook(() => useMarketFilterStore())

    act(() => {
      result.current.setCurrency("EUR")
    })

    expect(result.current.currency).toBe("EUR")
  })

  it("should update sortBy", () => {
    const { result } = renderHook(() => useMarketFilterStore())

    act(() => {
      result.current.setSortBy("user_rating_average_lifetime")
    })

    expect(result.current.sortBy).toBe("user_rating_average_lifetime")
  })

  it("should update filterOptions", () => {
    const { result } = renderHook(() => useMarketFilterStore())

    act(() => {
      result.current.setFilterOptions({ fromFollowing: true })
    })

    expect(result.current.filterOptions).toEqual({ fromFollowing: true })
  })

  it("should update selectedPaymentMethods", () => {
    const { result } = renderHook(() => useMarketFilterStore())
    const methods = ["bank_transfer", "ewallet"]

    act(() => {
      result.current.setSelectedPaymentMethods(methods)
    })

    expect(result.current.selectedPaymentMethods).toEqual(methods)
  })

  it("should update selectedAccountCurrency", () => {
    const { result } = renderHook(() => useMarketFilterStore())

    act(() => {
      result.current.setSelectedAccountCurrency("BTC")
    })

    expect(result.current.selectedAccountCurrency).toBe("BTC")
  })

  it("should reset all filters to initial state", () => {
    const { result } = renderHook(() => useMarketFilterStore())

    // Change all values
    act(() => {
      result.current.setActiveTab("buy")
      result.current.setCurrency("EUR")
      result.current.setSortBy("user_rating_average_lifetime")
      result.current.setFilterOptions({ fromFollowing: true })
      result.current.setSelectedPaymentMethods(["bank_transfer"])
      result.current.setSelectedAccountCurrency("BTC")
    })

    // Reset
    act(() => {
      result.current.resetFilters()
    })

    // Check all values are back to initial state
    expect(result.current.activeTab).toBe("sell")
    expect(result.current.currency).toBe("")
    expect(result.current.sortBy).toBe("trade_band_rank")
    expect(result.current.filterOptions).toEqual({ fromFollowing: false })
    expect(result.current.selectedPaymentMethods).toEqual([])
    expect(result.current.selectedAccountCurrency).toBe("USD")
  })

  it("should maintain state across multiple hook instances", () => {
    const { result: result1 } = renderHook(() => useMarketFilterStore())
    const { result: result2 } = renderHook(() => useMarketFilterStore())

    act(() => {
      result1.current.setActiveTab("buy")
    })

    expect(result2.current.activeTab).toBe("buy")
  })

  it("should handle complex filter state updates", () => {
    const { result } = renderHook(() => useMarketFilterStore())

    act(() => {
      result.current.setActiveTab("buy")
      result.current.setCurrency("EUR")
      result.current.setFilterOptions({ fromFollowing: true })
      result.current.setSelectedPaymentMethods(["bank_transfer", "ewallet"])
    })

    expect(result.current.activeTab).toBe("buy")
    expect(result.current.currency).toBe("EUR")
    expect(result.current.filterOptions.fromFollowing).toBe(true)
    expect(result.current.selectedPaymentMethods).toHaveLength(2)
  })
})
