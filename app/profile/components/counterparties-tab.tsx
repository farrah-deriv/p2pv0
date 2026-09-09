"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useCallback, useState, useMemo } from "react"
import { isRtlLocale } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"
import { PROFILE_TOOLBAR_ROW } from "@/lib/rtl"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import {
  normalizeNicknameFilter,
  resolvePendingSearchFlags,
  shouldShowProfileListSearch,
  PROFILE_SEARCH_DEBOUNCE_MS,
} from "@/lib/profile-list-search"
import { toggleBlockAdvertiser } from "@/services/api/api-buy-sell"
import type { TradePartner } from "@/services/api/api-profile"
import { useTradePartners } from "@/hooks/use-api-queries"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/hooks/use-api-queries"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { StandaloneSearchRegularIcon } from "@deriv/quill-icons/Standalone"
import Image from "next/image"
import EmptyState from "@/components/empty-state"
import { resolveListViewState } from "@/lib/errors/resolve-list-view-state"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { TOAST_SUCCESS_CLASS, TOAST_ERROR_CLASS } from "@/lib/toast-utils"

export default function CounterpartiesTab() {
  const { t, locale } = useTranslations()
  const dir = isRtlLocale(locale) ? "rtl" : "ltr"
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  // The nickname goes to the server, so it has to settle before it becomes a query key.
  const activeNickname = normalizeNicknameFilter(useDebouncedValue(searchQuery, PROFILE_SEARCH_DEBOUNCE_MS))
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useTradePartners(true, activeNickname)

  const { showAlert } = useAlertDialog()
  const { toast } = useToast()

  // Flatten pages into single array
  const counterparties = useMemo(() => {
    return data?.pages.flatMap(page => page) ?? []
  }, [data])

  const handleAdvertiserClick = (userId: number) => {
    router.push(`/advertiser/${userId}?return_to=profile&tab=counterparties`)
  }

  // Mirrors mobile `_CounterpartiesBody`: the full-page retry state belongs to a failed
  // UNFILTERED fetch. Once the user is searching, the previous nickname's error is not theirs to
  // inherit — the sub-area shows loading while the new query runs.
  const searchFlags = resolvePendingSearchFlags({
    isLoading,
    isError,
    searchInput: searchQuery,
    activeNickname,
  })

  // Search stays in the column while the list below it reloads, rather than being retracted the
  // moment a refetch empties the rendered rows.
  const showSearch = shouldShowProfileListSearch({
    baseItemCount: counterparties.length,
    searchInput: searchQuery,
    activeNickname,
  })

  const viewState = resolveListViewState({
    isLoading: searchFlags.isLoading,
    isError: searchFlags.isError,
    itemCount: counterparties.length,
    hasSearchQuery: activeNickname !== undefined,
  })

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchQuery("")
  }, [])

  const handleBlock = (user: TradePartner) => {
    showAlert({
      title: t("profile.blockUser", { nickname: user.nickname }),
      description: t("profile.blockDescription"),
      confirmText: t("profile.block"),
      cancelText: t("common.cancel"),
      type: "warning",
      onConfirm: async () => {
        try {
          const result = await toggleBlockAdvertiser(user.user_id, true)

          if (result.success) {
            toast({
              description: (
                <div className="flex items-center gap-2">
                  <Image src="/icons/tick.svg" alt={t("common.success")} width={24} height={24} className="text-white" />
                  <span>{t("profile.userBlocked", { nickname: user.nickname })}</span>
                </div>
              ),
              className: TOAST_SUCCESS_CLASS,
              duration: 2500,
            })
            queryClient.invalidateQueries({ queryKey: queryKeys.auth.tradePartners() })
            queryClient.invalidateQueries({ queryKey: queryKeys.auth.blockedUsers() })
          }
        } catch (error) {
          console.error("Error blocking user:", error)
          toast({
            description: (
              <div className="flex items-center gap-2">
                <span>{t("profile.errorBlockingUser")}</span>
              </div>
            ),
            className: TOAST_ERROR_CLASS,
            duration: 3000,
          })
        }
      },
    })
  }

  const handleUnblock = (user: TradePartner) => {
    showAlert({
      title: t("profile.unblockUser", { nickname: user.nickname }),
      description: t("profile.unblockDescription"),
      confirmText: t("profile.unblock"),
      cancelText: t("common.cancel"),
      type: "warning",
      onConfirm: async () => {
        try {
          const result = await toggleBlockAdvertiser(user.user_id, false)

          if (result.success) {
            toast({
              description: (
                <div className="flex items-center gap-2">
                  <Image src="/icons/tick.svg" alt={t("common.success")} width={24} height={24} className="text-white" />
                  <span>{t("profile.userUnblocked", { nickname: user.nickname })}</span>
                </div>
              ),
              className: TOAST_SUCCESS_CLASS,
              duration: 2500,
            })
            queryClient.invalidateQueries({ queryKey: queryKeys.auth.tradePartners() })
            queryClient.invalidateQueries({ queryKey: queryKeys.auth.blockedUsers() })
          }
        } catch (error) {
          console.error("Error unblocking user:", error)
          toast({
            description: (
              <div className="flex items-center gap-2">
                <span>{t("profile.errorUnblockingUser")}</span>
              </div>
            ),
            className: TOAST_ERROR_CLASS,
            duration: 3000,
          })
        }
      },
    })
  }

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-[72px] flex items-center gap-3 p-3 rounded-lg">
          <Skeleton className="w-10 h-10 rounded-full bg-grayscale-500" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2 rounded bg-grayscale-500" />
            <Skeleton className="h-3 w-32 rounded bg-grayscale-500" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full bg-grayscale-500" />
        </div>
      ))}
    </div>
  )

  const UserCard = ({ user }: { user: TradePartner }) => (
    <div className="min-h-[72px] flex items-center justify-between gap-3 min-w-0">
      <div className="w-10 h-10 rounded-full bg-grayscale-300 flex items-center justify-center text-slate-700 font-bold text-sm flex-shrink-0">
        {user.nickname?.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0 border-b border-gray-100 py-4 flex items-center justify-between gap-3">
        <Button
          onClick={() => handleAdvertiserClick(user.user_id)}
          className="min-w-0 justify-start text-start hover:underline !hover:bg-transparent cursor-pointer font-normal text-slate-1200 px-0 text-base break-words"
          size="sm"
          variant="ghost"
        >
          {user.nickname}
        </Button>
        <Button
          variant="secondary-outline"
          size="sm"
          onClick={() => (user.is_blocked ? handleUnblock(user) : handleBlock(user))}
          className="shrink-0 whitespace-nowrap"
        >
          {user.is_blocked ? t("profile.unblock") : t("profile.block")}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full" dir={dir}>
      {showSearch && (
        <div className={PROFILE_TOOLBAR_ROW} data-testid="counterparties-search">
          <div className="w-full md:w-[360px]">
            <div className="flex items-center gap-2 rounded-lg bg-black/[0.04] px-3 h-10">
              <StandaloneSearchRegularIcon iconSize="xs" className="shrink-0 text-neutral-400" aria-hidden />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={t("common.search")}
                autoComplete="off"
                className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearSearch}
                  className="hover:!bg-transparent !p-0 !h-auto !w-auto !min-w-0"
                  aria-label={t("common.clearSearch")}
                >
                  <Image src="/icons/clear-search-icon.png" alt="" aria-hidden width={20} height={20} />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {viewState === "loading" ? (
          <LoadingSkeleton />
        ) : viewState === "error" ? (
          <div data-testid="counterparties-error-state">
            <EmptyState
              title={t("errors.loadCounterpartiesFailedTitle")}
              description={t("errors.loadFailedDescription")}
              actionLabel={t("errors.retry")}
              onAction={() => refetch()}
              redirectToAds={false}
            />
          </div>
        ) : viewState === "list" ? (
          <>
            {counterparties.map((user) => (
              <UserCard key={user.user_id} user={user} />
            ))}
          </>
        ) : (
          <EmptyState
            title={viewState === "search-empty" ? t("profile.noMatchingName") : t("profile.noCounterparties")}
            description={
              viewState === "search-empty"
                ? t("profile.noResultFor", { query: activeNickname ?? "" })
                : t("profile.noCounterpartiesDescription")
            }
            redirectToAds={false}
          />
        )}
      </div>
    </div>
  )
}
