import { calculateTimeRemaining} from "@/lib/time-utils"
import jest from "jest"

// Mock Date.now() for consistent testing
const mockNow = new Date("2024-01-01T12:00:00Z").getTime()
jest.spyOn(Date, "now").mockImplementation(() => mockNow)

describe("time-utils", () => {
  describe("calculateTimeRemaining", () => {
    it("should calculate time remaining correctly", () => {
      const expiresAt = new Date("2024-01-01T13:30:45Z").toISOString() // 1h 30m 45s from now
      const result = calculateTimeRemaining(expiresAt)

      expect(result).toEqual({
        hours: 1,
        minutes: 30,
        seconds: 45,
        totalSeconds: 5445,
        isExpired: false,
      })
    })

    it("should return expired state for past dates", () => {
      const expiresAt = new Date("2024-01-01T11:00:00Z").toISOString() // 1 hour ago
      const result = calculateTimeRemaining(expiresAt)

      expect(result).toEqual({
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isExpired: true,
      })
    })

    it("should handle edge case of exactly expired", () => {
      const expiresAt = new Date("2024-01-01T12:00:00Z").toISOString() // exactly now
      const result = calculateTimeRemaining(expiresAt)

      expect(result.isExpired).toBe(true)
    })
  })

})
