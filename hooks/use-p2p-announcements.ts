"use client"

import { useState, useEffect, useCallback } from "react"
import {
  type AnnouncementKind,
  ANNOUNCEMENT_STORAGE_KEYS,
  getReleaseTag,
  getWhatsComingTag,
  isWhatsNewEnabled,
} from "@/components/p2p-announcement/p2p-announcement-config"

interface UseP2PAnnouncementsReturn {
  currentAnnouncement: AnnouncementKind | null
  dismissAnnouncement: () => void
  isReady: boolean
}

// Use sessionStorage as a same-session fallback when localStorage is blocked
// (e.g. private browsing with strict settings). This prevents the announcement
// from re-appearing on every route change within the same session.
function getStorage(): Storage | null {
  try {
    localStorage.setItem("__p2p_test__", "1")
    localStorage.removeItem("__p2p_test__")
    return localStorage
  } catch {
    try {
      return sessionStorage
    } catch {
      return null
    }
  }
}

function readStoredTag(key: string): string {
  try {
    return getStorage()?.getItem(key) ?? ""
  } catch {
    return ""
  }
}

function writeStoredTag(key: string, value: string): void {
  try {
    getStorage()?.setItem(key, value)
  } catch {
    // silently ignore if both storages are unavailable
  }
}

function resolveEligible(): AnnouncementKind | null {
  const releaseTag = getReleaseTag()
  const whatsComingTag = getWhatsComingTag()
  const whatsNewEnabled = isWhatsNewEnabled()
  const seenTag = readStoredTag(ANNOUNCEMENT_STORAGE_KEYS.whatsNew)
  const dismissedTag = readStoredTag(ANNOUNCEMENT_STORAGE_KEYS.whatsComing)

  // Debug logs are removed in production builds. Only visible during local development.
  if (process.env.NODE_ENV === "development") {
    console.debug("[P2PAnnouncement] env", {
      NEXT_PUBLIC_RELEASE_TAG: process.env.NEXT_PUBLIC_RELEASE_TAG,
      NEXT_PUBLIC_DATADOG_VERSION: process.env.NEXT_PUBLIC_DATADOG_VERSION,
      NEXT_PUBLIC_P2P_WHATS_NEW_ENABLED: process.env.NEXT_PUBLIC_P2P_WHATS_NEW_ENABLED,
      NEXT_PUBLIC_P2P_WHATS_COMING_TAG: process.env.NEXT_PUBLIC_P2P_WHATS_COMING_TAG,
    })
    console.debug("[P2PAnnouncement] resolved", {
      releaseTag,
      whatsComingTag,
      whatsNewEnabled,
      seenTag,
      dismissedTag,
    })
  }

  const whatsNewEligible =
    whatsNewEnabled &&
    Boolean(releaseTag) &&
    seenTag !== releaseTag

  const whatsComingEligible =
    Boolean(whatsComingTag) &&
    dismissedTag !== whatsComingTag

  if (process.env.NODE_ENV === "development") {
    console.debug("[P2PAnnouncement] eligibility", { whatsNewEligible, whatsComingEligible })
  }

  // What's New has priority. After it is dismissed the controller re-evaluates,
  // which surfaces What's Coming if still eligible.
  if (whatsNewEligible) return "whatsNew"
  if (whatsComingEligible) return "whatsComing"
  return null
}

export function useP2PAnnouncements(): UseP2PAnnouncementsReturn {
  const [isReady, setIsReady] = useState(false)
  const [currentAnnouncement, setCurrentAnnouncement] =
    useState<AnnouncementKind | null>(null)

  useEffect(() => {
    // Resolve entirely client-side to avoid localStorage access on server
    // and prevent hydration mismatches.
    setCurrentAnnouncement(resolveEligible())
    setIsReady(true)
  }, [])

  // resolveEligible is a stable module-level function that only reads from
  // process.env (build-time constants) and storage — no React state involved.
  // currentAnnouncement is the only React value captured in this callback,
  // so it is the only required dependency.
  const dismissAnnouncement = useCallback(() => {
    if (!currentAnnouncement) return

    // Inline the tag writes here so this callback has no hidden dependencies
    // on module-level helpers that the exhaustive-deps rule cannot inspect.
    if (currentAnnouncement === "whatsNew") {
      writeStoredTag(ANNOUNCEMENT_STORAGE_KEYS.whatsNew, getReleaseTag())
    } else if (currentAnnouncement === "whatsComing") {
      writeStoredTag(ANNOUNCEMENT_STORAGE_KEYS.whatsComing, getWhatsComingTag())
    }

    // Re-evaluate after dismissal so What's Coming can surface when
    // What's New was the one just dismissed.
    setCurrentAnnouncement(resolveEligible())
  }, [currentAnnouncement])

  return { currentAnnouncement, dismissAnnouncement, isReady }
}
