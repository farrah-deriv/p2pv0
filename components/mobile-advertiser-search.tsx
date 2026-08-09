"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { BackArrowIcon } from "@/components/ui/back-arrow-icon"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useMarketFilterStore } from "@/stores/market-filter-store"
import { useOrderSidebarStore } from "@/stores/order-sidebar-store"
import { useAdvertiserSearch } from "@/hooks/use-api-queries"
import type { Advertisement } from "@/services/api/api-buy-sell"
import EmptyState from "@/components/empty-state"
import { AdvertiserSearchResultCard } from "@/components/advertiser-search-result-card"
import { AdvertiserSearchSkeleton } from "@/components/advertiser-search-skeleton"
import { TabHorizontal } from "@deriv-com/quill-ui-v2"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useUserDataStore } from "@/stores/user-data-store"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { createKycOnboardingAlertConfig } from "@/components/kyc-onboarding-sheet"
import { useTrackers } from "@/analytics/useTrackers"
import RiskWarningModal from "@/components/buy-sell/risk-warning/risk-warning-modal"
import { evaluateRisk, type RiskWarningResult } from "@/components/buy-sell/risk-warning/risk-warning-rules"

interface MobileAdvertiserSearchProps {
    isOpen: boolean
    onClose: () => void
}

export default function MobileAdvertiserSearch({ isOpen, onClose }: MobileAdvertiserSearchProps) {
    const router = useRouter()
    const { setNickname } = useMarketFilterStore()

    // Restore previous search when sheet reopens (e.g. returning from advertiser page or order sidebar)
    useEffect(() => {
        let mounted = true
        if (isOpen) {
            const storedNickname = useMarketFilterStore.getState().nickname
            if (storedNickname && mounted) {
                setSearchInput(storedNickname)
                setDebouncedSearchInput(storedNickname)
            }
        }
        return () => { mounted = false }
    }, [isOpen])
    const { t } = useTranslations()
    const [searchInput, setSearchInput] = useState("")
    const [searchTab, setSearchTab] = useState<"buy" | "sell">("sell")
    const [debouncedSearchInput, setDebouncedSearchInput] = useState("")
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const sentinelRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const isFetchingNextPageRef = useRef(false)

    const {
        data,
        isFetching: isSearching,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useAdvertiserSearch({ nickname: debouncedSearchInput, type: searchTab })

    const searchResults = data?.pages.flat() ?? []

    // Cleanup debounce timeout on unmount to prevent race conditions
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [])

    // Keep ref in sync so the observer callback always reads the latest value
    useEffect(() => {
        isFetchingNextPageRef.current = isFetchingNextPage
    }, [isFetchingNextPage])

    // Infinite scroll: fetch next page when sentinel comes into view
    useEffect(() => {
        const sentinel = sentinelRef.current
        const scrollContainer = scrollContainerRef.current
        if (!sentinel || !hasNextPage || !scrollContainer) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isFetchingNextPageRef.current) {
                    fetchNextPage()
                }
            },
            { threshold: 0, rootMargin: "100px", root: scrollContainer },
        )
        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [hasNextPage, fetchNextPage])

    const handleSearchChange = (value: string) => {
        setSearchInput(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            setDebouncedSearchInput(value)
            setNickname(value)
        }, 300)
    }

    const userId = useUserDataStore((state) => state.userId)
    const verificationStatus = useUserDataStore((state) => state.verificationStatus)
    const onboardingStatus = useUserDataStore((state) => state.onboardingStatus)
    const isPoiExpired = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY == "1" && userId && onboardingStatus?.kyc?.poi_status !== "approved"
    const isPoaExpired = process.env.NEXT_PUBLIC_IS_KYC_MANDATORY == "1" && userId && onboardingStatus?.kyc?.poa_status !== "approved"
    const { hideAlert, showAlert } = useAlertDialog()

    const { setPendingAd, setShouldReopenSearchOnReturn } = useOrderSidebarStore()
    const { track } = useTrackers()

    const handleAdvertiserClick = (advertiserId: number) => {
        track("ek_advertiser_profile_markets_search")
        if (userId && verificationStatus?.phone_verified && !isPoiExpired && !isPoaExpired) {
            setShouldReopenSearchOnReturn(true)
            router.push(`/advertiser/${advertiserId}`)
            onClose()
        } else {
      showAlert(createKycOnboardingAlertConfig({ route: "markets",
        onClose: hideAlert }))
        }
    }

    const [pendingRiskAd, setPendingRiskAd] = useState<Advertisement | null>(null)
    const [riskResult, setRiskResult] = useState<RiskWarningResult | null>(null)
    const [isRiskWarningOpen, setIsRiskWarningOpen] = useState(false)

    const handleBuySellClick = (ad: Advertisement) => {
        track("ek_advert_action_markets_search", { advert_type: ad.type === "buy" ? "sell" : "buy" })
        const risk = evaluateRisk(ad)
        if (risk) {
            setPendingRiskAd(ad)
            setRiskResult(risk)
            setIsRiskWarningOpen(true)
            return
        }
        setPendingAd(ad, true)
        handleClose()
    }

    const handleRiskContinue = () => {
        if (pendingRiskAd) {
            setPendingAd(pendingRiskAd, true)
        }
        setIsRiskWarningOpen(false)
        setPendingRiskAd(null)
        setRiskResult(null)
        handleClose()
    }

    const handleRiskClose = () => {
        setIsRiskWarningOpen(false)
        setPendingRiskAd(null)
        setRiskResult(null)
    }

    const handleClear = () => {
        track("ek_clear_search_markets_search")
        setSearchInput("")
        setDebouncedSearchInput("")
        setNickname("")
    }

    const handleBack = () => {
        track("ek_back_markets_search")
        handleClose()
    }

    const handleClose = () => {
        setSearchInput("")
        setDebouncedSearchInput("")
        onClose()
    }

    return (
        <>
        <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <SheetContent
                data-testid="mobile-search-sheet"
                side="right"
                hideCloseButton
                className="h-full w-full p-0 flex flex-col gap-0 rounded-none"
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => {
                    if (isRiskWarningOpen) e.preventDefault()
                }}
            >
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0">
                    <Button
                        data-testid="mobile-search-btn-back"
                        variant="icon-muted"
                        onClick={handleBack}
                        className="!bg-header-icon hover:!bg-header-icon"
                    >
                        <BackArrowIcon alt={t("common.back")} width={24} height={24} />
                    </Button>
                    <div className="relative flex-1">
                        <Input
                            data-testid="mobile-search-input"
                            variant="tertiary"
                            placeholder={t("market.searchAdvertiserNickname")}
                            value={searchInput}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            autoFocus
                            className={`w-full min-w-0 rounded-full ps-4 ${searchInput ? "pe-10" : "pe-4"}`}
                        />
                        {searchInput && (
                            <Button
                                data-testid="mobile-search-btn-clear"
                                variant="ghost"
                                size="icon"
                                onClick={handleClear}
                                className="absolute end-1 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-transparent p-0"
                            >
                                <Image src="/icons/clear-search-icon.png" alt={t("common.clear")} width={20} height={20} />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex-shrink-0">
                    <TabHorizontal
                        type="fill"
                        value={searchTab}
                        onChange={(v) => {
                            if (v === "sell") track("ek_buy_tab_markets_search")
                            else track("ek_sell_tab_markets_search")
                            setSearchTab(v as "buy" | "sell")
                        }}
                        tabs={[
                            { value: "sell", label: t("market.buyTab") },
                            { value: "buy", label: t("market.sellTab") },
                        ]}
                    />
                </div>

                {/* Results */}
                <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
                    {!debouncedSearchInput ? null : isSearching && searchResults.length === 0 ? (
                        <AdvertiserSearchSkeleton count={5} />
                    ) : searchResults.length > 0 ? (
                        <>
                            <ul>
                                {searchResults.map((ad) => (
                                    <li key={ad.id} className="border-b border-slate-100">
                                        {ad.user && <AdvertiserSearchResultCard ad={ad} onAdvertiserClick={handleAdvertiserClick} onBuySellClick={handleBuySellClick} />}
                                    </li>
                                ))}
                            </ul>
                            {isFetchingNextPage && (
                                <div className="sticky bottom-0 flex justify-center py-4 bg-background">
                                    <Spinner size="md" />
                                </div>
                            )}
                            <div ref={sentinelRef} data-testid="mobile-search-sentinel-load-more" className="h-1" />
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <EmptyState
                                title={t("common.searchNoResultsTitle", { query: debouncedSearchInput })}
                                description={t("common.searchNoResultsDescription")}
                            />
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
        {pendingRiskAd && riskResult && (
            <RiskWarningModal
                isOpen={isRiskWarningOpen}
                result={riskResult}
                advertiserNickname={pendingRiskAd.user.nickname}
                onContinue={handleRiskContinue}
                onClose={handleRiskClose}
            />
        )}
        </>
    )
}
