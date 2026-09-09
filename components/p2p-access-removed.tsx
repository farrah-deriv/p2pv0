"use client"

import Image from "next/image"
import { useTranslations } from "@/lib/i18n/use-translations"

export function P2PAccessRemoved() {
  const { t } = useTranslations()
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6 py-12">
      <div className="flex flex-col items-center text-center">
        <div className="mb-8">
          <Image
            src="/icons/illustration-blocked-users.svg"
            alt={t("p2pAccess.illustrationAlt")}
            width={128}
            height={128}
          />
        </div>

        <h1 className="text-base font-bold text-slate-1200 mb-2">{t("p2pAccess.title")}</h1>

        <p className="text-base text-slate-1200 mb-8">{t("p2pAccess.description")}</p>
      </div>
    </div>
  )
}
