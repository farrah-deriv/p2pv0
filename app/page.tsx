"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
// Update the import for Advertisement type
import type { Advertisement } from "@/services/api/api-buy-sell"
import { BuySellAPI } from "@/services/api"
import { debounce } from "lodash"

export default function BuySellPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
  const [currency, setCurrency] = useState("IDR")
  const [paymentMethod, setPaymentMethod] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [adverts, setAdverts] = useState<Advertisement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAdverts()
  }, [activeTab, currency, paymentMethod, searchQuery])

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
      }
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
      setSearchQuery(query)
      fetchAdverts()
    }, 300),
    [fetchAdverts],
  )

  const handleAdvertiserClick = (userId: number) => {
    router.push(`/advertiser/${userId}`)
  }

  return (
    <>
      <Navigation />

      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Buy/Sell Toggle */}
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              className={`px-4 sm:px-6 py-2 rounded-md text-sm font-medium ${
                activeTab === "buy" ? "bg-white shadow-sm" : "text-gray-500"
              }`}
              onClick={() => setActiveTab("buy")}
            >
              Buy
            </button>
            <button
              className={`px-4 sm:px-6 py-2 rounded-md text-sm font-medium ${
                activeTab === "sell" ? "bg-white shadow-sm" : "text-gray-500"
              }`}
              onClick={() => setActiveTab("sell")}
            >
              Sell
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3">
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

            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Payment (All)</SelectItem>
                <SelectItem value="Bank transfer">Bank transfer</SelectItem>
                <SelectItem value="Neteller">Neteller</SelectItem>
                <SelectItem value="PayPal">PayPal</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-grow w-full sm:w-auto sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                className="pl-10 w-full"
                placeholder="Enter nickname"
                onChange={(e) => debouncedFetchAdverts(e.target.value)}
              />
            </div>

            <Select defaultValue="Exchange rate">
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Exchange rate">Sort by: Exchange rate</SelectItem>
                <SelectItem value="Completion">Sort by: Completion</SelectItem>
                <SelectItem value="Rating">Sort by: Rating</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="All">
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Filter by</SelectItem>
                <SelectItem value="Following">Following</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Advertisers Table */}
      <div>
        {isLoading ? (
          <div className="text-center py-8">Loading ads...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : adverts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-xl font-medium text-gray-800">No ads available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr className="text-xs sm:text-sm text-gray-500">
                  <th className="text-left py-3 px-4 font-medium">Advertisers</th>
                  <th className="text-left py-3 px-4 font-medium">Rates</th>
                  <th className="text-left py-3 px-4 font-medium">Order limits</th>
                  <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Payment methods</th>
                  <th className="text-right py-3 px-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adverts.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-xl mr-3">
                          {(ad.user?.nickname || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <button
                              onClick={() => handleAdvertiserClick(ad.user?.id || 0)}
                              className="font-medium hover:text-red-500 hover:underline cursor-pointer"
                            >
                              {ad.user?.nickname || "Unknown"}
                            </button>
                            {ad.user?.is_favourite && (
                              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                Following
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-gray-500">
                            {ad.user.user_rating_average && (
                              <span className="flex items-center">
                                <span className="text-yellow-500 mr-1">★</span>
                                ad.user.user_rating_average
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-medium">
                      {ad.payment_currency} {ad.exchange_rate?.toFixed(2) || "N/A"}
                    </td>
                    <td className="py-4 px-4">
                      <div>{`${ad.account_currency} ${ad.minimum_order_amount?.toFixed(2) || "N/A"} - ${
                        ad.actual_maximum_order_amount?.toFixed(2) || "N/A"
                      }`}</div>
                      <div className="flex items-center text-xs sm:text-sm text-gray-500">
                        <svg
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-1"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {ad.order_expiry_period} min
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">{ad.payment_method_names?.join(", ") || "-"}</td>
                    <td className="py-4 px-4 text-right">
                      <Button className="bg-red-500 hover:bg-red-600 text-white rounded-full text-xs sm:text-sm">
                        {ad.type === "buy" ? "Sell" : "Buy"} {ad.account_currency}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

