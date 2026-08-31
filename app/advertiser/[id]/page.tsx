"use client"

export const runtime = "edge"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { StandaloneArrowLeftFillIcon, StandaloneChevronDownRegularIcon } from "@deriv/quill-icons/Standalone"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { Spinner } from "@/components/ui/spinner"
import { useUserDataStore } from "@/stores/user-data-store"
import { BuySellAPI } from "@/services/api"
import type { Advertisement } from "@/services/api/api-buy-sell"
import { toggleFavouriteAdvertiser, toggleBlockAdvertiser } from "@/services/api/api-buy-sell"
import { addToClosedGroup, removeFromClosedGroup } from "@/services/api/api-profile"
import { formatPaymentMethodName, IS_CLOSED_GROUP_ENABLED } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import OrderSidebar from "@/components/buy-sell/order-sidebar"
import RiskWarningModal from "@/components/buy-sell/risk-warning/risk-warning-modal"
import { evaluateRisk, type RiskWarningResult } from "@/components/buy-sell/risk-warning/risk-warning-rules"
import EmptyState from "@/components/empty-state"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import AdvertiserStats from "@/app/advertiser/components/advertiser-stats"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { VerifiedBadge } from "@/components/verified-badge"
import { TradeBandBadge } from "@/components/trade-band-badge"
import { ClosedGroupBadge } from "@/components/closed-group-badge"
import { useTranslations } from "@/lib/i18n/use-translations"
import { canGoBackWithinApp } from "@/lib/navigation/back-navigation"
import { AdvertiserSkeleton } from "@/app/advertiser/components/advertiser-skeleton"
import { useAdvertiserAds, queryKeys } from "@/hooks/use-api-queries"
import { useQueryClient } from "@tanstack/react-query"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { PresenceLastSeen } from "@/components/presence-last-seen"
import { ExchangeRateDisplay } from "@/components/exchange-rate-display"
import { TOAST_SUCCESS_CLASS } from "@/lib/toast-utils"

interface UsersOnlineUpdate {
  user_id: number
  is_online: boolean
  /** Server-provided epoch ms timestamp; only present on offline transitions. */
  last_online_at?: number | null
}

interface AdvertiserStatisticsLifetime {
  recommend_count: number
  rating_count: number
  rating_average: number
}

interface AdvertiserProfile {
  id: string | number
  nickname: string
  brand: string
  country_code: string
  created_at: number
  adverts_are_listed: boolean
  blocked_by_user_count: number
  favourited_by_user_count: number
  is_blocked: boolean
  is_favourite: boolean
  is_group_member?: boolean
  is_online?: boolean
  last_online_at?: number | null
  temp_ban_until: number | null
  trade_band: string
  order_count_lifetime: number
  order_amount_lifetime: string
  partner_count_lifetime: number
  rating_average_lifetime: number
  recommend_average_lifetime: number
  recommend_count_lifetime: number
  buy_amount_30day: string
  buy_count_30day: number
  buy_time_average_30day: number
  sell_amount_30day: string
  sell_count_30day: number
  release_time_average_30day: number
  rating_average_30day: number
  completion_average_30day: number
  statistics_lifetime?: AdvertiserStatisticsLifetime
}

interface AdvertiserProfilePageProps {
  onBack?: () => void
}

