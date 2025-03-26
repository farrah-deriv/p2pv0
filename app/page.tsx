"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AlertCircle, ArrowLeft } from "lucide-react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"

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
  }, [activeTab, currency, paymentMethod, sortBy, filterOptions])

  // Update the fetchAdverts function to ensure adverts is always an array
  const fetchAdverts = async (query = null) => {
    setIsLoading(true)
    setError(null)
    try {
      const params: BuySellAPI.SearchParams = {
        type: activeTab,
        currency: currency,
        paymentMethod: paymentMethod !== "All" ? paymentMethod : undefined,
        nickname: query !== null ? query : searchQuery,
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
    debounce(() => {
      fetchAdverts()
    }, 300),
    [activeTab, currency, paymentMethod, sortBy, filterOptions, searchQuery],
  )

  const handleAdvertiserClick = (userId: number) => {
    router.push(`/advertiser/${userId}`)
  }

  // Handle opening the order sidebar
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
    <div className="flex flex-col h-screen overflow-hidden px-4">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0">
        {/* Desktop Navigation */}
        {!isSearchOpen && <Navigation title="P2P Wallet" />}

        {/* Buy/Sell Toggle and Filters - Fixed */}
        <div className="mb-4 md:mb-6 md:flex justify-between items-center">
          {!isSearchOpen && (
            <div className="flex flex-row justify-between items-center gap-4">
              {/* Buy/Sell Toggle */}
              <Tabs
                defaultValue={activeTab}
                onValueChange={(value) => setActiveTab(value as "buy" | "sell")}
                className="w-full"
              >
                <TabsList className="w-full md:min-w-3xs">
                  <TabsTrigger className="w-full md:w-auto" value="buy">
                    Buy
                  </TabsTrigger>
                  <TabsTrigger className="w-full md:w-auto" value="sell">
                    Sell
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Responsive Filters Row */}
          <div className="flex flex-wrap gap-2 md:gap-3 md:px-0 mt-4 md:mt-0">
            {!isSearchOpen && (
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="flex-1 md:flex-none w-auto">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDR">IDR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            )}

            <div className="hidden md:block relative flex-grow w-full sm:w-auto sm:max-w-md">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-M1TMmjYwGjHFhjLbq4bbWyCgHduG6y.png"
                  alt="Search"
                  width={24}
                  height={24}
                />
              </div>
              <Input
                className="pl-10 w-full"
                placeholder="Enter nickname"
                onChange={(e) => {
                  const value = e.target.value
                  setSearchQuery(value)
                  if (value.trim() === "") {
                    // If search is empty, fetch all adverts
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

            {!isSearchOpen && (
              <button
                className="md:hidden border rounded-md p-1 flex-shrink-0"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-M1TMmjYwGjHFhjLbq4bbWyCgHduG6y.png"
                  alt="Search"
                  width={24}
                  height={24}
                />
              </button>
            )}

            <div className="hidden md:block">
              <Select defaultValue="exchange_rate" onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exchange_rate">Sort by: Exchange rate</SelectItem>
                  <SelectItem value="user_rating_average">Sort by: Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative filter-dropdown-container flex-shrink-0">
              {!isSearchOpen && (
                <button
                  onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
                  className="h-10 px-3 py-2 md:w-[150px] flex items-center justify-between rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:border-[#000000] active:border-[#000000] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="text-sm hidden md:inline">Filter by</span>
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-MaTVHgyEEk1geuXl77pbxjPzcQzTkb.png"
                    alt="Dropdown"
                    width={15}
                    height={15}
                    className="h-4 w-4 opacity-70 md:inline"
                  />
                </button>
              )}
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
            <div className="md:hidden flex">
              <div
                href="/"
                className="flex items-center text-slate-1400"
                onClick={() => {
                  setIsSearchOpen(false)
                  setSearchQuery(null)
                }}
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
              </div>
              <div className="relative w-full">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-M1TMmjYwGjHFhjLbq4bbWyCgHduG6y.png"
                    alt="Search"
                    width={24}
                    height={24}
                  />
                </div>
                <Input
                  className="pl-10 w-full focus:ring-0 focus:border-[#000000] focus:outline-none"
                  placeholder="Enter nickname"
                  onChange={(e) => {
                    const value = e.target.value
                    setSearchQuery(value)
                    if (value.trim() === "") {
                      // If search is empty, fetch all adverts
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
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-4">
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
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {adverts.map((ad) => (
                  <div key={ad.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center mb-3">
                      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm mr-2">
                        {(ad.user?.nickname?.charAt(0) || "U").toUpperCase()}
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
                            <span className="ml-2 px-2 py-0.5 border border-[#29823B] text-[#29823B]text-xs rounded-sm">
                              Following
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center text-xs text-slate-500 mb-2">
                      {ad.user.rating_average && (
                        <span className="flex items-center">
                          <Image
                            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-6OumZ18zNMtAEyxgeIh25pHnlCud1B.png"
                            alt="Rating"
                            width={16}
                            height={16}
                            className="mr-1"
                          />
                          <span className="text-[#FFAD3A]">{ad.user.rating_average.toFixed(1)}</span>
                        </span>
                      )}
                      {ad.user.completed_orders_count > 0 && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{ad.user.completed_orders_count} orders</span>
                        </>
                      )}

                      {ad.user.completion_rate > 0 && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{ad.user.completion_rate}% completion</span>
                        </>
                      )}
                    </div>

                    <div className="text-lg font-bold mb-2">
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

                    <div className="flex items-center text-xs text-slate-500 mb-3 mt-1">
                      <div className="flex items-center bg-slate-100 rounded-sm px-2 py-1">
                        <Image
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-yvSdAuwjE496WbipvfAqwVr5jalzr4.png"
                          alt="Clock"
                          width={12}
                          height={12}
                          className="mr-1"
                        />
                        <span>{ad.order_expiry_period} min</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex flex-wrap gap-2">
                        {ad.payment_method_names?.map((method, index) => (
                          <div key={index} className="flex items-center">
                            <div
                              className={`h-2 w-2 rounded-full mr-2 ${method.toLowerCase().includes("bank") ? "bg-green-500" : "bg-blue-500"
                                }`}
                            ></div>
                            <span className="text-sm">{method}</span>
                          </div>
                        ))}
                      </div>

                      {USER.id != ad.user.id && (
                        <Button
                          size="sm"
                          onClick={() => handleOrderClick(ad)}
                          className="rounded-full bg-[#00C390] hover:bg-[#00B380]"
                        >
                          {ad.type === "buy" ? "Buy" : "Sell"} {ad.account_currency}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="border-b sticky top-0 bg-white">
                    <TableRow className="text-sm">
                      <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">Advertisers</TableHead>
                      <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">Rates</TableHead>
                      <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">Order limits</TableHead>
                      <TableHead className="text-left py-4 px-4 text-slate-600 hidden sm:table-cell font-normal">
                        Payment methods
                      </TableHead>
                      <TableHead className="text-right py-4 px-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white divide-y divide-slate-200 font-normal text-sm">
                    {adverts.map((ad) => (
                      <TableRow key={ad.id}>
                        <TableCell className="py-4 px-4">
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
                                  <span className="ml-2 px-2 py-0.5 border border-[#29823B]  text-[#29823B] text-xs rounded-sm">
                                    Following
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center text-xs sm:text-sm text-slate-500">
                                {ad.user.rating_average && (
                                  <span className="flex items-center">
                                    <Image
                                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-6OumZ18zNMtAEyxgeIh25pHnlCud1B.png"
                                      alt="Rating"
                                      width={16}
                                      height={16}
                                      className="mr-1"
                                    />
                                    <span className="text-[#FFAD3A]">{ad.user.rating_average.toFixed(1)}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 font-bold">
                          {ad.payment_currency}{" "}
                          {ad.exchange_rate
                            ? ad.exchange_rate.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                            : "N/A"}
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div>{`${ad.account_currency} ${ad.minimum_order_amount?.toFixed(2) || "N/A"} - ${ad.actual_maximum_order_amount?.toFixed(2) || "N/A"
                            }`}</div>
                          <div className="flex items-center text-xs text-slate-500 mt-1">
                            <div className="flex items-center bg-slate-100 rounded-sm px-2 py-1">
                              <Image
                                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-yvSdAuwjE496WbipvfAqwVr5jalzr4.png"
                                alt="Clock"
                                width={12}
                                height={12}
                                className="mr-1"
                              />
                              <span>{ad.order_expiry_period} min</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 sm:table-cell">
                          <div className="flex flex-wrap gap-2">
                            {ad.payment_method_names?.map((method, index) => (
                              <div key={index} className="flex items-center">
                                <div
                                  className={`h-2 w-2 rounded-full mr-2 ${method.toLowerCase().includes("bank") ? "bg-green-500" : "bg-blue-500"
                                    }`}
                                ></div>
                                <span className="text-sm">{method}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right">
                          {USER.id != ad.user.id && (
                            <Button
                              variant={ad.type === "buy" ? "default" : "destructive"}
                              size="sm"
                              onClick={() => handleOrderClick(ad)}
                            >
                              {ad.type === "buy" ? "Buy" : "Sell"} {ad.account_currency}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">
        <MobileFooterNav />
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

