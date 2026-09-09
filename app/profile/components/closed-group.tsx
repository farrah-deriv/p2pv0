"use client"

import type React from "react"
import { useCallback, useState, useMemo } from "react"
import { StandaloneSearchRegularIcon } from "@deriv/quill-icons/Standalone"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import EmptyState from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "@/lib/i18n/use-translations"
import { cn } from "@/lib/utils"
import { removeAllFromClosedGroup, addToClosedGroup, removeFromClosedGroup } from "@/services/api/api-profile"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { useFavouriteUsers, queryKeys } from "@/hooks/use-api-queries"
import { useQueryClient } from "@tanstack/react-query"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { normalizeNicknameFilter, shouldShowProfileListSearch, PROFILE_SEARCH_DEBOUNCE_MS } from "@/lib/profile-list-search"
import { useToast } from "@/hooks/use-toast"
import { useUserDataStore } from "@/stores/user-data-store"
import { TOAST_SUCCESS_CLASS } from "@/lib/toast-utils"
interface ClosedGroup {
  user_id: number
  nickname: string
  is_group_member: boolean
}

interface ClosedGroupTabProps {
  isInAlert?: boolean
}

export default function ClosedGroupTab({ isInAlert = false }: ClosedGroupTabProps) {
  const { t } = useTranslations()
  const { hideAlert, showAlert } = useAlertDialog()
  const { toast } = useToast()
  const { userData } = useUserDataStore()
  const isDiamond = userData?.trade_band === "diamond"
  const [searchQuery, setSearchQuery] = useState("")
  const [isRemoving, setIsRemoving] = useState(false)
  // The nickname goes to the server, so it has to settle before it becomes a query key.
  const activeNickname = normalizeNicknameFilter(useDebouncedValue(searchQuery, PROFILE_SEARCH_DEBOUNCE_MS))

  const queryClient = useQueryClient()
  const { data, isLoading } = useFavouriteUsers(isDiamond, activeNickname)
  // "Remove all" and the section header describe the whole group, not the search hits, so
  // they read an unfiltered watch. With no nickname it is the same key as the query above.
  const { data: allData } = useFavouriteUsers(isDiamond)
  // Force empty list for non-diamond users even if React Query returns stale cached
  // data (e.g. user downgraded mid-session). The enabled:false flag prevents new
  // network requests; this override ensures the UI never renders cached results.
  const closedGroups: ClosedGroup[] = isDiamond ? (data?.pages.flat() ?? []) : []
  const allClosedGroups: ClosedGroup[] = useMemo(
    () => (isDiamond ? ((allData?.pages.flat() as ClosedGroup[]) ?? []) : []),
    [isDiamond, allData],
  )

  const hasGroupMembers = useMemo(() => {
    return allClosedGroups.some((group) => group.is_group_member)
  }, [allClosedGroups])

  // Every nickname variant has to refresh, not just the one on screen — prefix match.
  const refreshFollowing = useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.buySell.favouriteUsers() }),
    [queryClient],
  )

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }, [])

  const handleClosedGroupError = useCallback((errors: Array<{ code: string; message: string }> | undefined, isAdd: boolean) => {
    const code = errors?.[0]?.code
    if (code === "UserGroupMemberBlockedBy") {
      showAlert({
        title: t("advertiser.memberUnavailableTitle"),
        description: isAdd
          ? t("advertiser.closedGroupBlockedByAddMessage")
          : t("advertiser.closedGroupBlockedByRemoveMessage"),
        confirmText: t("advertiser.chooseAnotherTrader"),
        cancelText: t("common.close"),
        type: "warning",
        onConfirm: hideAlert,
        onCancel: hideAlert,
      })
    } else {
      const errorCode = errors?.[0]?.code ?? "unknown"
      showAlert({
        title: t("common.somethingWentWrong"),
        description: t("nps.errorMessage", { errorCode }),
        confirmText: t("common.gotIt"),
        type: "warning",
        onConfirm: hideAlert,
      })
    }
  }, [showAlert, hideAlert, t])

  const showToast = useCallback((message: string) => {
    toast({
      description: (
        <div className="flex items-center gap-2">
          <Image src="/icons/tick.svg" alt="Success" width={24} height={24} className="text-white" />
          <span>{message}</span>
        </div>
      ),
      className: TOAST_SUCCESS_CLASS,
      duration: 2500,
    })
  }, [toast])

  const handleRemoveAll = useCallback(async () => {
    try {
      setIsRemoving(true)
      const result = await removeAllFromClosedGroup()
      if (result.success) {
        await refreshFollowing()
        showToast(t("advertiser.removedFromClosedGroup"))
      } else {
        handleClosedGroupError(result.errors, false)
      }
    } catch (err) {
      console.error("Failed to remove all from closed group:", err)
    } finally {
      setIsRemoving(false)
    }
  }, [refreshFollowing, t, showToast, handleClosedGroupError])

  const handleToggleMembership = useCallback(async (group: ClosedGroup) => {
    try {
      if (!group.user_id) {
        return
      }

      const isAdd = !group.is_group_member
      const result = isAdd
        ? await addToClosedGroup(group.user_id)
        : await removeFromClosedGroup(group.user_id)

      if (result.success) {
        await refreshFollowing()
        showToast(isAdd
          ? t("advertiser.addedToClosedGroup")
          : t("advertiser.removedFromClosedGroup")
        )
      } else {
        handleClosedGroupError(result.errors, isAdd)
      }
    } catch (err) {
      console.error("Failed to update closed group membership:", err)
    }
  }, [refreshFollowing, t, showToast, handleClosedGroupError])

  const GroupCard = ({ group }: { group: ClosedGroup }) => (
    <div className="min-h-[72px] flex items-center justify-between gap-3 min-w-0">
      <div className="w-10 h-10 rounded-full bg-grayscale-300 flex items-center justify-center text-slate-700 font-bold text-sm flex-shrink-0">
        {group.nickname?.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0 border-b border-gray-100 py-4 flex items-center justify-between gap-3">
        <div className="min-w-0 text-start text-slate-1200 text-sm break-words">
          {group.nickname}
        </div>
        <Button
          onClick={() => handleToggleMembership(group)}
          variant="outline"
          size="sm"
          className="shrink-0 whitespace-nowrap min-w-fit"
        >
          {group.is_group_member ? t("common.remove") : t("common.add")}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4 flex flex-col h-full min-h-0">
      {!isDiamond && (
        <Alert variant="warning">
          <AlertDescription>{t("profile.closedGroupDiamondOnlyWarning")}</AlertDescription>
        </Alert>
      )}
      {(isDiamond
        ? shouldShowProfileListSearch({
            // The unfiltered watch already lives here for "Remove all"; reuse it so a search that
            // matches nothing does not retract the field, same rule as the other profile lists.
            baseItemCount: allClosedGroups.length,
            searchInput: searchQuery,
            activeNickname,
          })
        : true) && (
        <div className="flex items-center justify-between gap-4">
          <div className={isInAlert ? "w-full" : "w-full md:w-[360px]"}>
            <div className={cn("flex items-center gap-2 rounded-lg bg-black/[0.04] px-3 h-10", !isDiamond && "opacity-50")}>
              <StandaloneSearchRegularIcon iconSize="xs" className="shrink-0 text-neutral-400" aria-hidden />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                disabled={!isDiamond}
                placeholder={t("common.search")}
                autoComplete="off"
                className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed"
              />
              {searchQuery && isDiamond && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
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

      {allClosedGroups.length > 0 && !searchQuery && (<div className="flex items-center justify-between">
        <h2 className="text-grayscale-text-muted text-base">{t("profile.addFromYourFollowing")}</h2>
        <Button
          onClick={handleRemoveAll}
          disabled={isRemoving || !hasGroupMembers}
          variant="ghost"
          size="sm"
          className="px-0 underline hover:opacity-100 hover:bg-transparent disabled:text-grayscale-text-placeholder disabled:opacity-100 cursor-pointer"
        >
          {t("common.removeAll")}
        </Button>
      </div>)}

      <div className="space-y-0 flex-1 min-h-0 md:flex-none md:h-[20rem] overflow-y-auto">
        {isLoading && isDiamond ? (
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[72px] flex items-center justify-between gap-3">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0 bg-grayscale-500" />
                <div className="flex-1 border-b border-gray-100 py-4 flex items-center justify-between">
                  <Skeleton className="h-5 w-32 bg-grayscale-500" />
                  <Skeleton className="h-8 w-20 rounded-full bg-grayscale-500" />
                </div>
              </div>
            ))}
          </div>
        ) : isDiamond && closedGroups.length > 0 ? (
          closedGroups.map((group) => <GroupCard key={group.user_id} group={group} />)
        ) : (
          <EmptyState
            title={activeNickname ? t("profile.noMatchingName") : t("profile.closedGroupEmptyTitle")}
            description={
              activeNickname
                ? t("profile.noResultFor", { query: activeNickname })
                : t("profile.closedGroupEmptyDescription")
            }
            redirectToAds={false}
          />
        )}
      </div>

      {isInAlert && (
        <div className="my-6 border-gray-100 pb-6">
          <Button
            onClick={hideAlert}
            variant="primary"
            className="w-full"
          >
            {t("common.done")}
          </Button>
        </div>
      )}
    </div>
  )
}
