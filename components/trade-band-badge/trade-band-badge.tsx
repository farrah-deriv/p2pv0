"use client"

import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { StandaloneChevronRightRegularIcon } from "@deriv/quill-icons/Standalone"
import Image from "next/image"
import { Link } from "@/components/ui/link"
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
              <Link
                type="secondary-static-dark"
                size="sm"
                href="#"
                onClick={(e) => { e.preventDefault(); redirectToHelpCentre(); }}
              >
                {t("common.learnMore")}
                <StandaloneChevronRightRegularIcon iconSize="xs" aria-hidden="true" className="rtl:rotate-180" />
              </Link>
            )}
          </>
          <TooltipArrow className="fill-black" />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
