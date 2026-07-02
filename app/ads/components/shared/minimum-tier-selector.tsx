"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n/use-translations"

export type MinimumTradeBand = "silver" | "gold" | "diamond" | null

interface MinimumTierSelectorProps {
  value: MinimumTradeBand
  onValueChange: (value: MinimumTradeBand) => void
  adType: "buy" | "sell"
  className?: string
}

interface TierOption {
  value: MinimumTradeBand
  titleKey: string
  descriptionKey: string
  icons: Array<"bronze" | "silver" | "gold" | "diamond">
}

const TIER_OPTIONS: TierOption[] = [
  {
    value: null,
    titleKey: "adForm.tierAllTiers",
    descriptionKey: "adForm.tierAllTiersDescription",
    icons: ["bronze", "silver", "gold", "diamond"],
  },
  {
    value: "silver",
    titleKey: "adForm.tierSilverAndAbove",
    descriptionKey: "adForm.tierSilverDescription",
    icons: ["silver", "gold", "diamond"],
  },
  {
    value: "gold",
    titleKey: "adForm.tierGoldAndAbove",
    descriptionKey: "adForm.tierGoldDescription",
    icons: ["gold", "diamond"],
  },
  {
    value: "diamond",
    titleKey: "adForm.tierDiamondOnly",
    descriptionKey: "adForm.tierDiamondDescription",
    icons: ["diamond"],
  },
]

const ICON_SIZE = 18
const ICON_STEP = 12

function OverlappingTierIcons({ icons }: { icons: TierOption["icons"] }) {
  if (icons.length === 0) return null
  const width = ICON_STEP * (icons.length - 1) + ICON_SIZE + 4
  return (
    <div className="relative shrink-0" style={{ width, height: ICON_SIZE }}>
      {icons.map((name, i) => (
        <Image
          key={`${name}-${i}`}
          src={`/icons/${name}.svg`}
          alt=""
          aria-hidden="true"
          width={ICON_SIZE}
          height={ICON_SIZE}
          className="absolute top-0"
          style={{ insetInlineStart: i * ICON_STEP }}
        />
      ))}
    </div>
  )
}

function TierRow({
  option,
  isSelected,
  onSelect,
  t,
}: {
  option: TierOption
  isSelected: boolean
  onSelect: () => void
  t: (key: string) => string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-start rounded-lg p-4 bg-grayscale-500 transition-colors",
        "border-[1.5px]",
        isSelected ? "border-black" : "border-transparent",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-base text-black">{t(option.titleKey)}</span>
        <OverlappingTierIcons icons={option.icons} />
      </div>
      <div className="mt-1 text-sm text-grayscale-100">{t(option.descriptionKey)}</div>
    </button>
  )
}

export default function MinimumTierSelector({
  value,
  onValueChange,
  adType,
  className,
}: MinimumTierSelectorProps) {
  const isMobile = useIsMobile()
  const { t } = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = TIER_OPTIONS.find((option) => option.value === value) ?? TIER_OPTIONS[0]
  const triggerLabel =
    adType === "sell" ? t("adForm.minimumBuyerTier") : t("adForm.minimumSellerTier")

  const handleSelect = (next: MinimumTradeBand) => {
    onValueChange(next)
    setIsOpen(false)
  }

  // Close desktop expansion when clicking outside
  useEffect(() => {
    if (isMobile || !isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobile, isOpen])

  const TierList = ({ withTitle }: { withTitle?: boolean }) => (
    <div className="space-y-2">
      {withTitle && (
        <h3 className="text-2xl font-extrabold text-black mb-4">
          {t("adForm.minimumTierSheetTitle")}
        </h3>
      )}
      {TIER_OPTIONS.map((option) => (
        <TierRow
          key={option.value ?? "all"}
          option={option}
          isSelected={option.value === value}
          onSelect={() => handleSelect(option.value)}
          t={t}
        />
      ))}
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <div className={cn("relative", className)}>
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-[56px] max-h-none justify-start rounded-lg bg-transparent border-input hover:bg-transparent focus:border-black font-normal ps-4 pe-12 [&>svg]:hidden",
                "pt-6 pb-2",
              )}
            >
              <span className="text-start text-base text-grayscale-600">
                {t(selectedOption.titleKey)}
              </span>
            </Button>
          </DrawerTrigger>
          <label className="absolute start-[14px] top-2 text-[12px] font-normal text-grayscale-600 pointer-events-none bg-white px-1">
            {triggerLabel}
          </label>
          <div className="absolute end-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Image
              src="/icons/chevron-down.png"
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
              className={cn("transition-transform", isOpen && "rotate-180")}
            />
          </div>
        </div>
        <DrawerContent className="h-fit">
          <div className="p-4">
            <TierList withTitle />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full h-[56px] max-h-none justify-start rounded-lg bg-transparent border-input hover:bg-transparent focus:border-black font-normal ps-4 pe-12 [&>svg]:hidden",
          "pt-6 pb-2",
        )}
      >
        <span className="text-start text-base text-grayscale-600">
          {t(selectedOption.titleKey)}
        </span>
      </Button>
      <label className="absolute start-[14px] top-2 text-[12px] font-normal text-grayscale-600 pointer-events-none bg-white px-1">
        {triggerLabel}
      </label>
      <div className="absolute end-4 top-[28px] -translate-y-1/2 pointer-events-none">
        <Image
          src="/icons/chevron-down.png"
          alt=""
          aria-hidden="true"
          width={24}
          height={24}
          className={cn("transition-transform", isOpen && "rotate-180")}
        />
      </div>
      {isOpen && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-lg bg-white shadow-lg p-2 border border-grayscale-200">
          <TierList />
        </div>
      )}
    </div>
  )
}
