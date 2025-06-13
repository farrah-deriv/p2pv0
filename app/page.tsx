"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { USER } from "@/lib/local-variables"
import type { Advertisement, PaymentMethod } from "@/services/api/api-buy-sell"
import { BuySellAPI } from "@/services/api"
import { debounce } from "lodash"
import FilterPopup, { type FilterOptions } from "@/components/buy-sell/filter-popup"
import OrderSidebar from "@/components/buy-sell/order-sidebar"

export default function BuySellPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("sell")
  const [currency, setCurrency] = useState("IDR")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("exchange_rate")
  const [adverts, setAdverts] = useState<Advertisement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    fromFollowing: false,
  })
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("all")
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)

  const [isOrderSidebarOpen, setIsOrderSidebarOpen] = useState(false)
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null)

  useEffect(() => {
    fetchAdverts()
  }, [activeTab, currency, sortBy, filterOptions, selectedPaymentMethod])

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      setIsLoadingPaymentMethods(true)
      try {
        const methods = await BuySellAPI.getPaymentMethods()
        setPaymentMethods(methods)
      } catch (error) {
        console.error("Error fetching payment methods:", error)
      } finally {
        setIsLoadingPaymentMethods(false)
      }
    }

    fetchPaymentMethods()
  }, [])

  const fetchAdverts = async (query = null) => {
    setIsLoading(true)
    setError(null)
    try {
      const params: BuySellAPI.SearchParams = {
        type: activeTab,
        currency: currency,
        paymentMethod: selectedPaymentMethod || undefined,
        nickname: query !== null ? query : searchQuery,
        sortBy: sortBy,
      }

      if (filterOptions.fromFollowing) {
        params.favourites_only = 1
      }

      const data = await BuySellAPI.getAdvertisements(params)

      if (Array.isArray(data)) {
        setAdverts(data)
      } else {
        console.error("API did not return an array:", data)
        setAdverts([])
        setError("Received invalid data format from server")
      }
    } catch (err) {
      console.error("Error fetching adverts:", err)
      setError("Failed to load advertisements. Please try again.")
      setAdverts([])
    } finally {
      setIsLoading(false)
    }
  }

  const debouncedFetchAdverts = useCallback(
    debounce(() => {
      fetchAdverts()
    }, 300),
    [activeTab, currency, sortBy, filterOptions, searchQuery, selectedPaymentMethod],
  )

  const handleAdvertiserClick = (userId: number) => {
    router.push(`/advertiser/${userId}`)
  }

  const handleOrderClick = (ad: Advertisement) => {
    setSelectedAd(ad)
    setIsOrderSidebarOpen(true)
    setError(null)
  }

  useEffect(() => {
    if (isFilterPopupOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (!(event.target as Element).closest(".filter-dropdown-container")) {
          setIsFilterPopupOpen(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isFilterPopupOpen])

  return (
    <div className="flex flex-col">
      <Navigation isVisible={true} />

      {/* Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger>
            <SelectValue placeholder="IDR" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IDR">IDR</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="GBP">GBP</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedPaymentMethod}
          onValueChange={setSelectedPaymentMethod}
          disabled={isLoadingPaymentMethods}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoadingPaymentMethods ? "Loading..." : "Payment (All)"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payment methods</SelectItem>
            {paymentMethods.map((method) => (
              <SelectItem key={method.method} value={method.method}>
                {method.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <Input
            className="pl-10 w-full"
            placeholder="Enter nickname"
            onChange={(e) => {
              const value = e.target.value
              setSearchQuery(value)
              if (value.trim() === "") {
                fetchAdverts("")
              } else {
                debouncedFetchAdverts()
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                fetchAdverts()
              }
            }}
          />
        </div>

        <div className="flex gap-3">
          <Select defaultValue="exchange_rate" onValueChange={setSortBy} className="flex-1">
            <SelectTrigger>
              <SelectValue placeholder="Sort by: Exch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exchange_rate">Sort by: Exchange rate</SelectItem>
              <SelectItem value="user_rating_average">Sort by: Rating</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative filter-dropdown-container">
            <button
              onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
              className="h-10 px-3 py-2 flex items-center justify-between rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-0 focus:border-[#000000] active:border-[#000000] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="text-sm">Filter by</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="ml-2"
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {isFilterPopupOpen && (
              <FilterPopup
                isOpen={isFilterPopupOpen}
                onClose={() => setIsFilterPopupOpen(false)}
                onApply={setFilterOptions}
                initialFilters={filterOptions}
              />
            )}
          </div>
        </div>
      </div>

      {/* Table Headers */}
      <div className="grid grid-cols-3 gap-4 mb-2 px-4">
        <div className="text-sm text-slate-600">Advertisers</div>
        <div className="text-sm text-slate-600">Rates</div>
        <div className="text-sm text-slate-600">Payment methods</div>
      </div>

      {/* Advertisers List */}
      <div>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent"></div>
            <p className="mt-2 text-slate-600">Loading ads...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">{error}</div>
        ) : adverts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            {searchQuery ? (
              <>
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-slate-400"
                  >
                    <path
                      d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-slate-800 mb-2">No results for "{searchQuery}"</h3>
                <p className="text-slate-600 text-center">
                  We couldn't find an advertiser with that nickname. Try a different name.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-xl font-medium text-slate-800">No ads available.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {adverts.map((ad) => (
              <div key={ad.id} className="border rounded-lg p-4 bg-white">
                <div className="grid grid-cols-3 gap-4">
                  {/* Advertiser */}
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm mr-2">
                        {(ad.user?.nickname?.charAt(0) || "M").toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleAdvertiserClick(ad.user?.id || 0)}
                            className="font-medium hover:underline cursor-pointer"
                          >
                            {ad.user?.nickname || "Mariana Rueda"}
                          </button>
                          {ad.user?.is_favourite && (
                            <span className="ml-2 px-2 py-0.5 border border-[#29823B] text-[#29823B] text-xs rounded-sm">
                              Following
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-slate-500 mb-2">
                      <span className="flex items-center">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-[#FFAD3A] mr-1"
                        >
                          <path
                            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                            fill="currentColor"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-[#FFAD3A]">{ad.user_rating_average?.toFixed(1) || "4.3"}</span>
                      </span>
                      <span className="mx-2">•</span>
                      <span>{ad.user?.completed_orders_count || "43"} orders</span>
                      <span className="mx-2">•</span>
                      <span>{ad.user?.completion_rate || "98"}% completion</span>
                    </div>
                  </div>

                  {/* Rates */}
                  <div>
                    <div className="text-lg font-bold mb-2">
                      IDR {ad.exchange_rate?.toLocaleString() || "14,600.00"}
                    </div>
                    <div className="text-sm mb-2">
                      Trade Limits: USD {ad.minimum_order_amount || "10.00"} -{" "}
                      {ad.actual_maximum_order_amount || "100.00"}
                    </div>
                    <div className="flex items-center text-xs text-slate-500">
                      <div className="flex items-center bg-slate-100 rounded-sm px-2 py-1">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-1"
                        >
                          <path
                            d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>{ad.order_expiry_period || "15"} min</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="flex flex-col justify-between">
                    <div className="flex flex-col gap-2">
                      {(ad.payment_method_names || ["Bank transfer", "Skrill", "PayPal"]).map((method, index) => (
                        <div key={index} className="flex items-center">
                          <div
                            className={`h-2 w-2 rounded-full mr-2 ${method.toLowerCase().includes("bank") ? "bg-green-500" : "bg-blue-500"}`}
                          ></div>
                          <span className="text-sm">{method}</span>
                        </div>
                      ))}
                    </div>

                    {USER.id != ad.user?.id && (
                      <Button
                        onClick={() => handleOrderClick(ad)}
                        className="mt-2 w-full bg-[#00C390] hover:bg-[#00B380] text-white"
                      >
                        Buy USD
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <OrderSidebar
        isOpen={isOrderSidebarOpen}
        onClose={() => setIsOrderSidebarOpen(false)}
        ad={selectedAd}
        orderType={activeTab}
      />
    </div>
  )
}
