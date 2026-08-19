"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import MyAdsTable from "./components/my-ads-table"
import { queryKeys, useUserAdverts, useHideMyAds } from "@/hooks/use-api-queries"
import { useQueryClient } from "@tanstack/react-query"
import Image from "next/image"
import type { MyAd } from "./types"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { HeaderSegmentedControl } from "@/components/header-segmented-control"
import StatusBottomSheet from "./components/ui/status-bottom-sheet"
import { useAdvertAlertDialog } from "@/app/ads/hooks/use-advert-alert-dialog"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { useUserDataStore } from "@/stores/user-data-store"
import { useTranslations } from "@/lib/i18n/use-translations"
import { TemporaryBanAlert } from "@/components/temporary-ban-alert"
import { createKycOnboardingAlertConfig } from "@/components/kyc-onboarding-sheet"
import { useGuideStore } from "@/stores/guide-store"
import { isP2PVerified } from "@/lib/is-p2p-verified"
import { useTrackers } from "@/analytics/useTrackers"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import { MY_ADS_TAB_QUERY, parseMyAdsTab, type MyAdsTab } from "@/lib/ads/my-ads-tab"

interface StatusData {
  success: "create" | "update"
  type: string
  id: string
  showStatusModal: boolean
}

export default function AdsPage() {
  const { t } = useTranslations()
  const { track } = useTrackers()
  const queryClient = useQueryClient()
  const [showDeletedBanner, setShowDeletedBanner] = useState(false)
  const [statusData, setStatusData] = useState<StatusData | null>(null)
  const [activeTab, setActiveTab] = useState<MyAdsTab>("active")
  const { userData, userId, onboardingStatus, verificationStatus } = useUserDataStore()
  const openIntro = useGuideStore((state) => state.openIntro)
  const isVerified = isP2PVerified({ verificationStatus, onboardingStatus })
  const tempBanUntil = userData?.temp_ban_until
  const { isActive: isMaintenanceActive } = useP2PSystemMaintenance()
  const [hiddenAdverts, setHiddenAdverts] = useState(false)
  const [isHideAdsInfoOpen, setIsHideAdsInfoOpen] = useState(false)
  const [errorModal, setErrorModal] = useState({
    show: false,
    title: "",
    message: "",
  })
  const { hideAlert, showAlert } = useAdvertAlertDialog()
  const [showKycPopup, setShowKycPopup] = useState(false)
  const errorAlertShownRef = useRef(false)

  const isMobile = useIsMobile()
  const router = useRouter()
  const searchParams = useSearchParams()

  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Use the React Query hook
  const isActiveTab = activeTab === "active"
  const { data, isLoading: loading, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage, error: queryError, refetch } = useUserAdverts(isActiveTab, !!userId)
  const userAdverts = useMemo(() => data?.pages.flat() ?? [], [data?.pages])

  // Infinite scroll: fetch next page when sentinel comes into view
  useEffect(() => {
    const sentinel = sentinelRef.current
    const scrollContainer = scrollContainerRef.current
    if (!sentinel || !hasNextPage || !scrollContainer) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0, rootMargin: "100px", root: scrollContainer },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    const shouldShowKyc = searchParams.get("show_kyc_popup") === "true"
    if (shouldShowKyc) {
      setShowKycPopup(true)
    }

    const tabFromUrl = parseMyAdsTab(searchParams.get(MY_ADS_TAB_QUERY))
    if (tabFromUrl) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    if (showKycPopup) {
      showAlert(createKycOnboardingAlertConfig({
        route: "ads",
        onClose: () => {
          hideAlert()
          setShowKycPopup(false)
        },
        onConfirm: () => setShowKycPopup(false),
        onCancel: () => setShowKycPopup(false),
      }))
    }
  }, [showKycPopup, showAlert, hideAlert])

  const handleCreateAd = () => {
    if (isMaintenanceActive) return
    track("ek_create_ad_my_ads")
    // One overlay only. Verified without a P2P profile yet → guide intro.
    // Incomplete KYC → KYC sheet. Existing P2P user → create form.
    if (isVerified) {
      if (userId) {
        router.push("/ads/create")
        return
      }
      openIntro()
      return
    }
    setShowKycPopup(true)
  }

  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue as MyAdsTab)
  }

  const refetchCurrentTab = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.ads.allUserAdverts() })
    await refetch()
  }, [queryClient, refetch])

  useEffect(() => {
    if (queryError) {
      setErrorModal({
        show: true,
        title: t("myAds.errorLoadingAdsTitle"),
        message: queryError instanceof Error ? queryError.message : t("myAds.errorLoadingAdsMessage"),
      })
    }
  }, [queryError, t])

  useEffect(() => {
    if (userData?.adverts_are_listed !== undefined) {
      setHiddenAdverts(!userData.adverts_are_listed)
    }
  }, [userData?.adverts_are_listed])

  useEffect(() => {
    const success = searchParams.get("success")
    const type = searchParams.get("type")
    const id = searchParams.get("id")
    const showStatusModal = searchParams.get("showStatusModal")

    if (!success || !type || !id || showStatusModal !== "true") {
      return
    }

    if ((success === "create" || success === "update") && !isMobile) {
      const adTypeDisplay = type.toUpperCase()
      const createDescription = t("myAds.adCreatedMessage", { type: adTypeDisplay, id })
      const updateDescription = t("myAds.adUpdatedMessage", { type: adTypeDisplay, id })

      showAlert({
        title: success === "create" ? t("myAds.adCreated") : t("myAds.adUpdated"),
        description: success === "create" ? createDescription : updateDescription,
        confirmText: t("common.ok"),
        type: "success",
      })
    }

    if (success === "create" || success === "update") {
      setStatusData({
        success,
        type,
        id,
        showStatusModal: true,
      })

      queryClient.invalidateQueries({ queryKey: queryKeys.ads.allUserAdverts() })
      refetch()
    }
  }, [searchParams, showAlert, isMobile, t, refetch, queryClient])

  const handleAdUpdated = (status?: string) => {
    if (status === "deleted") {
      setShowDeletedBanner(true)
      setTimeout(() => setShowDeletedBanner(false), 3000)
    }
  }

  const handleCloseStatusModal = () => {
    setStatusData((prev) => (prev ? { ...prev, showStatusModal: false } : null))
  }

  const handleCloseErrorModal = useCallback(() => {
    setErrorModal((prev) => ({ ...prev, show: false }))
  }, [])

  useEffect(() => {
    if (errorModal.show && !errorAlertShownRef.current) {
      errorAlertShownRef.current = true
      showAlert({
        title: errorModal.title,
        description: errorModal.message,
        confirmText: t("common.ok"),
        onConfirm: () => {
          handleCloseErrorModal()
          errorAlertShownRef.current = false
        },
        type: "warning",
      })
    } else if (!errorModal.show) {
      errorAlertShownRef.current = false
    }
  }, [errorModal.show, errorModal.title, errorModal.message, showAlert, t, handleCloseErrorModal])

  useEffect(() => {
    track("ek_open_my_ads")
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const hideMyAdsMutation = useHideMyAds()

  const handleHideMyAds = async (value: boolean) => {
    track("ek_toggle_hide_my_ads_my_ads")
    const previousValue = hiddenAdverts
    setHiddenAdverts(value)

    try {
      await hideMyAdsMutation.mutateAsync(value)
      // Update the user store with the new value after successful API call
      useUserDataStore.getState().updateUserData({ adverts_are_listed: !value })
      await refetchCurrentTab()
    } catch (error) {
      console.error("Failed to hide/show ads:", error)
      setHiddenAdverts(previousValue)

      showAlert({
        title: value ? t("myAds.unableToHideAds") : t("myAds.unableToShowAds"),
        description: value ? t("myAds.hideAdsError") : t("myAds.showAdsError"),
        confirmText: t("common.ok"),
        type: "warning",
      })
    }
  }

  const getHideMyAdsComponent = () => {
    const hasAds = userAdverts.length > 0

    // Only render if there are ads
    if (!hasAds) {
      return null
    }

    return (
      <div className="flex items-center justify-self-end self-end flex-shrink-0">
        <Switch
          id="hide-ads"
          checked={hiddenAdverts}
          onCheckedChange={handleHideMyAds}
          className="data-[state=checked]:bg-completed-icon"
          disabled={!!tempBanUntil}
          data-testid="ads-switch-hide-ads"
        />
        <label htmlFor="hide-ads" className="text-sm text-grayscale-600 cursor-pointer ms-2 whitespace-nowrap">
          {t("myAds.hideMyAds")}
        </label>
        {isMobile ? (
          <Button
            type="button"
            variant="icon-muted"
            size="sm"
            data-testid="ads-btn-hide-ads-info"
            className="!bg-transparent hover:!bg-transparent"
            onClick={() => setIsHideAdsInfoOpen(true)}
          >
            <Image
              src="/icons/info-circle.svg"
              alt={t("common.info")}
              width={20}
              height={20}
            />
          </Button>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="icon-muted" size="sm" data-testid="ads-btn-hide-ads-info" className="!bg-transparent hover:!bg-transparent">
                  <Image
                    src="/icons/info-circle.svg"
                    alt={t("common.info")}
                    width={20}
                    height={20}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-white">{t("myAds.hideMyAdsTooltip")}</p>
                <TooltipArrow className="fill-black" />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col h-full min-h-0 md:h-screen overflow-hidden bg-white px-3">
        <div className="flex-none container mx-auto">
          <div className="relative z-10 w-[calc(100%+24px)] md:w-full min-h-[80px] flex min-w-0 flex-wrap items-center justify-start gap-4 bg-slate-1200 px-6 pb-6 pt-8 md:p-6 rounded-b-3xl md:rounded-3xl text-white -mx-3 mb-4 md:mx-0 md:mt-0">
            <HeaderSegmentedControl
              value={activeTab}
              onValueChange={handleTabChange}
              width={184}
              className="shrink-0"
              segments={[
                { value: "active", label: t("myAds.tabActive"), testId: "ads-tab-active" },
                { value: "inactive", label: t("myAds.tabInactive"), testId: "ads-tab-inactive" },
              ]}
            />
          </div>
          {tempBanUntil && !isMaintenanceActive && (
            <div data-testid="ads-alert-temp-ban">
              <TemporaryBanAlert tempBanUntil={tempBanUntil} />
            </div>
          )}
          {isActiveTab && (
            <div className="flex flex-wrap items-center justify-between gap-3 my-6">
              {!isMaintenanceActive && userAdverts.length > 0 && (
                <Button
                  onClick={handleCreateAd}
                  size="sm"
                  className="font-bold text-base leading-4 tracking-[0%] text-center whitespace-nowrap"
                  disabled={!!tempBanUntil}
                  data-testid="ads-btn-create"
                >
                  <span className="flex items-center gap-1.5">
                    <Image src="/icons/plus-white.png" alt="" height={16} width={10} />
                    {t("myAds.createAd")}
                  </span>
                </Button>
              )}
              {getHideMyAdsComponent()}
            </div>
          )}
        </div>

        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-none scrollbar-hide container mx-auto p-0 md:p-0" data-testid="ads-table-container">
          {queryError ? (
            <div className="text-center py-8 text-error">{t("myAds.errorLoadingAds")}</div>
          ) : (
            <MyAdsTable
              ads={isMaintenanceActive ? [] : userAdverts}
              onAdDeleted={handleAdUpdated}
              onAdsChanged={refetchCurrentTab}
              hiddenAdverts={hiddenAdverts}
              isActiveTab={isActiveTab}
              isLoading={isMaintenanceActive ? false : loading}
              isFetching={isMaintenanceActive ? false : isFetching}
            />
          )}
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Spinner size="md" />
            </div>
          )}
          <div ref={sentinelRef} className="h-1" data-testid="ads-sentinel-load-more" />
        </div>

        {statusData && statusData.showStatusModal && !loading && !errorModal.show && isMobile && (
          <div data-testid="ads-modal-create-success">
          <StatusBottomSheet
            isOpen
            onClose={handleCloseStatusModal}
            type="success"
            title={statusData.success === "create" ? t("myAds.adCreated") : t("myAds.adUpdated")}
            message={
              statusData.success === "create"
                ? t("myAds.adCreatedMessage", { type: statusData.type.toUpperCase(), id: statusData.id })
                : t("myAds.adUpdatedMessage", { type: statusData.type.toUpperCase(), id: statusData.id })
            }
            adType={statusData.type}
            adId={statusData.id}
            isUpdate={statusData.success === "update"}
          />
          </div>
        )}
      </div>

      <Drawer open={isHideAdsInfoOpen} onOpenChange={setIsHideAdsInfoOpen}>
        <DrawerContent className="rounded-t-2xl">
          <DrawerHeader className="px-4 pb-2 pt-3 text-start">
            <div className="text-xl font-extrabold text-slate-1200">{t("myAds.hideMyAds")}</div>
            {/* Visually hidden title for a11y */}
            <DrawerTitle className="sr-only">{t("myAds.hideMyAds")}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 text-start">
            <p className="text-base text-grayscale-600 whitespace-pre-line">
              {t("myAds.hideMyAdsTooltip")}
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
