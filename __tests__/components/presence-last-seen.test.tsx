import { render, screen } from "@testing-library/react"
import jest from "jest"
import { formatLastSeen } from "@/components/presence-last-seen"
import { PresenceLastSeen } from "@/components/presence-last-seen"

jest.mock("@/lib/i18n/use-translations", () => ({
  useTranslations: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      const map: Record<string, string> = {
        "presence.seenJustNow": "Seen just now",
        "presence.seenMinutesAgo": "Seen {count} minute{plural} ago",
        "presence.seenHoursAgo": "Seen {count} hour{plural} ago",
        "presence.seenDaysAgo": "Seen {count} day{plural} ago",
        "presence.seenMonthsAgo": "Seen {count} month{plural} ago",
        "presence.seenMoreThanSixMonthsAgo": "Seen more than 6 months ago",
      }
      let value = map[key] ?? key
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, String(v))
        })
      }
      return value
    },
    locale: "en",
  }),
}))

const mockNow = new Date("2024-06-01T12:00:00Z").getTime()

const t = (key: string, params?: Record<string, string | number>) => {
  const map: Record<string, string> = {
    "presence.seenJustNow": "Seen just now",
    "presence.seenMinutesAgo": "Seen {count} minute{plural} ago",
    "presence.seenHoursAgo": "Seen {count} hour{plural} ago",
    "presence.seenDaysAgo": "Seen {count} day{plural} ago",
    "presence.seenMonthsAgo": "Seen {count} month{plural} ago",
    "presence.seenMoreThanSixMonthsAgo": "Seen more than 6 months ago",
  }
  let value = map[key] ?? key
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = value.replace(`{${k}}`, String(v))
    })
  }
  return value
}

describe("formatLastSeen", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(mockNow)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe("null / missing timestamps", () => {
    it("returns empty string for null", () => {
      expect(formatLastSeen(null, t)).toBe("")
    })

    it("returns empty string for undefined", () => {
      expect(formatLastSeen(undefined, t)).toBe("")
    })

    it("returns empty string for 0 (falsy epoch)", () => {
      // 0 is treated as missing — valid as per the null-check
      expect(formatLastSeen(0, t)).toBe("")
    })

    it("returns just-now for a future timestamp (clocks slightly ahead)", () => {
      const future = mockNow + 5000
      expect(formatLastSeen(future, t)).toBe("Seen just now")
    })
  })

  describe("just now (< 1 minute)", () => {
    it("returns 'Seen just now' for 30 seconds ago", () => {
      expect(formatLastSeen(mockNow - 30 * 1000, t)).toBe("Seen just now")
    })

    it("returns 'Seen just now' for 59 seconds ago", () => {
      expect(formatLastSeen(mockNow - 59 * 1000, t)).toBe("Seen just now")
    })
  })

  describe("minutes (1–59)", () => {
    it("returns singular '1 minute' for exactly 1 minute ago", () => {
      expect(formatLastSeen(mockNow - 60 * 1000, t)).toBe("Seen 1 minute ago")
    })

    it("returns plural '5 minutes' for 5 minutes ago", () => {
      expect(formatLastSeen(mockNow - 5 * 60 * 1000, t)).toBe("Seen 5 minutes ago")
    })

    it("returns '59 minutes' for 59 minutes ago", () => {
      expect(formatLastSeen(mockNow - 59 * 60 * 1000, t)).toBe("Seen 59 minutes ago")
    })
  })

  describe("hours (1–23)", () => {
    it("returns singular '1 hour' for exactly 1 hour ago", () => {
      expect(formatLastSeen(mockNow - 60 * 60 * 1000, t)).toBe("Seen 1 hour ago")
    })

    it("returns plural '3 hours' for 3 hours ago", () => {
      expect(formatLastSeen(mockNow - 3 * 60 * 60 * 1000, t)).toBe("Seen 3 hours ago")
    })

    it("returns '23 hours' for 23 hours ago", () => {
      expect(formatLastSeen(mockNow - 23 * 60 * 60 * 1000, t)).toBe("Seen 23 hours ago")
    })
  })

  describe("days (1–29)", () => {
    it("returns singular '1 day' for exactly 1 day ago", () => {
      expect(formatLastSeen(mockNow - 24 * 60 * 60 * 1000, t)).toBe("Seen 1 day ago")
    })

    it("returns plural '7 days' for 7 days ago", () => {
      expect(formatLastSeen(mockNow - 7 * 24 * 60 * 60 * 1000, t)).toBe("Seen 7 days ago")
    })

    it("returns '29 days' for 29 days ago", () => {
      expect(formatLastSeen(mockNow - 29 * 24 * 60 * 60 * 1000, t)).toBe("Seen 29 days ago")
    })
  })

  describe("months (1–6)", () => {
    it("returns singular '1 month' for ~30 days ago", () => {
      expect(formatLastSeen(mockNow - 30 * 24 * 60 * 60 * 1000, t)).toBe("Seen 1 month ago")
    })

    it("returns plural '3 months' for ~90 days ago", () => {
      expect(formatLastSeen(mockNow - 90 * 24 * 60 * 60 * 1000, t)).toBe("Seen 3 months ago")
    })

    it("returns '6 months' for ~180 days ago", () => {
      expect(formatLastSeen(mockNow - 180 * 24 * 60 * 60 * 1000, t)).toBe("Seen 6 months ago")
    })
  })

  describe("more than 6 months", () => {
    it("returns 'Seen more than 6 months ago' for ~7 months ago", () => {
      expect(formatLastSeen(mockNow - 210 * 24 * 60 * 60 * 1000, t)).toBe("Seen more than 6 months ago")
    })

    it("returns 'Seen more than 6 months ago' for 2 years ago", () => {
      expect(formatLastSeen(mockNow - 730 * 24 * 60 * 60 * 1000, t)).toBe("Seen more than 6 months ago")
    })
  })
})

describe("PresenceLastSeen", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(mockNow)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("renders nothing when user is online", () => {
    const { container } = render(
      <PresenceLastSeen isOnline={true} lastOnlineAt={mockNow - 10 * 60 * 1000} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders nothing when lastOnlineAt is null", () => {
    const { container } = render(<PresenceLastSeen isOnline={false} lastOnlineAt={null} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders nothing when lastOnlineAt is undefined", () => {
    const { container } = render(<PresenceLastSeen isOnline={false} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders last-seen text when offline with timestamp", () => {
    render(<PresenceLastSeen isOnline={false} lastOnlineAt={mockNow - 5 * 60 * 1000} />)
    expect(screen.getByText("Seen 5 minutes ago")).toBeInTheDocument()
  })

  it("applies default className when none provided", () => {
    const { container } = render(
      <PresenceLastSeen isOnline={false} lastOnlineAt={mockNow - 60 * 1000} />,
    )
    expect(container.firstChild).toHaveClass("text-xs", "text-grayscale-600")
  })

  it("applies custom className when provided", () => {
    const { container } = render(
      <PresenceLastSeen isOnline={false} lastOnlineAt={mockNow - 60 * 1000} className="custom-class" />,
    )
    expect(container.firstChild).toHaveClass("custom-class")
  })
})
