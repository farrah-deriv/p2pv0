"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/i18n/use-translations"
import { getHomeUrl } from "@/lib/utils"

export function P2PRegionNotSupported() {
  const { t } = useTranslations()

  const handleBackToHome = () => {
    window.location.href = getHomeUrl("home")
  }

  return (
    <div className="flex h-dvh w-full flex-col bg-background md:items-center md:justify-center md:gap-6 md:px-6">
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center md:flex-none md:px-0">
        <Image
          src="/icons/illustration-unsupported-region.png"
          alt={t("p2pRegion.illustrationAlt")}
          width={160}
          height={160}
          className="size-[160px] object-contain"
        />
        <h1 className="mt-6 text-2xl font-extrabold leading-8 text-grayscale-600 md:mt-0 md:text-[28px] md:leading-9">
          {t("p2pRegion.title")}
        </h1>
        <p className="mt-2 max-w-lg text-base leading-6 text-grayscale-600">
          {t("p2pRegion.description")}
        </p>
      </div>
      <div className="w-full shrink-0 px-6 pb-6 md:w-auto md:px-0 md:pb-0">
        <Button
          variant="primary"
          className="h-12 w-full md:w-[280px]"
          onClick={handleBackToHome}
        >
          {t("p2pRegion.backToHome")}
        </Button>
      </div>
    </div>
  )
}
