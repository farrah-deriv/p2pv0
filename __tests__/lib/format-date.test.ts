import { formatAppDate, formatAppMonthYear, getMondayFirstWeekdayLabels } from "@/lib/format-date"

describe("format-date", () => {
  it("formats month year with locale", () => {
    const date = new Date(2024, 5, 15)
    expect(formatAppMonthYear(date, "en")).toMatch(/Jun.*2024|2024.*Jun/i)
    expect(formatAppMonthYear(date, "ar").length).toBeGreaterThan(0)
  })

  it("formats short date with locale", () => {
    const date = new Date(2024, 0, 5)
    const formatted = formatAppDate(date, "en")
    expect(formatted).toMatch(/05|5/)
    expect(formatted).toMatch(/2024/)
  })

  it("returns seven Monday-first weekday labels", () => {
    const labels = getMondayFirstWeekdayLabels("en")
    expect(labels).toHaveLength(7)
    expect(labels.every((label) => label.length > 0)).toBe(true)
  })
})
