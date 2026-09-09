"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { useTranslations } from "@/lib/i18n/use-translations"
import { createEmailRequiredAlertConfig } from "@/lib/create-email-required-alert-config"
import { isEmailEligibleForP2P, isExistingP2PUser } from "@/lib/email-eligibility"
import { refreshClientProfileEmailEligibility } from "@/lib/refresh-client-profile-email-eligibility"
import { getHomeUrl } from "@/lib/utils"
import { useUserDataStore, type EmailEligibility } from "@/stores/user-data-store"
import { Spinner } from "@/components/ui/spinner"

interface EmailGatedPageProps {
  children: ReactNode
  fallbackRoute?: string
}

function isEmailGateOpen(eligibility: EmailEligibility): boolean {
  return isEmailEligibleForP2P(eligibility) || eligibility === "error"
}

/** Blocks write-only routes until the user has an email on their client profile. */
export function EmailGatedPage({ children, fallbackRoute = "/ads" }: EmailGatedPageProps) {
  const { t } = useTranslations()
  const router = useRouter()
  const { showAlert, hideAlert } = useAlertDialog()
  const userId = useUserDataStore((state) => state.userId)
  const emailEligibility = useUserDataStore((state) => state.emailEligibility)
  const [isAllowed, setIsAllowed] = useState<boolean | null>(() => {
    if (!isExistingP2PUser(userId)) return true
    return isEmailGateOpen(emailEligibility) ? true : null
  })
  const hasPromptedRef = useRef(false)

  useEffect(() => {
    if (!isExistingP2PUser(userId)) {
      setIsAllowed(true)
      return
    }

    let isMounted = true

    void (async () => {
      if (emailEligibility === "loading") return

      const eligibility =
        emailEligibility === "unknown"
          ? await refreshClientProfileEmailEligibility()
          : emailEligibility

      if (!isMounted) return

      if (isEmailGateOpen(eligibility)) {
        setIsAllowed(true)
        return
      }

      setIsAllowed(false)

      if (!hasPromptedRef.current) {
        hasPromptedRef.current = true
        showAlert(
          createEmailRequiredAlertConfig(t, {
            onAddEmail: () => {
              hideAlert()
              window.location.assign(getHomeUrl("emailAddress"))
            },
            onDismiss: () => {
              hideAlert()
              router.replace(fallbackRoute)
            },
          }),
        )
      }
    })()

    return () => {
      isMounted = false
    }
  }, [emailEligibility, fallbackRoute, hideAlert, router, showAlert, t, userId])

  if (isAllowed === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isAllowed !== true) return null

  return <>{children}</>
}
