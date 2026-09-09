"use client"

import { useP2PAnnouncements } from "@/hooks/use-p2p-announcements"
import { P2PAnnouncement } from "./p2p-announcement"

export function P2PAnnouncementController() {
  const { currentAnnouncement, dismissAnnouncement, isReady } =
    useP2PAnnouncements()

  if (!isReady || !currentAnnouncement) return null

  return (
    <P2PAnnouncement kind={currentAnnouncement} onDismiss={dismissAnnouncement} />
  )
}
