"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import { Star, Clock, Info, MoreVertical, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { USER } from "@/lib/local-variables"
import { BuySellAPI } from "@/services/api"
import type { Advertisement } from "@/services/api/api-buy-sell"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"

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
        payment_method_names: ["Bank transfer", "Neteller", "PayPal"],
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
        payment_method_names: ["Bank transfer", "Neteller", "PayPal"],
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
        payment_method_names: ["Bank transfer", "Neteller", "PayPal"],
        type: "buy",
      },
    ]
  }

  if (isLoading) {
    return (
      <div className="px-4">
        <Navigation title="Advertiser's page" isVisible={false} />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid  border-r-transparent"></div>
            <p className="mt-2 text-slate-600">Loading advertiser...</p>
          </div>
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
      <Navigation title="Advertiser's page" isVisible={false} />
      <div className="container mx-auto pb-8">
        {/* Profile header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xl">
            {profile?.nickname.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{profile?.nickname}</h2>
                <div className="flex items-center text-sm text-slate-500">
                  <span className="mr-3">{profile?.isOnline ? "Online" : "Offline"}</span>
                  <span>{profile?.joinedDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-slate-100">
                  <MoreVertical className="h-5 w-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="font-medium">{profile?.rating.score}/5</span>
                <span className="text-slate-500 ml-1">({profile?.rating.count} Ratings)</span>
              </div>
              <div className="flex items-center text-slate-700">
                <span className="text-green-600 font-medium mr-1">{profile?.completionRate}%</span>
                <Info className="h-4 w-4 text-slate-400" />
              </div>
              <div className="text-slate-700">{profile?.ordersCount} Orders</div>
            </div>

            {/* Verification badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {profile?.isVerified.id && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs flex items-center">
                  <span className="mr-1">✓</span>
                  ID
                </div>
              )}
              {profile?.isVerified.address && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs flex items-center">
                  <span className="mr-1">✓</span>
                  Address
                </div>
              )}
              {profile?.isVerified.phone && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs flex items-center">
                  <span className="mr-1">✓</span>
                  Phone number
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 bg-white p-4 rounded-lg border">
          <div>
            <div className="text-sm text-slate-500">Buy completion (30d)</div>
            <div className="font-bold">
              {profile?.stats.buyCompletion.rate}% ({profile?.stats.buyCompletion.count})
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Sell completion (30d)</div>
            <div className="font-bold">
              {profile?.stats.sellCompletion.rate}% ({profile?.stats.sellCompletion.count})
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Avg. pay time (30d)</div>
            <div className="font-bold">{profile?.stats.avgPayTime}</div>
          </div>
          <div>
            <div className="text-sm text-slate-500">Avg. release time (30d)</div>
            <div className="font-bold">{profile?.stats.avgReleaseTime}</div>
          </div>
          <div>
            <div className="flex items-center text-sm text-slate-500">
              Trade partners
              <Info className="h-4 w-4 ml-1 text-slate-400" />
            </div>
            <div className="font-bold">{profile?.stats.tradePartners}</div>
          </div>
          <div>
            <div className="flex items-center text-sm text-slate-500">
              Trade volume (30d)
              <Info className="h-4 w-4 ml-1 text-slate-400" />
            </div>
            <div className="font-bold">
              {profile?.stats.tradeVolume.currency} {profile?.stats?.tradeVolume?.amount?.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Ads tabs */}
        <div className="mb-6">
          <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as "buy" | "sell")}>
            <TabsList>
              <TabsTrigger value="buy">Buy Ads</TabsTrigger>
              <TabsTrigger value="sell">Sell Ads</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Ads table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">Rates</TableHead>
                <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">Limits</TableHead>
                <TableHead className="text-left py-4 px-4 text-slate-600 font-normal">Payment methods</TableHead>
                <TableHead className="text-right py-4 px-4 text-slate-600 font-normal"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-slate-200 font-normal text-sm">
              {filteredAdverts.length > 0 ? (
                filteredAdverts.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell className="py-4 px-4">
                      <div className="font-bold">
                        IDR {ad.exchange_rate.toLocaleString("en-US", { minimumFractionDigits: 4 })}
                      </div>
                      {ad.exchange_rate_type === "floating" && <div className="text-xs text-slate-500">0.1%</div>}
                    </TableCell>
                    <TableCell className="py-4 px-4">
                      <div>
                        USD {ad.minimum_order_amount.toFixed(2)} - {ad.actual_maximum_order_amount.toFixed(2)}
                      </div>
                      <div className="flex items-center text-xs text-slate-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {ad.order_expiry_period} min
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-4">{ad.payment_method_names?.join(", ")}</TableCell>
                    <TableCell className="py-4 px-4 text-right">
                      {USER.id !== ad.user.id && (
                        <Button size="sm">
                          {ad.type === "buy" ? "Buy" : "Sell"} {ad.account_currency}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <AlertCircle className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-lg font-medium text-slate-900">No ads available.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

