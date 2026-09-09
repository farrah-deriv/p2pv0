import jest from "jest"
import { renderHook, act } from "@testing-library/react"
import { useP2PAnnouncements } from "@/hooks/use-p2p-announcements"

const WHATS_NEW_SEEN_KEY = "p2p.whatsNew.seenTag"
const WHATS_COMING_DISMISSED_KEY = "p2p.whatsComing.dismissedTag"

const RELEASE_TAG = "production_v20260421_0"
const COMING_TAG = "production_v20260421_0"

function setEnv(vars: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

describe("useP2PAnnouncements", () => {
  beforeEach(() => {
    localStorage.clear()
    setEnv({
      NEXT_PUBLIC_RELEASE_TAG: undefined,
      NEXT_PUBLIC_DATADOG_VERSION: undefined,
      NEXT_PUBLIC_P2P_WHATS_NEW_ENABLED: undefined,
      NEXT_PUBLIC_P2P_WHATS_COMING_TAG: undefined,
    })
  })

  it("returns null when no env gates are set", () => {
    const { result } = renderHook(() => useP2PAnnouncements())
    expect(result.current.isReady).toBe(true)
    expect(result.current.currentAnnouncement).toBeNull()
  })

  it("returns null when whats-new is enabled but release tag is missing", () => {
    setEnv({ NEXT_PUBLIC_P2P_WHATS_NEW_ENABLED: "1" })
    const { result } = renderHook(() => useP2PAnnouncements())
    expect(result.current.currentAnnouncement).toBeNull()
  })

  it("returns null when whats-new has release tag but enabled flag is off", () => {
    setEnv({
      NEXT_PUBLIC_RELEASE_TAG: RELEASE_TAG,
      NEXT_PUBLIC_P2P_WHATS_NEW_ENABLED: "0",
    })
    const { result } = renderHook(() => useP2PAnnouncements())
    expect(result.current.currentAnnouncement).toBeNull()
  })

  it("shows whats-new when enabled and tag is unseen", () => {
    setEnv({
      NEXT_PUBLIC_RELEASE_TAG: RELEASE_TAG,
      NEXT_PUBLIC_P2P_WHATS_NEW_ENABLED: "1",
    })
    const { result } = renderHook(() => useP2PAnnouncements())
    expect(result.current.currentAnnouncement).toBe("whatsNew")
  })

  it("does not show whats-new after it was dismissed for the same tag", () => {
    localStorage.setItem(WHATS_NEW_SEEN_KEY, RELEASE_TAG)
    setEnv({
      NEXT_PUBLIC_RELEASE_TAG: RELEASE_TAG,
      NEXT_PUBLIC_P2P_WHATS_NEW_ENABLED: "1",
    })
    const { result } = renderHook(() => useP2PAnnouncements())
    expect(result.current.currentAnnouncement).toBeNull()
  })

  it("shows whats-new again when release tag changes", () => {
    localStorage.setItem(WHATS_NEW_SEEN_KEY, "production_v20260401_0")
    setEnv({
      NEXT_PUBLIC_RELEASE_TAG: RELEASE_TAG,
      NEXT_PUBLIC_P2P_WHATS_NEW_ENABLED: "1",
    })
    const { result } = renderHook(() => useP2PAnnouncements())
    expect(result.current.currentAnnouncement).toBe("whatsNew")
  })

  it("shows whats-coming when tag is set and unseen", () => {
    setEnv({ NEXT_PUBLIC_P2P_WHATS_COMING_TAG: COMING_TAG })
    const { result } = renderHook(() => useP2PAnnouncements())
    expect(result.current.currentAnnouncement).toBe("whatsComing")
  })

  it("does not show whats-coming after dismissal for same tag", () => {
    localStorage.setItem(WHATS_COMING_DISMISSED_KEY, COMING_TAG)
    setEnv({ NEXT_PUBLIC_P2P_WHATS_COMING_TAG: COMING_TAG })
    const { result } = renderHook(() => useP2PAnnouncements())
    expect(result.current.currentAnnouncement).toBeNull()
  })

  it("prioritises whats-new over whats-coming when both are eligible", () => {
    setEnv({
      NEXT_PUBLIC_RELEASE_TAG: RELEASE_TAG,
      NEXT_PUBLIC_P2P_WHATS_NEW_ENABLED: "1",
      NEXT_PUBLIC_P2P_WHATS_COMING_TAG: COMING_TAG,
    })
    const { result } = renderHook(() => useP2PAnnouncements())
    expect(result.current.currentAnnouncement).toBe("whatsNew")
  })

  it("surfaces whats-coming after whats-new is dismissed", () => {
    setEnv({
      NEXT_PUBLIC_RELEASE_TAG: RELEASE_TAG,
      NEXT_PUBLIC_P2P_WHATS_NEW_ENABLED: "1",
      NEXT_PUBLIC_P2P_WHATS_COMING_TAG: COMING_TAG,
    })
    const { result } = renderHook(() => useP2PAnnouncements())
    expect(result.current.currentAnnouncement).toBe("whatsNew")

    act(() => {
      result.current.dismissAnnouncement()
    })

    expect(localStorage.getItem(WHATS_NEW_SEEN_KEY)).toBe(RELEASE_TAG)
    expect(result.current.currentAnnouncement).toBe("whatsComing")
  })

  it("persists dismissal tag in localStorage when dismissing whats-coming", () => {
    setEnv({ NEXT_PUBLIC_P2P_WHATS_COMING_TAG: COMING_TAG })
    const { result } = renderHook(() => useP2PAnnouncements())

    act(() => {
      result.current.dismissAnnouncement()
    })

    expect(localStorage.getItem(WHATS_COMING_DISMISSED_KEY)).toBe(COMING_TAG)
    expect(result.current.currentAnnouncement).toBeNull()
  })

  it("falls back to NEXT_PUBLIC_DATADOG_VERSION when RELEASE_TAG is absent", () => {
    setEnv({
      NEXT_PUBLIC_DATADOG_VERSION: RELEASE_TAG,
      NEXT_PUBLIC_P2P_WHATS_NEW_ENABLED: "1",
    })
    const { result } = renderHook(() => useP2PAnnouncements())
    expect(result.current.currentAnnouncement).toBe("whatsNew")
  })
})
