export type AnnouncementKind = "whatsNew" | "whatsComing"

export const ANNOUNCEMENT_STORAGE_KEYS = {
  whatsNew: "p2p.whatsNew.seenTag",
  whatsComing: "p2p.whatsComing.dismissedTag",
} as const

export const ANNOUNCEMENT_ASSET_PATHS = {
  whatsNew: ["/illustrations/whats-new/closed_group.png"],
  whatsComing: "/illustrations/announcement-whats-coming.svg",
} as const

export const ANNOUNCEMENT_TRANSLATION_KEYS = {
  whatsNew: {
    title: "p2pAnnouncement.whatsNew.title",
    description: "p2pAnnouncement.whatsNew.description",
    primaryCta: "p2pAnnouncement.whatsNew.primaryCta",
  },
  whatsComing: {
    title: "p2pAnnouncement.whatsComing.title",
    bullets: [
      "p2pAnnouncement.whatsComing.bullet0",
      "p2pAnnouncement.whatsComing.bullet1",
      "p2pAnnouncement.whatsComing.bullet2",
    ],
    primaryCta: "p2pAnnouncement.whatsComing.primaryCta",
    secondaryCta: "p2pAnnouncement.whatsComing.secondaryCta",
  },
} as const

export function getReleaseTag(): string {
  return (
    process.env.NEXT_PUBLIC_RELEASE_TAG ||
    process.env.NEXT_PUBLIC_DATADOG_VERSION ||
    ""
  )
}

export function getWhatsComingTag(): string {
  return process.env.NEXT_PUBLIC_P2P_WHATS_COMING_TAG || ""
}

export function isWhatsNewEnabled(): boolean {
  return process.env.NEXT_PUBLIC_P2P_WHATS_NEW_ENABLED === "1"
}
