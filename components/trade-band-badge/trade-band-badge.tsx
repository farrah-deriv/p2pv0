"use client"

import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { getHelpCentreUrl } from "@/lib/get-help-centre-url"
import { useTranslations } from "@/lib/i18n/use-translations"

interface TradeBandBadgeProps {
  tradeBand: string
  showLearnMore?: boolean
  size?: number
  width?: number
  height?: number
  className?: string
}

const TRADE_BAND_CONFIG = {
  bronze: {
    icon: "/icons/bronze.svg",
    alt: "Bronze",
    titleKey: "profile.bronzeTier",
    descriptionKey: "profile.bronzeTierDescription",
  },
  silver: {
    icon: "/icons/silver.svg",
    alt: "Silver",
    titleKey: "profile.silverTier",
    descriptionKey: "profile.silverTierDescription",
  },
  gold: {
    icon: "/icons/gold.svg",
    alt: "Gold",
    titleKey: "profile.goldTier",
    descriptionKey: "profile.goldTierDescription",
  },
  diamond: {
    icon: "/icons/diamond.svg",
    alt: "Diamond",
    titleKey: "profile.diamondTier",
    descriptionKey: "profile.diamondTierDescription",
  },
} as const

export function TradeBandBadge({ tradeBand, showLearnMore = false, size = 18, width, height, className = "" }: TradeBandBadgeProps) {
  const { t, locale } = useTranslations()

  const config = TRADE_BAND_CONFIG[tradeBand as keyof typeof TRADE_BAND_CONFIG]

  if (!config) {
    return null
  }

  const redirectToHelpCentre = () => {
    const baseUrl = getHelpCentreUrl(locale)
    const url = `${baseUrl}/help-centre-question/p2p-tier-requirements`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <TooltipProvider>
      <Tooltip disableHoverableContent={false}>
        <TooltipTrigger asChild>
          <Image
            src={config.icon || "/placeholder.svg"}
            alt={config.alt}
            width={width ?? size}
            height={height ?? size}
            className={`cursor-pointer ${className}`}
            style={{ width: width ?? size, height: height ?? size }}
          />
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[340px] text-wrap">
          <>
            <p className="font-bold text-white mb-2">{t(config.titleKey)}</p>
            <p className={`text-white ${showLearnMore ? "mb-4" : ""}`}>{t(config.descriptionKey)}</p>
            {showLearnMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={redirectToHelpCentre}
                className="h-auto text-white hover:bg-transparent hover:text-white p-0 font-normal text-xs"
              >
                {t("common.learnMore")}
                <Image
                  src="/icons/chevron-right-white.png"
                  alt={t("common.arrow")}
                  width={8}
                  height={18}
                  className="ms-2 cursor-pointer"
                />
              </Button>
            )}
          </>
          <TooltipArrow className="fill-black" />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
