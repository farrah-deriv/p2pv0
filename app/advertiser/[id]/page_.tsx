"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Navigation from "@/components/navigation"
import { AlertCircle, Clock, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { USER } from "@/lib/local-variables"
import { BuySellAPI } from "@/services/api"
import type { Advertisement } from "@/services/api/api-buy-sell"
import { toggleFavouriteAdvertiser, toggleBlockAdvertiser } from "@/services/api/api-buy-sell"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import OrderSidebar from "@/components/buy-sell/order-sidebar"

interface AdvertiserProfile {
  id: string | number
  nickname: string
  isOnline: boolean
  joinedDate: string
  rating: {
    score: number
    count: number
  }
  completionRate: number
  order_count_lifetime: number
  isVerified: {
    id: boolean
    address: boolean
    phone: boolean
  }
  rating_average_lifetime: number
  recommend_average_lifetime: number
  buy_time_average_30day: number
  order_amount_lifetime: number
  release_time_average_30day: number
  stats: {
    buyCompletion: {
      rate: number
      count: number
    }
    sellCompletion: {
      rate: number
      count: number
    }
    avgPayTime: string
    avgReleaseTime: string
    tradePartners: number
    tradeVolume: {
      amount: number
      currency: string
    }
  }
}

export default function AdvertiserProfilePage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [profile, setProfile] = useState<AdvertiserProfile | null>(null)
  const [adverts, setAdverts] = useState<Advertisement[]>([])
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("sell")
  const [activeSection, setActiveSection] = useState<"ads">("ads")
  const [isFollowing, setIsFollowing] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [isBlockLoading, setIsBlockLoading] = useState(false)
  const [isOrderSidebarOpen, setIsOrderSidebarOpen] = useState(false)
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null)
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy")

  const fetchAdvertiserData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch advertiser profile
      const advertiserData = await BuySellAPI.getAdvertiserById(id)
      const transformedProfile = transformAdvertiserData(advertiserData.data, id)
      setProfile(transformedProfile)

      // Fetch advertiser's ads
      const advertiserAds = await BuySellAPI.getAdvertiserAds(id)
      setAdverts(advertiserAds)
    } catch (err) {
      console.error("Error fetching advertiser data:", err)
      setError("Failed to load advertiser profile. Please try again.")

      // If the API fails, use mock data as fallback
      setProfile(null)
      setAdverts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAdvertiserData()
  }, [id])

  // Update the transformAdvertiserData function to handle more cases
  const transformAdvertiserData = (data: any, userId: string): AdvertiserProfile => {
    // If the API returns data in the expected format, use it
    // Otherwise, transform it or use default values

    // Set the initial following state based on the API response
    setIsFollowing(data.is_favourite || false)
    setIsBlocked(data.is_blocked || false)

    return {
      id: userId,
      nickname: data.nickname || "Unknown",
      isOnline: data.is_online || false,
      joinedDate: data.joined_date || `Joined ${Math.floor(Math.random() * 365)} days ago`,
      rating: {
        score: data.rating?.score || data.rating || 0,
        count: data.rating?.count || data.rating_count || 0,
      },
      completionRate: data.completion_rate || 0,
      order_count_lifetime: data.order_count_lifetime || 0,
      rating_average_lifetime: data.rating_average_lifetime || 0,
      recommend_average_lifetime: data.recommend_average_lifetime || 0,
      isVerified: {
        id: data.is_verified?.id || false,
        address: data.is_verified?.address || false,
        phone: data.is_verified?.phone || false,
      },
      buy_time_average_30day: data.buy_time_average_30day || 0,
      order_amount_lifetime: data.order_amount_lifetime || 0,
      release_time_average_30day: data.release_time_average_30day || 0,
      stats: {
        buyCompletion: {
          rate: data.stats?.buy_completion?.rate || 0,
          count: data.stats?.buy_completion?.count || 0,
        },
        sellCompletion: {
          rate: data.stats?.sell_completion?.rate || 0,
          count: data.stats?.sell_completion?.count || 0,
        },
        avgPayTime: data.stats?.avg_pay_time || "N/A",
        avgReleaseTime: data.stats?.avg_release_time || "N/A",
        tradePartners: data.buy_amount_30days + data.sell_amount_30days || 0,
        tradeVolume: {
          amount: data.buy_amount_30days + data.sell_amount_30days || 0,
          currency: data.stats?.trade_volume?.currency || "USD",
        },
      },
    }
  }

  const toggleFollow = async () => {
    if (!profile) return

    setIsFollowLoading(true)
    try {
      // Call the API to toggle the favourite status
      const result = await toggleFavouriteAdvertiser(profile.id, !isFollowing)

      if (result.success) {
        // Update the UI state
        setIsFollowing(!isFollowing)
        console.log(result.message)
      } else {
        console.error("Failed to toggle follow status:", result.message)
      }
    } catch (error) {
      console.error("Error toggling follow status:", error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  const toggleBlock = async () => {
    if (!profile) return

    setIsBlockLoading(true)
    try {
      // Call the API to toggle the block status
      const result = await toggleBlockAdvertiser(profile.id, !isBlocked)

      if (result.success) {
        // Update the UI state
        setIsBlocked(!isBlocked)
        console.log(result.message)
      } else {
        console.error("Failed to toggle block status:", result.message)
      }
    } catch (error) {
      console.error("Error toggling block status:", error)
    } finally {
      setIsBlockLoading(false)
    }
  }

  const handleOrderClick = (ad: Advertisement, type: "buy" | "sell") => {
    setSelectedAd(ad)
    setOrderType(type)
    setIsOrderSidebarOpen(true)
  }

  if (isLoading) {
    return (
      <div className="px-4">
        <Navigation title="Back" isVisible={false} />
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent"></div>
          <p className="mt-2 text-slate-600">Loading advertiser...</p>
        </div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="text-center py-8">
          <p>{error}</p>
          <Button onClick={() => router.back()} className="mt-4 text-white">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const filteredAdverts = adverts.filter((ad) => (activeTab === "buy" ? ad.type === "buy" : ad.type === "sell"))

  const getDuration = (duration) => {
    if (duration == null || duration <= 0) return "-"
    if (duration > 60) return (duration / 60 / 60).toFixed(2).toString() + " min"
    return "< 1 min"
  }

  const CURRENT_USER = USER

  return (
    <div className="px-4">
      <Navigation title="Back" isVisible={false} />

      {/* Profile header */}
      <div className="flex flex-col md:flex-row justify-between">
        <div className="container mx-auto pb-6">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="flex-1">
              <div className="flex flex-row">
                <div className="relative mr-[16px]">
                  <div className="h-[40px] w-[40px] rounded-full bg-black flex items-center justify-center text-white font-bold text-lg">
                    {profile?.nickname.charAt(0).toUpperCase() || "?"}
                  </div>
                  {profile?.isOnline && (
                    <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white"></div>
                  )}
                </div>
                <div>
                  <div className="flex">
                    <h2 className="text-lg font-bold">{profile?.nickname}</h2>
                    {USER.id != profile?.id && (
                      <div className="flex items-center md:mt-0 ml-[16px]">
                        <Button
                          onClick={toggleFollow}
                          variant={isFollowing ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "text-xs",
                            isFollowing ? "bg-[#00D0FF] hover:bg-[#00D0FF] text-[#000]" : "border-slate-300",
                          )}
                          disabled={isFollowLoading}
                        >
                          {isFollowLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                          ) : (
                            <Image src="/icons/follow-icon.png" alt="Follow" width={16} height={16} className="mr-2" />
                          )}
                          {isFollowing ? "Following" : "Follow"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn("text-xs", isBlocked && "text-red-500")}
                          onClick={toggleBlock}
                          disabled={isBlockLoading}
                        >
                          {isBlockLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                          ) : null}
                          {isBlocked ? "Unblock" : "Block"}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-slate-500 mt-2">
                    <span className="mr-3">{profile?.isOnline ? "Online" : "Offline"}</span>
                    <span className="text-slate-400">|</span>
                    <span className="ml-3">{profile?.joinedDate}</span>
                  </div>
                </div>
              </div>

              {/* Verification badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                {profile?.isVerified.id && (
                  <div className="bg-green-50 text-green-800 px-3 py-1 rounded-full text-xs flex items-center">
                    <Check className="h-3 w-3 mr-1 text-green-600" />
                    ID
                  </div>
                )}
                {profile?.isVerified.address && (
                  <div className="bg-green-50 text-green-800 px-3 py-1 rounded-full text-xs flex items-center">
                    <Check className="h-3 w-3 mr-1 text-green-600" />
                    Address
                  </div>
                )}
                {profile?.isVerified.phone && (
                  <div className="bg-green-50 text-green-800 px-3 py-1 rounded-full text-xs flex items-center">
                    <Check className="h-3 w-3 mr-1 text-green-600" />
                    Phone number
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats section */}
        <div className="container mx-auto pb-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-slate-500">Rating</div>
                <div className="flex items-center mt-1">
                  <Image src="/icons/star-icon.png" alt="Star" width={20} height={20} className="mr-1" />
                  <span className="font-bold text-sm">{profile?.rating_average_lifetime}/5</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Recommended</div>
                <div className="flex items-center mt-1">
                  <span className="font-bold text-lg">{profile?.recommend_average_lifetime}%</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Total orders</div>
                <div className="font-bold text-lg mt-1">{profile?.order_count_lifetime}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 border border-[#E9ECEF] p-[16px] rounded-lg">
        <div>
          <div className="text-xs text-slate-500">Buy completion (30d)</div>
          <div className="font-bold mt-1">
            {profile?.stats.buyCompletion.rate}% ({profile?.stats.buyCompletion.count})
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Sell completion (30d)</div>
          <div className="font-bold mt-1">
            {profile?.stats.sellCompletion.rate}% ({profile?.stats.sellCompletion.count})
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Avg. pay time (30d)</div>
          <div className="font-bold mt-1">{getDuration(profile?.buy_time_average_30day)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Avg. release time (30d)</div>
          <div className="font-bold mt-1">{getDuration(profile?.release_time_average_30day)}</div>
        </div>
        <div>
          <div className="flex items-center text-xs text-slate-500">Trade partners</div>
          <div className="font-bold mt-1">{profile?.stats.tradePartners}</div>
        </div>
        <div>
          <div className="flex items-center text-xs text-slate-500">Trade volume (30d)</div>
          <div className="font-bold mt-1">{`USD ${profile?.stats.tradeVolume.amount}`}</div>
        </div>
      </div>

      {/* Tabs section */}
      <div className="container mx-auto pb-6 hidden">
        <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as "ads")} className="border-b">
          <TabsList className="bg-transparent border-b-0 p-0 h-auto">
            <TabsTrigger
              value="ads"
              className="px-4 py-3 text-sm font-medium border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 data-[state=inactive]:border-transparent data-[state=inactive]:text-slate-500 rounded-none"
            >
              Online ads
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeSection === "ads" && (
        <>
          {/* Buy/Sell tabs */}
          <div className="container mx-auto pb-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "buy" | "sell")}>
              <TabsList>
                <TabsTrigger value="sell">Buy Ads</TabsTrigger>
                <TabsTrigger value="buy">Sell Ads</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Ads list */}
          <div className="container mx-auto pb-8">
            {filteredAdverts.length > 0 ? (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredAdverts.map((ad) => (
                    <div key={ad.id} className="border rounded-lg p-4 bg-white">
                      <div className="text-lg font-bold mb-2">
                        IDR {ad.exchange_rate.toLocaleString()}
                        {ad.exchange_rate_type === "floating" && (
                          <span className="text-xs text-slate-500 ml-1">0.1%</span>
                        )}
                      </div>

                      <div className="mb-2">
                        USD {ad.minimum_order_amount} - {ad.actual_maximum_order_amount}
                      </div>
                      <div className="flex items-center text-xs text-slate-500 mb-3">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{ad.order_expiry_period} min</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {ad.payment_methods?.map((method, index) => (
                          <div key={index} className="flex items-center">
                            <div
                              className={`h-2 w-2 rounded-full mr-1 ${method.toLowerCase().includes("bank")
                                ? "bg-green-500"
                                : method.toLowerCase().includes("skrill")
                                  ? "bg-blue-500"
                                  : "bg-yellow-500"
                                }`}
                            ></div>
                            <span className="text-sm">{method}</span>
                          </div>
                        ))}
                      </div>

                      {USER.id !== ad.user.id && (
                        <Button
                          size="sm"
                          onClick={() => handleOrderClick(ad, activeTab === "buy" ? "buy" : "sell")}
                          className="rounded-full bg-[#00C390] hover:bg-[#00B380]"
                        >
                          {activeTab === "buy" ? "Sell" : "Buy"} {ad.account_currency}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader className="border-b sticky top-0 bg-white">
                      <TableRow className="text-sm">
                        <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">Rates</TableHead>
                        <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">Order limits</TableHead>
                        <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">
                          Payment methods
                        </TableHead>
                        <TableHead className="text-right py-4 px-4"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white divide-y divide-slate-200 font-normal text-sm">
                      {filteredAdverts.map((ad) => (
                        <TableRow key={ad.id}>
                          <TableCell className="py-4 px-4">
                            <div className="font-bold">IDR {ad.exchange_rate.toLocaleString()}</div>
                            {ad.exchange_rate_type === "floating" && <div className="text-xs text-slate-500">0.1%</div>}
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <div>
                              USD {ad.minimum_order_amount} - {ad.actual_maximum_order_amount}
                            </div>
                            <div className="flex items-center text-xs text-slate-500 mt-1">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{ad.order_expiry_period} min</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <div className="flex flex-wrap gap-2">
                              {ad.payment_methods?.map((method, index) => (
                                <div key={index} className="flex items-center">
                                  <div
                                    className={`h-2 w-2 rounded-full mr-1 ${method.toLowerCase().includes("bank")
                                      ? "bg-green-500"
                                      : method.toLowerCase().includes("skrill")
                                        ? "bg-blue-500"
                                        : "bg-yellow-500"
                                      }`}
                                  ></div>
                                  <span className="text-sm">{method}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4 text-right">
                            {CURRENT_USER.id != ad.user.id && (
                              <Button
                                variant={ad.type === "buy" ? "destructive" : "secondary"}
                                size="sm"
                                onClick={() => handleOrderClick(ad, ad.type === "buy" ? "buy" : "sell")}
                              >
                                {activeTab === "buy" ? "Sell" : "Buy"} {ad.account_currency}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-xl font-medium text-slate-800">No ads available.</p>
              </div>
            )}
          </div>
        </>
      )}
      <OrderSidebar
        isOpen={isOrderSidebarOpen}
        onClose={() => setIsOrderSidebarOpen(false)}
        ad={selectedAd}
        orderType={orderType}
      />
    </div>
  )
}
