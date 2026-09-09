import { parseDurationMinutes } from "@/lib/format-duration"

describe("parseDurationMinutes", () => {
  describe("invalid / no-data cases", () => {
    it("returns invalid for null", () => {
      expect(parseDurationMinutes(null)).toEqual({ kind: "invalid" })
    })

    it("returns invalid for undefined", () => {
      expect(parseDurationMinutes(undefined)).toEqual({ kind: "invalid" })
    })
  })

  describe("zero / non-positive cases", () => {
    it("returns zero for 0", () => {
      expect(parseDurationMinutes(0)).toEqual({ kind: "zero" })
    })

    it("returns zero for negative values", () => {
      expect(parseDurationMinutes(-5)).toEqual({ kind: "zero" })
    })

    it("rounds 0.4 to 0 → zero", () => {
      expect(parseDurationMinutes(0.4)).toEqual({ kind: "zero" })
    })
  })

  describe("minutes (< 60)", () => {
    it("returns minutes for 1", () => {
      expect(parseDurationMinutes(1)).toEqual({ kind: "minutes", value: 1 })
    })

    it("returns minutes for 45", () => {
      expect(parseDurationMinutes(45)).toEqual({ kind: "minutes", value: 45 })
    })

    it("returns minutes for 59", () => {
      expect(parseDurationMinutes(59)).toEqual({ kind: "minutes", value: 59 })
    })

    it("rounds decimal input — 45.6 → 46", () => {
      expect(parseDurationMinutes(45.6)).toEqual({ kind: "minutes", value: 46 })
    })

    it("rounds decimal input — 45.4 → 45", () => {
      expect(parseDurationMinutes(45.4)).toEqual({ kind: "minutes", value: 45 })
    })

    it("rounds decimal input — 90.5 → 91 minutes → hours", () => {
      // 91 >= 60 → hours
      expect(parseDurationMinutes(90.5)).toEqual({ kind: "hours", h: 1, m: 31 })
    })
  })

  describe("exact hour boundaries", () => {
    it("60 minutes → 1h 0m", () => {
      expect(parseDurationMinutes(60)).toEqual({ kind: "hours", h: 1, m: 0 })
    })

    it("120 minutes → 2h 0m", () => {
      expect(parseDurationMinutes(120)).toEqual({ kind: "hours", h: 2, m: 0 })
    })
  })

  describe("hours with remainders", () => {
    it("90 minutes → 1h 30m", () => {
      expect(parseDurationMinutes(90)).toEqual({ kind: "hours", h: 1, m: 30 })
    })

    it("135 minutes → 2h 15m", () => {
      expect(parseDurationMinutes(135)).toEqual({ kind: "hours", h: 2, m: 15 })
    })

    it("1439 minutes (just under 24h) → 23h 59m", () => {
      expect(parseDurationMinutes(1439)).toEqual({ kind: "hours", h: 23, m: 59 })
    })
  })

  describe("days (>= 1440 minutes)", () => {
    it("1440 minutes → 1d 0h", () => {
      expect(parseDurationMinutes(1440)).toEqual({ kind: "days", d: 1, h: 0 })
    })

    it("1500 minutes → 1d 1h", () => {
      expect(parseDurationMinutes(1500)).toEqual({ kind: "days", d: 1, h: 1 })
    })

    it("7200 minutes (5 days) → 5d 0h", () => {
      expect(parseDurationMinutes(7200)).toEqual({ kind: "days", d: 5, h: 0 })
    })

    it("7320 minutes (5d 2h) → 5d 2h", () => {
      expect(parseDurationMinutes(7320)).toEqual({ kind: "days", d: 5, h: 2 })
    })
  })

  describe("float inputs (issue #1 — integer assumption bug)", () => {
    it("rounds 90.5 correctly — not 1h 30.5m", () => {
      const result = parseDurationMinutes(90.5)
      expect(result.kind).toBe("hours")
      if (result.kind === "hours") {
        expect(Number.isInteger(result.h)).toBe(true)
        expect(Number.isInteger(result.m)).toBe(true)
      }
    })

    it("rounds 59.9 → 60 → 1h 0m", () => {
      expect(parseDurationMinutes(59.9)).toEqual({ kind: "hours", h: 1, m: 0 })
    })

    it("rounds 59.4 → 59 minutes", () => {
      expect(parseDurationMinutes(59.4)).toEqual({ kind: "minutes", value: 59 })
    })
  })
})
