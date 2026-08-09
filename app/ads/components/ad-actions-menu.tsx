"use client"

import Image from "next/image"
import type { Ad } from "../types"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/i18n/use-translations"

interface AdActionsMenuProps {
  ad: Ad
  onEdit: (ad: Ad) => void
  onToggleStatus: (ad: Ad) => void
  onDelete: (adId: string) => void
  onShare?: (ad: Ad) => void
  variant?: "default" | "drawer"
}

export function AdActionsMenu({
  ad,
  onEdit,
  onToggleStatus,
  onDelete,
  onShare,
  variant = "default",
}: AdActionsMenuProps) {
  const { t } = useTranslations()
  const isActive = ad.is_active !== undefined ? ad.is_active : ad.status === "Active"
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="w-full hover:!bg-transparent !font-normal !justify-start !text-grayscale-600 !my-1"
        onClick={() => onEdit(ad)}
        data-testid={`ads-btn-edit-${ad.id}`}
      >
        <span className="flex items-center gap-2">
          <Image src="/icons/edit.svg" alt={t("common.edit")} width={14} height={16} />
          {t("myAds.edit")}
        </span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full hover:!bg-transparent !font-normal !justify-start !text-grayscale-600 !my-1"
        onClick={() => onShare(ad)}
      >
        <span className="flex items-center gap-2">
          <Image src="/icons/share-icon.svg" alt={t("myAds.share")} width={14} height={16} />
          {t("myAds.share")}
        </span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full hover:!bg-transparent !font-normal !justify-start !text-grayscale-600 !my-1"
        onClick={() => onToggleStatus(ad)}
      >
        <span className="flex items-center gap-2">
          <Image src="/icons/deactivate.svg" alt={t("common.toggleStatus")} width={14} height={16} />
          {isActive ? t("myAds.deactivate") : t("myAds.activate")}
        </span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full hover:!bg-transparent !font-normal !justify-start !my-1"
        onClick={() => onDelete(ad.id)}
        data-testid={`ads-btn-delete-${ad.id}`}
      >
        <span className="flex items-center gap-2">
          <Image src="/icons/delete.svg" alt={t("common.delete")} width={14} height={16} />
          <span className="text-disputed-icon">{t("myAds.delete")}</span>
        </span>
      </Button>
    </>
  )
}
