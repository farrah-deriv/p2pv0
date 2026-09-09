import { renderHook, act } from "@testing-library/react"
import { useOrdersFilterStore } from "@/stores/orders-filter-store"

// Reset store before each test
beforeEach(() => {
  useOrdersFilterStore.getState().resetFilters()
})

describe("useOrdersFilterStore", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useOrdersFilterStore())

    expect(result.current.activeTab).toBe("active")
  })

  it("should update activeTab when setActiveTab is called", () => {
    const { result } = renderHook(() => useOrdersFilterStore())

    act(() => {
      result.current.setActiveTab("past")
    })

    expect(result.current.activeTab).toBe("past")
  })

  it("should switch between active and past tabs", () => {
    const { result } = renderHook(() => useOrdersFilterStore())

    // Start with active
    expect(result.current.activeTab).toBe("active")

    // Switch to past
    act(() => {
      result.current.setActiveTab("past")
    })
    expect(result.current.activeTab).toBe("past")

    // Switch back to active
    act(() => {
      result.current.setActiveTab("active")
    })
    expect(result.current.activeTab).toBe("active")
  })

  it("should reset filters to initial state", () => {
    const { result } = renderHook(() => useOrdersFilterStore())

    // Change some values
    act(() => {
      result.current.setActiveTab("past")
    })

    expect(result.current.activeTab).toBe("past")

    // Reset filters
    act(() => {
      result.current.resetFilters()
    })

    expect(result.current.activeTab).toBe("active")
  })

  it("should maintain state across multiple hook instances", () => {
    const { result: result1 } = renderHook(() => useOrdersFilterStore())
    const { result: result2 } = renderHook(() => useOrdersFilterStore())

    act(() => {
      result1.current.setActiveTab("past")
    })

    expect(result1.current.activeTab).toBe("past")
    expect(result2.current.activeTab).toBe("past")
  })

  it("should handle edge cases with tab values", () => {
    const { result } = renderHook(() => useOrdersFilterStore())

    // Test with valid values
    act(() => {
      result.current.setActiveTab("active")
    })
    expect(result.current.activeTab).toBe("active")

    act(() => {
      result.current.setActiveTab("past")
    })
    expect(result.current.activeTab).toBe("past")
  })

  it("should provide all required actions", () => {
    const { result } = renderHook(() => useOrdersFilterStore())

    expect(typeof result.current.setActiveTab).toBe("function")
    expect(typeof result.current.resetFilters).toBe("function")
  })

  it("should not persist state after reset", () => {
    const { result } = renderHook(() => useOrdersFilterStore())

    // Set some state
    act(() => {
      result.current.setActiveTab("past")
    })

    // Verify state is set
    expect(result.current.activeTab).toBe("past")

    // Reset
    act(() => {
      result.current.resetFilters()
    })

    // Verify state is back to initial
    expect(result.current.activeTab).toBe("active")
  })
})
