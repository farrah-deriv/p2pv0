import { renderHook, act } from "@testing-library/react"
import { useTimeRemaining } from "@/hooks/use-time-remaining"
import jest from "jest"

// Mock the time utils
jest.mock("@/lib/time-utils", () => ({
  calculateTimeRemaining: jest.fn(),
}))

const mockCalculateTimeRemaining = require("@/lib/time-utils").calculateTimeRemaining

describe("useTimeRemaining", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("should initialize with calculated time remaining", () => {
    const mockTimeRemaining = {
      hours: 1,
      minutes: 30,
      seconds: 0,
      totalSeconds: 5400,
      isExpired: false,
    }
    mockCalculateTimeRemaining.mockReturnValue(mockTimeRemaining)

    const { result } = renderHook(() => useTimeRemaining("2024-01-01T13:30:00Z"))

    expect(result.current).toEqual(mockTimeRemaining)
    expect(mockCalculateTimeRemaining).toHaveBeenCalledWith("2024-01-01T13:30:00Z")
  })

  it("should update time remaining every second", () => {
    const initialTime = {
      hours: 0,
      minutes: 5,
      seconds: 30,
      totalSeconds: 330,
      isExpired: false,
    }
    const updatedTime = {
      hours: 0,
      minutes: 5,
      seconds: 29,
      totalSeconds: 329,
      isExpired: false,
    }

    mockCalculateTimeRemaining.mockReturnValueOnce(initialTime).mockReturnValueOnce(updatedTime)

    const { result } = renderHook(() => useTimeRemaining("2024-01-01T12:05:30Z"))

    expect(result.current).toEqual(initialTime)

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(result.current).toEqual(updatedTime)
  })

  it("should stop updating when expired", () => {
    const expiredTime = {
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isExpired: true,
    }

    mockCalculateTimeRemaining.mockReturnValue(expiredTime)

    const { result } = renderHook(() => useTimeRemaining("2024-01-01T11:00:00Z"))

    expect(result.current).toEqual(expiredTime)

    // Advance time and verify no additional calls
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    // Should only be called twice: once for initial render, once for useEffect
    expect(mockCalculateTimeRemaining).toHaveBeenCalledTimes(2)
  })

  it("should cleanup interval on unmount", () => {
    const mockTimeRemaining = {
      hours: 1,
      minutes: 0,
      seconds: 0,
      totalSeconds: 3600,
      isExpired: false,
    }
    mockCalculateTimeRemaining.mockReturnValue(mockTimeRemaining)

    const { unmount } = renderHook(() => useTimeRemaining("2024-01-01T13:00:00Z"))

    const clearIntervalSpy = jest.spyOn(global, "clearInterval")

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})
