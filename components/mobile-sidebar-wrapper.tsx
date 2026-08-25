"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/i18n/use-translations"
import { canGoBackWithinApp } from "@/lib/navigation/back-navigation"
import { StandaloneArrowLeftFillIcon } from "@deriv/quill-icons/Standalone"
import ProfileIconWhite from "@/public/icons/profile-icon-white.svg"

export function MobileSidebarTrigger({ "data-testid": testId }: { "data-testid"?: string } = {}) {
  const { t } = useTranslations()
  const pathname = usePathname()
  const router = useRouter()
  const isProfilePage = pathname === "/profile" || pathname.startsWith("/profile/")

  const handleBack = () => {
    // Not `window.history.length > 1`: a tab opened directly on /profile reports extra
    // entries that belong to the browser, so going back left the SPA entirely.
    if (canGoBackWithinApp()) {
      router.back()
    } else {
      router.push("/")
    }
  }

  if (isProfilePage) {
    return (
      <Button
        onClick={handleBack}
        variant="icon-muted"
        aria-label={t("common.back")}
        className="!bg-header-icon hover:!bg-header-icon"
        data-testid={testId}
      >
        <StandaloneArrowLeftFillIcon width={24} height={24} fill="white" className="rtl:rotate-180" aria-hidden />
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
