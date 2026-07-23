"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useCallback, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { toggleBlockAdvertiser } from "@/services/api/api-buy-sell"
import { useBlockedUsers } from "@/hooks/use-api-queries"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/hooks/use-api-queries"
import Image from "next/image"
import EmptyState from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { isRtlLocale } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"
import { PROFILE_TOOLBAR_ROW } from "@/lib/rtl"

interface BlockedUser {
  nickname: string
  user_id: number
}

export default function BlockedTab() {
  const { t, locale } = useTranslations()
  const dir = isRtlLocale(locale) ? "rtl" : "ltr"
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const {
    data,
    isLoading,
  } = useBlockedUsers()

  const { showAlert } = useAlertDialog()
  const { toast } = useToast()

  // Flatten pages into single array
  const blockedUsers = useMemo(() => {
    return data?.pages.flatMap(page => page) ?? []
  }, [data])

  const filteredBlockedUsers = useMemo(() => {
    if (!searchQuery.trim()) return blockedUsers

    return blockedUsers.filter((user) => user.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [blockedUsers, searchQuery])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }, [])

  const handleUnblock = (user: BlockedUser) => {
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
              className: "bg-black text-white border-black h-[48px] rounded-lg px-[16px] py-[8px]",
              duration: 2500,
            })
            queryClient.invalidateQueries({ queryKey: queryKeys.auth.blockedUsers() })
            queryClient.invalidateQueries({ queryKey: queryKeys.auth.tradePartners() })
          }
        } catch (error) {
          console.error("Error unblocking user:", error)
        }
      },
    })
  }

  const onUserClick = (userId: number) => {
    router.push(`/advertiser/${userId}?return_to=profile&tab=blocked`)
  }

  const UserCard = ({ user }: { user: BlockedUser }) => (
    <div className="h-[72px] flex items-center justify-between gap-3 min-w-0">
      <div className="w-10 h-10 rounded-full bg-grayscale-300 flex items-center justify-center text-slate-700 font-bold text-sm flex-shrink-0">
        {user.nickname?.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0 border-b border-gray-100 py-4 flex items-center justify-between gap-3">
        <Button
          onClick={() => onUserClick(user.user_id)}
          className="min-w-0 flex-1 justify-start text-start hover:underline hover:bg-transparent cursor-pointer font-normal text-slate-1200 px-0 text-base overflow-hidden"
          size="sm"
          variant="ghost"
        >
          <span className="block truncate">{user.nickname}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUnblock(user)}
          className="shrink-0 whitespace-nowrap rounded-full px-4 py-1 text-sm"
        >
          {t("profile.unblock")}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full" dir={dir}>
      {(filteredBlockedUsers.length > 0 || searchQuery) && (
        <div className={PROFILE_TOOLBAR_ROW}>
          <div className="relative w-full md:w-[360px]">
            <Input
              placeholder={t("common.search")}
              value={searchQuery}
              onChange={handleSearchChange}
              className={`h-14 ps-4 border-0 bg-grayscale-500 rounded-lg text-start focus:outline-none ${searchQuery ? "pe-10" : "pe-4"}`}
              autoComplete="off"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute end-0 top-1/2 transform -translate-y-1/2 hover:bg-transparent"
              >
                <Image src="/icons/clear-search-icon.png" alt={t("common.clearSearch")} width={24} height={24} />
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
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
        ) : filteredBlockedUsers.length > 0 ? (
          <>
            {filteredBlockedUsers.map((user) => (
              <UserCard key={user.user_id} user={user} />
            ))}
          </>
        ) : (
          <EmptyState
            title={searchQuery ? t("profile.noMatchingName") : t("profile.noBlockedUsers")}
            description={
              searchQuery ? t("profile.noResultFor", { query: searchQuery }) : t("profile.blockedUsersAppear")
            }
            redirectToAds={false}
          />
        )}
      </div>
    </div>
  )
}