export default function AdvertiserProfilePage({ onBack }: AdvertiserProfilePageProps) {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const searchParams = useSearchParams()
  const adIdParam = searchParams.get("adId")
  const returnTo = searchParams.get("return_to")
  const tabParam = searchParams.get("tab")
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const { showAlert } = useAlertDialog()
  const userId = useUserDataStore((state) => state.userId)
  const { userData } = useUserDataStore()
  const isClosedGroupEnabled = IS_CLOSED_GROUP_ENABLED && userData?.trade_band === "diamond"
  const tempBanUntil = userData?.temp_ban_until
  const p2pBalance = Number.parseFloat(userData?.balances?.amount ?? "0")
  const [profile, setProfile] = useState<AdvertiserProfile | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isGroupMember, setIsGroupMember] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [isBlockLoading, setIsBlockLoading] = useState(false)
  const [isClosedGroupLoading, setIsClosedGroupLoading] = useState(false)
  const [isOrderSidebarOpen, setIsOrderSidebarOpen] = useState(false)
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null)
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy")
  const [pendingRiskAd, setPendingRiskAd] = useState<Advertisement | null>(null)
  const [pendingRiskOrderType, setPendingRiskOrderType] = useState<"buy" | "sell">("buy")
  const [riskResult, setRiskResult] = useState<RiskWarningResult | null>(null)
  const [isRiskWarningOpen, setIsRiskWarningOpen] = useState(false)
  const { t } = useTranslations()
  const queryClient = useQueryClient()

  const { isConnected, subscribe, joinUsersOnlineChannel, leaveUsersOnlineChannel } = useWebSocketContext()

  const currentIdRef = useRef(id)
  useEffect(() => { currentIdRef.current = id }, [id])

  const abortControllerRef = useRef<AbortController | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const {
    data: advertsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdvertiserAds(id)

  const adverts = useMemo(() => advertsData?.pages.flat() ?? [], [advertsData])

  const fetchAdvertiserData = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsLoading(true)
    setError(null)

    try {
      const advertiserData = await BuySellAPI.getAdvertiserById(id)

      if (abortController.signal.aborted) {
        return
      }

      setProfile(advertiserData.data)
      setIsFollowing(advertiserData.data.is_favourite || false)
      setIsBlocked(advertiserData.data.is_blocked || false)
      setIsGroupMember(advertiserData.data.is_group_member || false)
    } catch (err) {
      if (!abortController.signal.aborted) {
        setError(t("advertiser.failedToLoad"))
        setProfile(null)
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    if (id) {
      fetchAdvertiserData()
    } else {
      router.push("/")
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [id])

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
      { threshold: 0, rootMargin: "0px", root: scrollContainer },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleUsersOnlineUpdate = useCallback((data: unknown) => {
    if (!data || typeof data !== "object") return
    const channel = (data as Record<string, any>)?.options?.channel
    if (channel !== "users_online") return

    const payload = (data as Record<string, any>)?.payload?.data
    if (!payload || typeof payload.user_id !== "number" || typeof payload.is_online !== "boolean") return

    const update: UsersOnlineUpdate = payload

    if (String(update.user_id) !== String(currentIdRef.current)) return

    setProfile((prev) => {
      if (!prev) return prev
      // Prefer server-provided timestamp; fall back to Date.now() only as a
      // last resort so the UI immediately reflects the offline state.
      const lastOnlineAt = update.is_online
        ? prev.last_online_at
        : (update.last_online_at ?? Date.now())
      return { ...prev, is_online: update.is_online, last_online_at: lastOnlineAt }
    })
  }, [])

  useEffect(() => {
    if (!isConnected) return

    joinUsersOnlineChannel()
    const unsubscribe = subscribe(handleUsersOnlineUpdate)

    return () => {
      unsubscribe()
      leaveUsersOnlineChannel()
    }
  }, [isConnected, handleUsersOnlineUpdate, joinUsersOnlineChannel, leaveUsersOnlineChannel])

  useEffect(() => {
    if (adIdParam && adverts.length > 0 && !isBlocked) {
      const ad = adverts.find((a) => a.id == adIdParam)
      if (ad) {
        handleOrderClick(ad, ad.type === "buy" ? "buy" : "sell")
      } else {
        showAlert({
          title: t("order.adNotAvailableTitle"),
          description: t("order.adNotAvailableMessage"),
          confirmText: t("common.gotIt"),
          type: "warning",
        })
      }
    }
  }, [adIdParam, adverts, isBlocked])

  const toggleFollow = async () => {
    if (!profile) return

    setIsFollowLoading(true)
    try {
      const result = await toggleFavouriteAdvertiser(profile.id, !isFollowing)

      if (result.success) {
        if (isFollowing) {
          setIsGroupMember(false)
        }
        setIsFollowing(!isFollowing)
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.followers() })
        queryClient.invalidateQueries({ queryKey: queryKeys.buySell.favouriteUsers() })
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.tradePartners() })
        toast({
          description: (
            <div className="flex items-center gap-2">
              <Image src="/icons/tick.svg" alt={t("common.success")} width={24} height={24} className="text-white" />
              {isFollowing ? (
                <span>{t("advertiser.successfullyUnfollowed")}</span>
              ) : (
                <span>{t("advertiser.successfullyFollowed")}</span>
              )}
            </div>
          ),
          className: TOAST_SUCCESS_CLASS,
          duration: 2500,
        })
      } else if (result.code === "UserFavouriteNotFound") {
        // The favourite no longer exists server-side (e.g. it was removed when the
        // advertiser was blocked), so reconcile the UI and let the user know.
        setIsFollowing(false)
        setIsGroupMember(false)
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.followers() })
        queryClient.invalidateQueries({ queryKey: queryKeys.buySell.favouriteUsers() })
        showAlert({
          title: t("advertiser.notInFavouritesTitle"),
          description: t("advertiser.notInFavouritesMessage"),
          confirmText: t("common.gotIt"),
          type: "warning",
        })
      } else {
        console.error("Failed to toggle follow status:", result.message)
      }
    } catch (error) {
      console.error("Error toggling follow status:", error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleAddToClosedGroup = async () => {
    if (!profile) return

    setIsClosedGroupLoading(true)
    try {
      const result = await addToClosedGroup(profile.id)

      if (result.success) {
        setIsGroupMember(true)
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.tradePartners() })
        queryClient.invalidateQueries({ queryKey: queryKeys.buySell.favouriteUsers(true) })
        toast({
          description: (
            <div className="flex items-center gap-2">
              <Image src="/icons/tick.svg" alt={t("common.success")} width={24} height={24} className="text-white" />
              <span>{t("advertiser.addedToClosedGroup")}</span>
            </div>
          ),
          className: TOAST_SUCCESS_CLASS,
          duration: 2500,
        })
      } else {
        const code = result.errors?.[0]?.code
        if (code === "UserGroupMemberBlockedBy") {
          showAlert({
            title: t("advertiser.memberUnavailableTitle"),
            description: t("advertiser.closedGroupBlockedByAddMessage"),
            confirmText: t("advertiser.chooseAnotherTrader"),
            cancelText: t("common.close"),
            type: "warning",
            onConfirm: () => {},
            onCancel: () => {},
          })
        } else {
          console.error("Failed to add to closed group:", result.errors)
        }
      }
    } catch (error) {
      console.error("Failed to add to closed group:", error)
    } finally {
      setIsClosedGroupLoading(false)
    }
  }

  const handleRemoveFromClosedGroup = async () => {
    if (!profile) return

    setIsClosedGroupLoading(true)
    try {
      const result = await removeFromClosedGroup(profile.id)

      if (result.success) {
        setIsGroupMember(false)
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.tradePartners() })
        queryClient.invalidateQueries({ queryKey: queryKeys.buySell.favouriteUsers(true) })
        toast({
          description: (
            <div className="flex items-center gap-2">
              <Image src="/icons/tick.svg" alt={t("common.success")} width={24} height={24} className="text-white" />
              <span>{t("advertiser.removedFromClosedGroup")}</span>
            </div>
          ),
          className: TOAST_SUCCESS_CLASS,
          duration: 2500,
        })
      } else {
        const code = result.errors?.[0]?.code
        if (code === "UserGroupMemberBlockedBy") {
          showAlert({
            title: t("advertiser.memberUnavailableTitle"),
            description: t("advertiser.closedGroupBlockedByRemoveMessage"),
            confirmText: t("advertiser.chooseAnotherTrader"),
            cancelText: t("common.close"),
            type: "warning",
            onConfirm: () => {},
            onCancel: () => {},
          })
        } else {
          console.error("Failed to remove from closed group:", result.errors)
        }
      }
    } catch (error) {
      console.error("Failed to remove from closed group:", error)
    } finally {
      setIsClosedGroupLoading(false)
    }
  }

  const handleBlockClick = () => {
    if (!isBlocked) {
      showAlert({
        title: t("advertiser.blockUser", { nickname: profile?.nickname }),
        description: t("advertiser.blockDescription", { nickname: profile?.nickname }),
        confirmText: t("advertiser.block"),
        cancelText: t("common.cancel"),
        type: "warning",
        onConfirm: async () => {
          if (!profile) return

          setIsBlockLoading(true)
          try {
            const result = await toggleBlockAdvertiser(profile.id, true)

            if (result.success) {
              setIsBlocked(true)
              // Blocking a followed advertiser unfollows them server-side, so mirror
              // that here to avoid a stale "Following" state that would later trigger
              // an UserFavouriteNotFound error when trying to unfollow.
              setIsFollowing(false)
              setIsGroupMember(false)
              queryClient.invalidateQueries({ queryKey: queryKeys.auth.tradePartners() })
              queryClient.invalidateQueries({ queryKey: queryKeys.auth.blockedUsers() })
              queryClient.invalidateQueries({ queryKey: queryKeys.auth.followers() })
              queryClient.invalidateQueries({ queryKey: queryKeys.buySell.favouriteUsers() })

              toast({
                description: (
                  <div className="flex items-center gap-2">
                    <Image src="/icons/tick.svg" alt={t("common.success")} width={24} height={24} className="text-white" />
                    <span>{t("advertiser.userBlocked", { nickname: profile?.nickname })}</span>
                  </div>
                ),
                className: TOAST_SUCCESS_CLASS,
                duration: 2500,
              })
            } else {
              console.error("Failed to toggle block status:", result.message)
            }
          } catch (error) {
            console.error("Error toggling block status:", error)
          } finally {
            setIsBlockLoading(false)
          }
        },
      })
    } else {
      handleUnblock()
    }
  }

  const handleUnblock = async () => {
    if (!profile) return

    setIsBlockLoading(true)
    try {
      const result = await toggleBlockAdvertiser(profile.id, false)

      if (result.success) {
        setIsBlocked(false)
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.tradePartners() })
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.blockedUsers() })

        toast({
          description: (
            <div className="flex items-center gap-2">
              <Image src="/icons/tick.svg" alt={t("common.success")} width={24} height={24} className="text-white" />
              <span>{t("advertiser.userUnblocked", { nickname: profile?.nickname })}</span>
            </div>
          ),
          className: TOAST_SUCCESS_CLASS,
          duration: 2500,
        })
      } else {
        console.error("Failed to toggle block status:", result.message)
      }
    } catch (error) {
      console.error("Error toggling block status:", error)
    } finally {
      setIsBlockLoading(false)
    }
  }

  const handleOrderClick = (ad: Advertisement, type: "buy" | "sell") => {
    const risk = evaluateRisk(ad)
    if (risk) {
      setPendingRiskAd(ad)
      setPendingRiskOrderType(type)
      setRiskResult(risk)
      setIsRiskWarningOpen(true)
      return
    }
    setSelectedAd(ad)
    setOrderType(type)
    setIsOrderSidebarOpen(true)
  }

  const handleRiskContinue = () => {
    if (pendingRiskAd) {
      setSelectedAd(pendingRiskAd)
      setOrderType(pendingRiskOrderType)
      setIsOrderSidebarOpen(true)
    }
    setIsRiskWarningOpen(false)
    setPendingRiskAd(null)
    setRiskResult(null)
  }

  const handleRiskClose = () => {
    setIsRiskWarningOpen(false)
    setPendingRiskAd(null)
    setRiskResult(null)
  }

  const getJoinedDate = (timestamp: number) => {
    const joinDate = new Date(timestamp)
    const formattedDate = joinDate.toLocaleDateString("en-GB")
    return t("advertiser.joinedOn", { date: formattedDate })
  }

  const handleBack = () => {
    if (returnTo === "profile" && tabParam) {
      router.replace(`/profile?tab=${tabParam}`)
    } else if (isMobile && canGoBackWithinApp()) {
      // Shared advert links land here as the first entry in the tab, where going back
      // would leave the SPA. Fall through to the market instead, as desktop already does.
      router.back()
    } else {
      router.push("/")
    }
  }

  if (isLoading) {
    return <AdvertiserSkeleton />
  }

  if (error && !profile) {
    return (
      <div data-testid="advertiser-error-load" className="container mx-auto px-4 py-8 pt-20">
        <div className="text-center py-8">
          <p>{error}</p>
          <Button onClick={handleBack} className="mt-4 text-white">
            {t("advertiser.goBack")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 z-20 bg-slate-75 px-6 py-4 md:hidden">
        <div className="container mx-auto">
          <Button data-testid="advertiser-btn-back" variant="icon-muted" onClick={handleBack} className="!bg-black/[0.04] hover:!bg-black/[0.08]" aria-label={t("common.back")}>
            <StandaloneArrowLeftFillIcon width={24} height={24} className="rtl:rotate-180" aria-hidden />
          </Button>
        </div>
      </div>
      <div className="p-6 pt-0 md:px-2 md:py-0">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="container mx-auto pb-6">
            <div className="bg-slate-75 p-6 rounded-none md:rounded-3xl flex flex-col md:items-start gap-4 mx-[-24px] mt-[-24px] md:mx-0 md:mt-0">
              <span className="hidden md:block">
                <Button data-testid="advertiser-btn-back-desktop" variant="icon-muted" onClick={handleBack} className="!bg-black/[0.04] hover:!bg-black/[0.08]" aria-label={t("common.back")}>
                  <StandaloneArrowLeftFillIcon width={24} height={24} className="rtl:rotate-180" aria-hidden />
                </Button>
              </span>
              <div className="flex-1 w-full">
                <div className="flex flex-col md:flex-row gap-2 md:gap-0">
                  <div className="relative me-[16px]">
                    <div className="relative h-[56px] w-[56px] bg-grayscale-500 rounded-full flex items-center justify-center">
                      <Image src="/icons/user-icon-black.png" alt={t("common.user")} width={32} height={32} />
                      <div
                        data-testid="advertiser-badge-online-status"
                        className={`absolute bottom-0 right-1 h-3 w-3 rounded-full border-2 border-white ${profile?.is_online ? "bg-buy" : "bg-gray-400"
                          }`}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-2 items-center">
                      <h2 data-testid="advertiser-text-nickname" className="text-lg font-bold">{profile?.nickname}</h2>
                      <span data-testid="advertiser-badge-verified"><VerifiedBadge size={20} /></span>
                      {profile?.trade_band && (
                        <span data-testid="advertiser-badge-trade-band">
                          <TradeBandBadge
                            tradeBand={profile.trade_band}
                            showLearnMore={true}
                            size={20}
                          />
                        </span>
                      )}
                      {IS_CLOSED_GROUP_ENABLED && isGroupMember &&
                        <span data-testid="advertiser-badge-closed-group"><ClosedGroupBadge /></span>
                      }
                    </div>
                    <div className="flex items-center text-xs text-grayscale-600 mt-2">
                      {!profile?.is_online && profile?.last_online_at && (
                        <>
                          <span data-testid="advertiser-text-last-seen">
                            <PresenceLastSeen
                              isOnline={profile.is_online}
                              lastOnlineAt={profile.last_online_at}
                              className="text-xs text-grayscale-600 me-[8px]"
                            />
                          </span>
                          <span className="opacity-[0.08]">|</span>
                        </>
                      )}
                      <span className={!profile?.is_online && profile?.last_online_at ? "ms-[8px]" : ""}>
                        {profile ? getJoinedDate(profile.created_at) : ""}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-grayscale-600 mt-2 gap-2">
                      <div className="flex items-center">
                        <Image src="/icons/thumbs-up.png" alt={t("common.recommended")} width={24} height={24} className="me-1" />
                        <span data-testid="advertiser-text-recommendation" className="me-[8px]">
                          {(profile?.statistics_lifetime?.recommend_count ?? 0) > 0
                            ? t("advertiser.recommendedBy", {
                              count: profile?.statistics_lifetime?.recommend_count ?? 0,
                              plural: profile?.statistics_lifetime?.recommend_count === 1 ? "" : "s",
                            })
                            : t("profile.notRecommendedYet")}
                        </span>
                      </div>
                      <span className="opacity-[0.08]">|</span>
                      <div className="flex items-center">
                        <Image src="/icons/star-rating.png" alt={t("common.star")} width={24} height={24} className="me-1" />
                        <span data-testid="advertiser-text-rating">
                          {(profile?.statistics_lifetime?.rating_count ?? 0) > 0
                            ? profile?.statistics_lifetime?.rating_average
                            : t("profile.notRatedYet")}
                        </span>
                      </div>
                    </div>
                  </div>
                  {userId != profile?.id && (
                    <div className="flex items-center md:mt-0 justify-self-end gap-2">
                      {!isBlocked && (
                        <>
                          {isFollowing && isClosedGroupEnabled ? (
                            isMobile ? (
                              <Drawer>
                                <DrawerTrigger asChild>
                                  <Button
                                    data-testid="advertiser-btn-following-menu"
                                    variant="secondary-outline"
                                    size="sm"
                                    disabled={isFollowLoading || isBlockLoading || isClosedGroupLoading}
                                  >
                                    <span className="flex items-center gap-1.5">
                                      {t("advertiser.following")}
                                      <StandaloneChevronDownRegularIcon iconSize="xs" fill="currentColor" className="shrink-0" />
                                    </span>
                                  </Button>
                                </DrawerTrigger>
                                <DrawerContent className="h-fit">
                                  <div className="p-4 space-y-1">
                                    <button
                                      data-testid="advertiser-btn-unfollow"
                                      onClick={toggleFollow}
                                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-gray-50 active:bg-gray-100"
                                    >
                                      <Image src="/icons/unfollow.svg" alt="" width={20} height={20} />
                                      {t("advertiser.unfollow")}
                                    </button>
                                    <button
                                      data-testid={isGroupMember ? "advertiser-btn-remove-closed-group" : "advertiser-btn-add-closed-group"}
                                      onClick={isGroupMember ? handleRemoveFromClosedGroup : handleAddToClosedGroup}
                                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-gray-50 active:bg-gray-100"
                                    >
                                      <Image src="/icons/star.svg" alt="" width={20} height={20} />
                                      {isGroupMember ? t("advertiser.removeFromClosedGroup") : t("advertiser.addToClosedGroup")}
                                    </button>
                                  </div>
                                </DrawerContent>
                              </Drawer>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    data-testid="advertiser-btn-following-menu"
                                    variant="secondary-outline"
                                    size="sm"
                                    disabled={isFollowLoading || isBlockLoading || isClosedGroupLoading}
                                  >
                                    <span className="flex items-center gap-1.5">
                                      {t("advertiser.following")}
                                      <StandaloneChevronDownRegularIcon iconSize="xs" fill="currentColor" className="shrink-0" />
                                    </span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuItem
                                    data-testid="advertiser-btn-unfollow"
                                    onSelect={toggleFollow}
                                    className="cursor-pointer"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <Image src="/icons/unfollow.svg" alt="" width={16} height={16} />
                                      {t("advertiser.unfollow")}
                                    </span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    data-testid={isGroupMember ? "advertiser-btn-remove-closed-group" : "advertiser-btn-add-closed-group"}
                                    onSelect={isGroupMember ? handleRemoveFromClosedGroup : handleAddToClosedGroup}
                                    className="cursor-pointer"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <Image src="/icons/star.svg" alt="" width={16} height={16} />
                                      {isGroupMember ? t("advertiser.removeFromClosedGroup") : t("advertiser.addToClosedGroup")}
                                    </span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )
                          ) : (
                            <Button
                              data-testid={isFollowing ? "advertiser-btn-unfollow" : "advertiser-btn-follow"}
                              onClick={toggleFollow}
                              variant="secondary-outline"
                              size="sm"
                              disabled={isFollowLoading || isBlockLoading || isClosedGroupLoading}
                            >
                              {isFollowing ? t("advertiser.following") : t("advertiser.follow")}
                            </Button>
                          )}
                        </>
                      )}
                      <Button
                        data-testid={isBlocked ? "advertiser-btn-unblock" : "advertiser-btn-block"}
                        variant="secondary-outline"
                        size="sm"
                        onClick={handleBlockClick}
                        disabled={isBlockLoading || isFollowLoading || isClosedGroupLoading}
                      >
                        {isBlocked ? t("advertiser.unblock") : t("advertiser.block")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {isBlocked && (
              <div className="p-6 my-6 flex flex-col items-center justify-center text-center">
                <h2 className="text-lg font-bold text-neutral-10 mb-2">{t("advertiser.youveBlockedUser")}</h2>
                <p className="text-base text-neutral-7">{t("advertiser.unblockDescription")}</p>
              </div>
            )}

            {!isBlocked && (
              <>
                <AdvertiserStats profile={profile} />
                <div className="container mx-auto pb-4 text-lg font-bold">{t("advertiser.onlineAds")}</div>
                <div className="container mx-auto pb-8">
                  {adverts.length > 0 ? (
                    <>
                      <div ref={scrollContainerRef} className="overflow-auto scrollbar-custom max-h-[calc(100vh-360px)]">
                        <Table>
                          <TableHeader className="hidden lg:table-header-group border-b sticky top-0 bg-white">
                            <TableRow className="text-xs">
                              <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">
                                {t("advertiser.rates")}
                              </TableHead>
                              <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">
                                {t("advertiser.orderLimits")}
                              </TableHead>
                              <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">
                                {t("advertiser.timeLimit")}
                              </TableHead>
                              <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">
                                {t("advertiser.paymentMethods")}
                              </TableHead>
                              <TableHead className="text-right py-4 px-4"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="bg-white lg:divide-y lg:divide-slate-200 font-normal text-sm">
                            {adverts.map((ad) => (
                              <TableRow
                                data-testid={`advertiser-row-ad-${ad.id}`}
                                className="grid grid-col gap-2 border-b mb-[16px] py-4 lg:table-row lg:border-x-[0] lg:border-t-[0] lg:mb-[0] lg:py-0"
                                key={ad.id}
                              >
                                <TableCell className="p-0 lg:py-4 lg:px-4 align-middle text-base whitespace-nowrap row-start-1">
                                  <div className="font-bold">
                                    <span data-testid={`advertiser-text-rate-${ad.id}`}>
                                      <ExchangeRateDisplay
                                        rate={ad.effective_rate_display}
                                        paymentCurrency={ad.payment_currency}
                                        mutedClassName="text-xs font-normal text-black opacity-[0.48]"
                                      />
                                    </span>
                                  </div>
                                  {ad.exchange_rate_type === "floating" && (
                                    <div className="text-xs text-slate-500">0.1%</div>
                                  )}
                                </TableCell>
                                <TableCell className="p-0 lg:py-4 lg:px-4 align-middle whitespace-nowrap row-start-2">
                                  <div data-testid={`advertiser-text-limits-${ad.id}`}>
                                    {isMobile && <span>{t("market.tradeLimitsLabel")} </span>}
                                    {ad.minimum_order_amount} - {ad.actual_maximum_order_amount} {ad.account_currency}
                                  </div>
                                </TableCell>
                                <TableCell className="p-0 lg:py-4 lg:px-4 align-middle whitespace-nowrap row-start-3">
                                  <div className="flex items-center text-xs text-slate-500 bg-gray-100 rounded-sm px-2 py-1 w-fit">
                                    <Image src="/icons/clock.png" alt={t("common.time")} width={12} height={12} className="me-1" />
                                    <span>{ad.order_expiry_period} {t("market.min")}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-0 py-2 lg:py-4 lg:px-4 align-middle whitespace-nowrap row-start-4">
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    {ad.payment_methods?.map((method, index) => (
                                      <div key={index} className="flex items-center">
                                        <div
                                          className={`h-2 w-2 rounded-full me-2 ${method.toLowerCase().includes("bank")
                                            ? "bg-paymentMethod-bank"
                                            : "bg-paymentMethod-ewallet"
                                            }`}
                                        ></div>
                                        <span className="text-xs">{formatPaymentMethodName(method, t)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="px-0 py-2 lg:py-4 lg:px-4 text-right align-middle whitespace-nowrap row-start-4">
                                  {userId != ad.user.id && (
                                    <Button
                                      data-testid={`advertiser-btn-trade-${ad.id}`}
                                      variant={ad.type === "buy" ? "destructive" : "buy"}
                                      size="sm"
                                      onClick={() => handleOrderClick(ad, ad.type === "buy" ? "buy" : "sell")}
                                      disabled={!!tempBanUntil}
                                    >
                                      {ad.type === "buy" ? t("common.sell") : t("common.buy")} {ad.account_currency}
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div ref={sentinelRef} className="h-1" />
                      </div>
                      {isFetchingNextPage && (
                        <div className="flex justify-center py-4">
                          <Spinner size="md" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div data-testid="advertiser-empty-ads">
                      <EmptyState
                        title={t("advertiser.noAdsYet")}
                        description={t("advertiser.noActiveAds")}
                        redirectToAds={false}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            <OrderSidebar
              isOpen={isOrderSidebarOpen}
              onClose={() => setIsOrderSidebarOpen(false)}
              ad={selectedAd}
              orderType={orderType}
              p2pBalance={p2pBalance}
            />

            {pendingRiskAd && riskResult && (
              <RiskWarningModal
                isOpen={isRiskWarningOpen}
                result={riskResult}
                advertiserNickname={pendingRiskAd.user.nickname}
                onContinue={handleRiskContinue}
                onClose={handleRiskClose}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
