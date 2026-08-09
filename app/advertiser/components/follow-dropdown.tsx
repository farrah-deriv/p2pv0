"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { useUserDataStore } from "@/stores/user-data-store"
import { cn, IS_CLOSED_GROUP_ENABLED } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n/use-translations"
interface FollowDropdownProps {
  isFollowing: boolean
  isGroupMember: boolean
  isLoading: boolean
  onUnfollow: () => void
  onAddToClosedGroup: () => void
  onRemoveFromClosedGroup: () => void
  nickname: string
}

export default function FollowDropdown({
  isFollowing,
  isGroupMember,
  isLoading,
  onUnfollow,
  onAddToClosedGroup,
  onRemoveFromClosedGroup,
  nickname
}: FollowDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()
  const userData = useUserDataStore((state) => state.userData)
  const { t } = useTranslations()
  const isClosedGroupEnabled = IS_CLOSED_GROUP_ENABLED && userData?.trade_band === "diamond"

  const handleUnfollow = () => {
    onUnfollow()
    setIsOpen(false)
  }

  const handleAddToClosedGroup = () => {
    onAddToClosedGroup()
    setIsOpen(false)
  }

  const handleRemoveFromClosedGroup = () => {
    onRemoveFromClosedGroup()
    setIsOpen(false)
  }

  if (!isFollowing) {
    return null
  }

  if (!isMobile) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary-outline" size="sm" disabled={isLoading}>
            <span className="flex items-center gap-2">
              {t("advertiser.following")}
              <Image
                src="/icons/chevron-down.svg"
                alt=""
                width={14}
                height={22}
                className={cn("transition-transform duration-200", isOpen && "rotate-180")}
              />
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="p-2 w-[280px]">
          {isClosedGroupEnabled && (
            isGroupMember ? (<DropdownMenuItem
              data-testid="advertiser-btn-remove-closed-group"
              onClick={handleRemoveFromClosedGroup}
              className="flex items-center gap-2 py-3 px-4 cursor-pointer"
            >
              <Image src="/icons/star.svg" alt={t("advertiser.removeFromClosedGroup")} width={16} height={24} />
              <span className="text-base text-grayscale-600">{t("advertiser.removeFromClosedGroup")}</span>
            </DropdownMenuItem>) : (<DropdownMenuItem
              data-testid="advertiser-btn-add-closed-group"
              onClick={handleAddToClosedGroup}
              className="flex items-center gap-2 py-3 px-4 cursor-pointer"
            >
              <Image src="/icons/star.svg" alt={t("advertiser.addToClosedGroup")} width={16} height={24} />
              <span className="text-base text-grayscale-600">{t("advertiser.addToClosedGroup")}</span>
            </DropdownMenuItem>
            )
          )}
          <DropdownMenuItem
            data-testid="advertiser-btn-unfollow"
            onClick={handleUnfollow}
            className="flex items-center gap-2 py-3 px-4 cursor-pointer"
          >
            <Image src="/icons/unfollow.svg" alt={t("advertiser.unfollow")} width={20} height={24} />
            <span className="text-base text-grayscale-600">{t("advertiser.unfollow")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <Button variant="secondary" size="sm" disabled={isLoading} onClick={() => setIsOpen(true)}>
        <span className="flex items-center gap-2">
          {t("advertiser.following")}
          <Image
            src="/icons/chevron-down.svg"
            alt=""
            width={14}
            height={22}
            className={cn("transition-transform duration-200", isOpen && "rotate-180")}
          />
        </span>
      </Button>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent side="bottom" className="h-auto p-6 rounded-t-2xl">
          <DrawerHeader>
            <DrawerTitle className="font-bold text-xl">{nickname}</DrawerTitle>
          </DrawerHeader>
          <div>
            {isClosedGroupEnabled && (
              isGroupMember ? (<Button
                data-testid="advertiser-btn-remove-closed-group"
                onClick={handleRemoveFromClosedGroup}
                className="w-full gap-3 py-3 text-left font-normal flex justify-start px-0"
                variant="ghost"
              >
                <Image src="/icons/star.svg" alt={t("advertiser.removeFromClosedGroup")} width={16} height={24} />
                <span className="text-base text-grayscale-600">{t("advertiser.removeFromClosedGroup")}</span>
              </Button>) : (<Button
                data-testid="advertiser-btn-add-closed-group"
                onClick={handleAddToClosedGroup}
                className="w-full gap-3 py-3 text-left font-normal flex justify-start px-0"
                variant="ghost"
              >
                <Image src="/icons/star.svg" alt={t("advertiser.addToClosedGroup")} width={16} height={24} />
                <span className="text-base text-grayscale-600">{t("advertiser.addToClosedGroup")}</span>
              </Button>)
            )}
            <Button
              data-testid="advertiser-btn-unfollow"
              onClick={handleUnfollow}
              className="w-full gap-3 py-3 text-left font-normal flex justify-start px-0"
              variant="ghost"
            >
              <Image src="/icons/unfollow.svg" alt={t("advertiser.unfollow")} width={16} height={24} />
              <span className="text-base text-grayscale-600">{t("advertiser.unfollow")}</span>
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
