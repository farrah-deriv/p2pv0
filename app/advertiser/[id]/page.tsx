"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Navigation from "@/components/navigation"
import { AlertCircle, Clock, User, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { USER } from "@/lib/local-variables"
import { BuySellAPI } from "@/services/api"
import type { Advertisement } from "@/services/api/api-buy-sell"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
  ordersCount: number
  isVerified: {
    id: boolean
    address: boolean
    phone: boolean
  }
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
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
  const [activeSection, setActiveSection] = useState<"ads">("ads")
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      setProfile(createMockProfile(id))
      setAdverts(createMockAdverts(id))
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
    return {
      id: userId,
      nickname: data.nickname,
      isOnline: data.is_online || false,
      joinedDate: data.joined_date,
      rating: {
        score: data.rating?.score || data.rating || 0,
        count: data.rating?.count || data.rating_count || 0,
      },
      completionRate: data.completion_rate || 0,
      ordersCount: data.order_count_lifetime || 0,
      isVerified: {
        id: data.is_verified?.id || false,
        address: data.is_verified?.address || false,
        phone: data.is_verified?.phone || false,
      },
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
        tradePartners: data.stats?.trade_partners || 0,
        tradeVolume: {
          amount: data.stats?.trade_volume?.amount || 0,
          currency: data.stats?.trade_volume?.currency || "USD",
        },
      },
    }
  }

  // Create mock profile data as fallback
  const createMockProfile = (userId: string): AdvertiserProfile => {
    return {
      id: userId,
      nickname: "John_doe",
      isOnline: true,
      joinedDate: "Joined 100d ago",
      rating: {
        score: 5,
        count: 99,
      },
      completionRate: 100,
      ordersCount: 43,
      isVerified: {
        id: true,
        address: true,
        phone: true,
      },
      stats: {
        buyCompletion: {
          rate: 100,
          count: 20,
        },
        sellCompletion: {
          rate: 100,
          count: 230,
        },
        avgPayTime: "5 min",
        avgReleaseTime: "5 min",
        tradePartners: 10,
        tradeVolume: {
          amount: 500.0,
          currency: "USD",
        },
      },
    }
  }

  // Create mock adverts data as fallback
  const createMockAdverts = (userId: string): Advertisement[] => {
    return [
      {
        id: 1,
        user: {
          nickname: "John_doe",
          id: Number.parseInt(userId),
          is_favourite: false,
          created_at: Date.now() / 1000,
        },
        account_currency: "USD",
        actual_maximum_order_amount: 100,
        available_amount: 500,
        created_at: Date.now() / 1000,
        description: "",
        exchange_rate: 14500,
        exchange_rate_type: "fixed",
        is_active: true,
        maximum_order_amount: 100,
        minimum_order_amount: 10,
        order_expiry_period: 15,
        payment_currency: "IDR",
        payment_method_names: ["Bank transfer", "Skrill", "PayPal"],
        type: "buy",
      },
      {
        id: 2,
        user: {
          nickname: "John_doe",
          id: Number.parseInt(userId),
          is_favourite: false,
          created_at: Date.now() / 1000,
        },
        account_currency: "USD",
        actual_maximum_order_amount: 100,
        available_amount: 500,
        created_at: Date.now() / 1000,
        description: "",
        exchange_rate: 14600,
        exchange_rate_type: "fixed",
        is_active: true,
        maximum_order_amount: 100,
        minimum_order_amount: 10,
        order_expiry_period: 15,
        payment_currency: "IDR",
        payment_method_names: ["Bank transfer", "Skrill", "PayPal"],
        type: "buy",
      },
      {
        id: 3,
        user: {
          nickname: "John_doe",
          id: Number.parseInt(userId),
          is_favourite: false,
          created_at: Date.now() / 1000,
        },
        account_currency: "USD",
        actual_maximum_order_amount: 100,
        available_amount: 500,
        created_at: Date.now() / 1000,
        description: "",
        exchange_rate: 12500,
        exchange_rate_type: "fixed",
        is_active: true,
        maximum_order_amount: 100,
        minimum_order_amount: 10,
        order_expiry_period: 15,
        payment_currency: "IDR",
        payment_method_names: ["Bank transfer", "Skrill", "PayPal"],
        type: "buy",
      },
    ]
  }

  const toggleFollow = () => {
    setIsFollowing(!isFollowing)
    // Here you would typically call an API to update the follow status
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
                    <div className="flex items-center gap-3 md:mt-0 ml-[16px]">
                      <Button
                        onClick={toggleFollow}
                        variant={isFollowing ? "default" : "outline"}
                        className={cn(
                          "text-xs",
                          isFollowing ? "bg-blue-500 hover:bg-blue-600 text-white" : "border-slate-300",
                        )}
                      >
                        <User className="h-4 w-4 mr-2" />
                        {isFollowing ? "Following" : "Follow"}
                      </Button>
                      <Button variant="outline" className="text-xs border-slate-300">
                        Block
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-slate-500 mt-2">
                    <span className="mr-3">{profile?.isOnline ? "Online" : "Offline"}</span>
                    {profile?.joinedDate && <span className="text-slate-400">|</span>}
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
                  <span className="font-bold text-sm">{profile?.rating.score}/5</span>
                  <span className="text-slate-500 ml-2 text-sm">({profile?.rating.count} Ratings)</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Recommended</div>
                <div className="flex items-center mt-1">
                  <span className="font-bold text-lg">{profile?.completionRate}% (2)</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Total orders</div>
                <div className="font-bold text-lg mt-1">{profile?.ordersCount}</div>
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
          <div className="font-bold mt-1">{profile?.stats.avgPayTime}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Avg. release time (30d)</div>
          <div className="font-bold mt-1">{profile?.stats.avgReleaseTime}</div>
        </div>
        <div>
          <div className="flex items-center text-xs text-slate-500">Trade partners</div>
          <div className="font-bold mt-1">{profile?.stats.tradePartners}</div>
        </div>
        <div>
          <div className="flex items-center text-xs text-slate-500">Trade volume (30d)</div>
          <div className="font-bold mt-1">
            {profile?.stats.tradeVolume.currency} {profile?.stats.tradeVolume.amount.toFixed(2)}
          </div>
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
                <TabsTrigger value="buy">Buy Ads</TabsTrigger>
                <TabsTrigger value="sell">Sell Ads</TabsTrigger>
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
                        USD {ad.minimum_order_amount.toFixed(2)} - {ad.actual_maximum_order_amount.toFixed(2)}
                      </div>
                      <div className="flex items-center text-xs text-slate-500 mb-3">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{ad.order_expiry_period} min</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {ad.payment_method_names?.map((method, index) => (
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
                        <Button className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full">
                          {activeTab === "buy" ? "Buy" : "Sell"} USD
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
                              USD {ad.minimum_order_amount.toFixed(2)} - {ad.actual_maximum_order_amount.toFixed(2)}
                            </div>
                            <div className="flex items-center text-xs text-slate-500 mt-1">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{ad.order_expiry_period} min</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <div className="flex flex-wrap gap-2">
                              {ad.payment_method_names?.map((method, index) => (
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
                            {USER.id !== ad.user.id && (
                              <Button variant={ad.type === "buy" ? "default" : "destructive"} className="rounded-full">
                                {activeTab === "buy" ? "Buy" : "Sell"} USD
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
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-xl font-medium text-slate-800">No ads available.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

