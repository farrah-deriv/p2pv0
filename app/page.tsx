"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, AlertCircle, Clock, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { USER } from "@/lib/local-variables"
import type { Advertisement } from "@/services/api/api-buy-sell"
import { BuySellAPI } from "@/services/api"
import { debounce } from "lodash"
import FilterPopup, { type FilterOptions } from "@/components/buy-sell/filter-popup"
import OrderSidebar from "@/components/buy-sell/order-sidebar"
import MobileFooterNav from "@/components/mobile-footer-nav"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function BuySellPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
  const [currency, setCurrency] = useState("IDR")
  const [paymentMethod, setPaymentMethod] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("exchange_rate")
  const [adverts, setAdverts] = useState<Advertisement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    fromFollowing: false,
  })
  const [isBalanceInfoOpen, setIsBalanceInfoOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const filterButtonRef = useRef<HTMLDivElement>(null)

  // Add state for order sidebar
  const [isOrderSidebarOpen, setIsOrderSidebarOpen] = useState(false)
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null)

  useEffect(() => {
    fetchAdverts()
  }, [activeTab, currency, paymentMethod, searchQuery, sortBy, filterOptions])

  // Update the fetchAdverts function to ensure adverts is always an array
  const fetchAdverts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: BuySellAPI.SearchParams = {
        type: activeTab,
        currency: currency,
        paymentMethod: paymentMethod !== "All" ? paymentMethod : undefined,
        nickname: searchQuery,
        sortBy: sortBy,
      }

      // Apply additional filters
      if (filterOptions.fromFollowing) {
        // Use favourites_only: 1 parameter for the API
        params.favourites_only = 1
      }
      // Note: withinLimits would typically be handled by the backend

      const data = await BuySellAPI.getAdvertisements(params)

      // Ensure data is an array before setting it
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
    debounce((query: string) => {
      fetchAdverts()
    }, 300),
    [activeTab, currency, paymentMethod, fetchAdverts],
  )

  const handleAdvertiserClick = (userId: number) => {
    router.push(`/advertiser/${userId}`)
  }

  // Handle opening the order sidebar
  const handleOrderClick = (ad: Advertisement) => {
    setSelectedAd(ad)
    setIsOrderSidebarOpen(true)
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
    <>
      <Navigation />

      {/* Main content with padding for mobile footer */}
      <div className="pb-20 md:pb-0">
        {/* Buy/Sell Toggle - Mobile Style */}
        <div className="mb-6">
          <div className="flex flex-row justify-between items-center gap-4">
            {/* Buy/Sell Toggle */}
            <Tabs
              defaultValue={activeTab}
              onValueChange={(value) => setActiveTab(value as "buy" | "sell")}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="buy">Buy</TabsTrigger>
                <TabsTrigger value="sell">Sell</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Mobile Filter Controls */}
            <div className="md:hidden grid grid-cols-2 gap-2">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDR">IDR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Payment (All)</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="PayPal">PayPal</SelectItem>
                  <SelectItem value="Neteller">Neteller</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Search and Filter Buttons */}
            <div className="md:hidden grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="flex items-center justify-center h-10 rounded-md border border-input bg-background px-3"
              >
                <Search className="h-4 w-4 mr-2" />
                <span>Search</span>
              </button>

              <div ref={filterButtonRef} className="relative filter-dropdown-container">
                <button
                  onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
                  className="flex items-center justify-center w-full h-10 rounded-md border border-input bg-background px-3"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  <span>Filter</span>
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

            {/* Mobile Search Input (conditionally shown) */}
            {isSearchOpen && (
              <div className="md:hidden relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  className="pl-10 w-full"
                  placeholder="Enter nickname"
                  onChange={(e) => {
                    const value = e.target.value
                    setSearchQuery(value)
                    debouncedFetchAdverts(value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      fetchAdverts()
                    }
                  }}
                />
              </div>
            )}

            {/* Desktop Filters Row */}
            <div className="hidden md:flex flex-wrap gap-3">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-full sm:w-[100px]">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDR">IDR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-grow w-full sm:w-auto sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  className="pl-10 w-full"
                  placeholder="Enter nickname"
                  onChange={(e) => {
                    const value = e.target.value
                    setSearchQuery(value)
                    debouncedFetchAdverts(value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      fetchAdverts()
                    }
                  }}
                />
              </div>

              <Select defaultValue="exchange_rate" onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exchange_rate">Sort by: Exchange rate</SelectItem>
                  <SelectItem value="user_rating_average">Sort by: Rating</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-[150px] filter-dropdown-container">
                <button
                  onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
                  className="w-full h-10 px-3 py-2 flex items-center justify-between rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="text-sm">Filter by</span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 opacity-50"
                  >
                    <path
                      d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819C5.10753 6.24392 5.39245 6.24392 5.56819 6.06819L7.49999 4.13638L9.43179 6.06819C9.60753 6.24392 9.89245 6.24392 10.0682 6.06819C10.2439 5.89245 10.2439 5.60753 10.0682 5.43179L7.81819 3.18179C7.73379 3.0974 7.61933 3.04999 7.49999 3.04999C7.38064 3.04999 7.26618 3.0974 7.18179 3.18179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.39245 10.2439 9.10753 10.0682 8.93179C9.89245 8.75606 9.60753 8.75606 9.43179 8.93179L7.49999 10.8636L5.56819 8.93179C5.39245 8.75606 5.10753 8.75606 4.93179 8.93179C4.75605 9.10753 4.75605 9.39245 4.93179 9.56819L7.18179 11.8182C7.26618 11.9026 7.38064 11.95 7.49999 11.95C7.61933 11.95 7.73379 11.9026 7.81819 11.8182L10.0682 9.56819Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    ></path>
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
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-xl font-medium text-slate-800">No ads available.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {adverts.map((ad) => (
                  <div key={ad.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center mb-2">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xl mr-3">
                        {(ad.user?.nickname || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleAdvertiserClick(ad.user?.id || 0)}
                            className="font-medium hover:underline cursor-pointer"
                          >
                            {ad.user?.nickname || "Unknown"}
                          </button>
                          {ad.user?.is_favourite && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                              Following
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-slate-500">
                          {ad.user.user_rating_average && (
                            <span className="flex items-center">
                              <span className="text-yellow-500 mr-1">★</span>
                              {ad.user.user_rating_average}
                            </span>
                          )}
                          <span className="mx-2">•</span>
                          <span>{ad.user.completed_orders_count || 0} orders</span>
                          <span className="mx-2">•</span>
                          <span>{ad.user.completion_rate || 0}% completion</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-lg font-bold my-2">
                      {ad.account_currency} 1.00 = {ad.payment_currency}{" "}
                      {ad.exchange_rate
                        ? ad.exchange_rate.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : "N/A"}
                    </div>

                    <div className="text-sm mb-2">
                      Limits: {ad.account_currency} {ad.minimum_order_amount?.toFixed(2) || "N/A"} -{" "}
                      {ad.actual_maximum_order_amount?.toFixed(2) || "N/A"}
                    </div>

                    <div className="flex items-center text-sm text-slate-500 mb-3">
                      <Clock className="h-4 w-4 mr-1" />
                      {ad.order_expiry_period} min
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-slate-600">{ad.payment_method_names?.join(" | ") || "-"}</div>

                      {USER.id != ad.user.id && (
                        <Button size="sm" onClick={() => handleOrderClick(ad)}>
                          {ad.type === "buy" ? "Buy" : "Sell"} {ad.account_currency}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="border-b">
                    <tr className="text-sm">
                      <th className="text-left py-4 px-4 font-bold">Advertisers</th>
                      <th className="text-left py-4 px-4 font-bold">Rates</th>
                      <th className="text-left py-4 px-4 font-bold">Order limits</th>
                      <th className="text-left py-4 px-4 font-bold hidden sm:table-cell">Payment methods</th>
                      <th className="text-right py-4 px-4 font-bold"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200 font-normal text-sm">
                    {adverts.map((ad) => (
                      <tr key={ad.id} className="hover:bg-slate-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xl mr-3">
                              {(ad.user?.nickname || "U").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center">
                                <button
                                  onClick={() => handleAdvertiserClick(ad.user?.id || 0)}
                                  className="hover:underline cursor-pointer"
                                >
                                  {ad.user?.nickname || "Unknown"}
                                </button>
                                {ad.user?.is_favourite && (
                                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                    Following
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center text-xs sm:text-sm text-slate-500">
                                {ad.user.user_rating_average && (
                                  <span className="flex items-center">
                                    <span className="text-yellow-500 mr-1">★</span>
                                    {ad.user.user_rating_average}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold">
                          {ad.payment_currency}{" "}
                          {ad.exchange_rate
                            ? ad.exchange_rate.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "N/A"}
                        </td>
                        <td className="py-4 px-4">
                          <div>{`${ad.account_currency} ${ad.minimum_order_amount?.toFixed(2) || "N/A"} - ${
                            ad.actual_maximum_order_amount?.toFixed(2) || "N/A"
                          }`}</div>
                          <div className="flex items-center text-xs sm:text-sm text-slate-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {ad.order_expiry_period} min
                          </div>
                        </td>
                        <td className="py-4 px-4 hidden sm:table-cell">{ad.payment_method_names?.join(", ") || "-"}</td>
                        <td className="py-4 px-4 text-right">
                          {USER.id != ad.user.id && (
                            <Button
                              size="sm"
                              onClick={() => handleOrderClick(ad)}
                            >
                              {ad.type === "buy" ? "Buy" : "Sell"} {ad.account_currency}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Footer Navigation */}
      <MobileFooterNav />

      {/* Order Sidebar */}
      <OrderSidebar
        isOpen={isOrderSidebarOpen}
        onClose={() => setIsOrderSidebarOpen(false)}
        ad={selectedAd}
        orderType={activeTab}
      />
    </>
  )
}

