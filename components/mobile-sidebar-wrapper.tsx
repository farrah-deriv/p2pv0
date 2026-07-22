"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/i18n/use-translations"
import ProfileIconWhite from "@/public/icons/profile-icon-white.svg"
import ArrowBackIcon from "@/public/icons/arrow-back.svg"

export function MobileSidebarTrigger({ "data-testid": testId }: { "data-testid"?: string } = {}) {
  const { t } = useTranslations()
  const pathname = usePathname()
  const router = useRouter()
  const isProfilePage = pathname === "/profile" || pathname.startsWith("/profile/")

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push("/market")
    }
  }

  if (isProfilePage) {
    return (
      <Button
        onClick={handleBack}
        variant="ghost"
        size="icon"
        aria-label={t("common.back")}
        className="h-8 w-8 rounded-full bg-header-icon hover:bg-header-icon [&_svg]:size-6"
        data-testid={testId}
      >
        <ArrowBackIcon width={24} height={24} aria-hidden="true" />
      </Button>
    )
  }

  return (
    <Link
      href="/profile"
      aria-label={t("common.profile")}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-header-icon hover:bg-header-icon"
      data-testid={testId}
    >
      <ProfileIconWhite width={24} height={24} aria-hidden="true" />
    </Link>
  )
}
