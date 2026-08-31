"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useCallback, useState, useMemo } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { createGenericMutationErrorAlertConfig, getApiErrorCode } from "@/lib/errors/create-generic-mutation-alert-config"
import { toggleFavouriteAdvertiser } from "@/services/api/api-buy-sell"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import FollowUserList from "./follow-user-list"
import { isRtlLocale } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"
import { PROFILE_SUB_TABS_ROW } from "@/lib/rtl"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { normalizeNicknameFilter, resolvePendingSearchFlags, PROFILE_SEARCH_DEBOUNCE_MS } from "@/lib/profile-list-search"
import { useFavouriteUsers, useFollowers } from "@/hooks/use-api-queries"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/hooks/use-api-queries"
import { TOAST_SUCCESS_CLASS } from "@/lib/toast-utils"

interface FollowUser {
  nickname: string
  user_id: number
}

export default function FollowsTab() {
  const { t, locale } = useTranslations()
  const dir = isRtlLocale(locale) ? "rtl" : "ltr"
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("follows")
  // The nickname goes to the server, so it has to settle before it becomes a query key.
  const activeNickname = normalizeNicknameFilter(useDebouncedValue(searchQuery, PROFILE_SEARCH_DEBOUNCE_MS))

  // Only the visible tab searches. The hidden one stays on its unfiltered key, so a nickname
  // typed on one tab never lands in the other's cache entry.
  const followsNickname = activeTab === "follows" ? activeNickname : undefined
  const followersNickname = activeTab === "followers" ? activeNickname : undefined

  const { showAlert, hideAlert } = useAlertDialog()
  const { toast } = useToast()

  const {
    data: followingData,
    isLoading: isLoadingFollowing,
    isError: isFollowingError,
    refetch: refetchFollowing,
  } = useFavouriteUsers(true, followsNickname)

  const {
    data: followersData,
    isLoading: isLoadingFollowers,
    isError: isFollowersError,
    refetch: refetchFollowers,
  } = useFollowers(true, followersNickname)

  // The tab counts and the follow/unfollow button state describe the whole relationship, not
  // the search hits, so they need an unfiltered watch of their own. With no nickname these
  // resolve to the same keys as the queries above, so an unsearched screen still issues two
  // requests, not four.
  const { data: allFollowingData } = useFavouriteUsers()
  const { data: allFollowersData } = useFollowers()

  // Flatten pages into single arrays
  const following = useMemo(() => {
    return followingData?.pages.flatMap(page => page) ?? []
  }, [followingData])

  const followers = useMemo(() => {
    return followersData?.pages.flatMap(page => page) ?? []
  }, [followersData])

  const allFollowing = useMemo(() => {
    return allFollowingData?.pages.flatMap(page => page) ?? []
  }, [allFollowingData])

  const allFollowers = useMemo(() => {
    return allFollowersData?.pages.flatMap(page => page) ?? []
  }, [allFollowersData])

  const handleAdvertiserClick = (userId: number) => {
    router.push(`/advertiser/${userId}?return_to=profile&tab=follows`)
  }

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchQuery("")
  }, [])

  // Re-opening from inside onConfirm has to wait for the confirming dialog to close.
  const showMutationError = (error?: unknown) => {
    setTimeout(() => {
      showAlert(createGenericMutationErrorAlertConfig(t, { errorCode: getApiErrorCode(error), onConfirm: hideAlert }))
    }, 500)
  }

  const handleFollowToggle = (user: FollowUser, isCurrentlyFollowing: boolean) => {
    if (isCurrentlyFollowing) {
      showAlert({
        title: t("profile.unfollowUser", { nickname: user.nickname }),
        description: t("profile.unfollowDescription"),
        confirmText: t("profile.unfollow"),
        cancelText: t("common.cancel"),
        type: "warning",
        onConfirm: async () => {
          try {
            const result = await toggleFavouriteAdvertiser(user.user_id, false)

            if (result.success) {
              toast({
                description: (
                  <div className="flex items-center gap-2">
                    <Image src="/icons/tick.svg" alt={t("common.success")} width={24} height={24} className="text-white" />
                    <span>{t("profile.userUnfollowed", { nickname: user.nickname })}</span>
                  </div>
                ),
                className: TOAST_SUCCESS_CLASS,
                duration: 2500,
              })
              queryClient.invalidateQueries({ queryKey: queryKeys.buySell.favouriteUsers() })
            } else {
              showMutationError()
            }
          } catch (error) {
            console.error("Error unfollowing user:", error)
            showMutationError(error)
          }
        },
      })
    } else {
      toggleFavouriteAdvertiser(user.user_id, true)
        .then((result) => {
          if (result.success) {
            toast({
              description: (
                <div className="flex items-center gap-2">
                  <Image src="/icons/tick.svg" alt={t("common.success")} width={24} height={24} className="text-white" />
                  <span>{t("profile.userFollowed", { nickname: user.nickname })}</span>
                </div>
              ),
              className: TOAST_SUCCESS_CLASS,
              duration: 2500,
            })
            queryClient.invalidateQueries({ queryKey: queryKeys.buySell.favouriteUsers() })
          } else {
            showAlert(createGenericMutationErrorAlertConfig(t, { onConfirm: hideAlert }))
          }
        })
        .catch((error) => {
          console.error("Error following user:", error)
          showAlert(createGenericMutationErrorAlertConfig(t, { errorCode: getApiErrorCode(error), onConfirm: hideAlert }))
        })
    }
  }

  const followingUserIds = useMemo(() => allFollowing.map((user) => user.user_id), [allFollowing])

  // Each list gets its OWN flags. Both tabs stay mounted, so a single flag derived from the
  // active tab handed the hidden list the visible one's loading state and flickered it.
  // Only the searching tab reconciles against the pending nickname — the other one is not the
  // query the user is typing at.
  const followingFlags = resolvePendingSearchFlags({
    isLoading: isLoadingFollowing,
    isError: isFollowingError,
    searchInput: activeTab === "follows" ? searchQuery : "",
    activeNickname: followsNickname,
  })

  const followersFlags = resolvePendingSearchFlags({
    isLoading: isLoadingFollowers,
    isError: isFollowersError,
    searchInput: activeTab === "followers" ? searchQuery : "",
    activeNickname: followersNickname,
  })

  return (
    <div className="flex flex-col h-full" dir={dir}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <div className={PROFILE_SUB_TABS_ROW}>
          <TabsList className="w-full md:w-fit">
            <TabsTrigger value="follows" className="flex-1 md:flex-none md:w-32">{t("profile.followsCount", { count: allFollowing.length })}</TabsTrigger>
            <TabsTrigger value="followers" className="flex-1 md:flex-none md:w-32">{t("profile.followersCount", { count: allFollowers.length })}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="follows" className="flex-1 min-h-0">
          <FollowUserList
            users={following}
            isLoading={followingFlags.isLoading}
            isError={followingFlags.isError}
            errorTitle={t("errors.loadFollowingFailedTitle")}
            onRetry={() => refetchFollowing()}
            searchQuery={searchQuery}
            activeSearchQuery={followsNickname}
            onSearchChange={handleSearchChange}
            onClearSearch={handleClearSearch}
            onUserClick={handleAdvertiserClick}
            onFollowToggle={handleFollowToggle}
            followingUserIds={followingUserIds}
            emptyTitle={t("profile.notFollowingAnyone")}
            emptyDescription={t("profile.startFollowing")}
            searchEmptyTitle={t("profile.noMatchingName")}
            searchEmptyDescription={t("profile.noResultFor", { query: followsNickname ?? "" })}
            showFollowingButton={true}
          />
        </TabsContent>

        <TabsContent value="followers" className="flex-1 min-h-0">
          <FollowUserList
            users={followers}
            isLoading={followersFlags.isLoading}
            isError={followersFlags.isError}
            errorTitle={t("errors.loadFollowersFailedTitle")}
            onRetry={() => refetchFollowers()}
            searchQuery={searchQuery}
            activeSearchQuery={followersNickname}
            onSearchChange={handleSearchChange}
            onClearSearch={handleClearSearch}
            onUserClick={handleAdvertiserClick}
            onFollowToggle={handleFollowToggle}
            followingUserIds={followingUserIds}
            emptyTitle={t("profile.noFollowers")}
            emptyDescription={t("profile.whenUsersFollow")}
            searchEmptyTitle={t("profile.noMatchingName")}
            searchEmptyDescription={t("profile.noResultFor", { query: followersNickname ?? "" })}
            showFollowingButton={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
