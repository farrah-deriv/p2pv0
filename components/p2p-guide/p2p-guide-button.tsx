"use client"

import Image from "next/image"
import { useGuideStore } from "@/stores/guide-store"
import { useTranslations } from "@/lib/i18n/use-translations"

export function P2PGuideButton({ className, guideType = "markets" }: { className?: string; guideType?: "markets" | "ads" }) {
  const { t } = useTranslations()
  const startGuide = useGuideStore((state) => state.startGuide)

  return (
    <button
      type="button"
      onClick={() => startGuide(guideType)}
      aria-label={t("guideIntro.openGuide")}
      className={className ?? "flex h-10 w-10 items-center justify-center rounded-3xl border border-neutral-200 transition-colors hover:bg-neutral-50"}
    >
      <Image src="/icons/ic-guide-notebook.svg" alt="" width={20} height={20} aria-hidden />
    </button>
  )
}
