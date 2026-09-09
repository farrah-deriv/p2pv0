"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BackArrowIcon } from "@/components/ui/back-arrow-icon"
import { SearchField } from "@/components/ui/search-field"
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
import { useKycOverlay } from "@/hooks/use-kyc-overlay"
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
    const { t } = useTranslations()
    const [searchInput, setSearchInput] = useState("")
    const [searchTab, setSearchTab] = useState<"buy" | "sell">("sell")
    const [debouncedSearchInput, setDebouncedSearchInput] = useState("")
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const sentinelRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const isFetchingNextPageRef = useRef(false)

    // Restore previous search when sheet reopens (e.g. returning from advertiser page or order sidebar)
    useEffect(() => {
        if (isOpen) {
            const storedNickname = useMarketFilterStore.getState().nickname
            if (storedNickname) {
                setSearchInput(storedNickname)
                setDebouncedSearchInput(storedNickname)
            }
        }
    }, [isOpen, setSearchInput, setDebouncedSearchInput])

    const {
        data,
        isFetching: isSearching,
        isError: isSearchError,
        refetch: refetchSearch,
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

    const { runGatedAction } = useKycOverlay({ route: "markets" })

    const { setPendingAd, setShouldReopenSearchOnReturn } = useOrderSidebarStore()
    const { track } = useTrackers()

    const handleAdvertiserClick = (advertiserId: number) => {
        track("ek_advertiser_profile_markets_search")
        runGatedAction(() => {
            setShouldReopenSearchOnReturn(true)
            router.push(`/advertiser/${advertiserId}`)
            onClose()
        })
    }

    const [pendingRiskAd, setPendingRiskAd] = useState<Advertisement | null>(null)
    const [riskResult, setRiskResult] = useState<RiskWarningResult | null>(null)
    const [isRiskWarningOpen, setIsRiskWarningOpen] = useState(false)

    const handleBuySellClick = (ad: Advertisement) => {
        runGatedAction(() => {
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
        })
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
                    >
                        <BackArrowIcon alt={t("common.back")} width={24} height={24} />
                    </Button>
                    <SearchField
                        data-testid="mobile-search-input"
                        containerClassName="flex-1"
                        placeholder={t("market.searchAdvertiserNickname")}
                        value={searchInput}
                        onChange={handleSearchChange}
                        onClear={handleClear}
                        autoFocus
                    />
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
                    ) : isSearchError ? (
                        <div className="flex items-center justify-center h-full" data-testid="mobile-search-error-state">
                            <EmptyState
                                title={t("errors.loadAdsFailedTitle")}
                                description={t("errors.loadFailedDescription")}
                                actionLabel={t("errors.retry")}
                                onAction={() => refetchSearch()}
                            />
                        </div>
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
