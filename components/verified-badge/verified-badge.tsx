"use client"

import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useIsMobile } from "@/hooks/use-mobile"

interface VerifiedBadgeProps {
  size?: number
}

export default function VerifiedBadge({ size = 20 }: VerifiedBadgeProps) {
  const { t } = useTranslations()
  const isMobile = useIsMobile()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Image
            src="/icons/verified-badge.svg"
            className="cursor-pointer"
            alt="Verified"
            width={size}
            height={size * 1.5}
            style={{ width: size, height: size * 1.5 }}
          />
        </TooltipTrigger>
        <TooltipContent align={isMobile ? "middle" : "start"} side="bottom" className="max-w-[328px] text-wrap">
          <p className="font-bold text-white mb-2">{t("common.verifiedBadge.title")}</p>
          <p className="text-white">{t("common.verifiedBadge.description")}</p>
          <TooltipArrow className="fill-black" />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
