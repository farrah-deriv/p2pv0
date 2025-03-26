import Navigation from "@/components/navigation"
import UserInfo from "@/components/profile/user-info"
import BusinessHours from "@/components/profile/business-hours"
import TradeLimits from "@/components/profile/trade-limits"
import StatsTabs from "./components/stats-tabs"

export default function ProfilePage() {
  // Mock data - in a real app, this would come from an API
  const userData = {
    username: "John_doe",
    rating: "Not rated yet",
    completionRate: "100%",
    joinDate: "Joined today",
    blockedCount: 2,
    realName: "Jonathan Nick Does",
    balance: 1234.56,
    isVerified: {
      id: true,
      address: true,
      phone: true,
    },
    businessHours: {
      isOpen: true,
      availability: "available 24/7",
    },
    tradeLimits: {
      buy: {
        current: 400,
        max: 500,
      },
      sell: {
        current: 180,
        max: 500,
      },
    },
    stats: {
      buyCompletion: { rate: "100% (50)", period: "(30d)" },
      sellCompletion: { rate: "100% (50)", period: "(30d)" },
      avgPayTime: { time: "5 min", period: "(30d)" },
      avgReleaseTime: { time: "5 min", period: "(30d)" },
      tradePartners: 10,
      totalOrders30d: 25,
      totalOrdersLifetime: 50,
      tradeVolume30d: { amount: "500.00", currency: "USD", period: "(30d)" },
      tradeVolumeLifetime: { amount: "1,000.00", currency: "USD" },
    },
  }

  return (
    <div className="px-4">
      <Navigation />

      <UserInfo
        username={userData.username}
        rating={userData.rating}
        completionRate={userData.completionRate}
        joinDate={userData.joinDate}
        blockedCount={userData.blockedCount}
        realName={userData.realName}
        isVerified={userData.isVerified}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <BusinessHours isOpen={userData.businessHours.isOpen} availability={userData.businessHours.availability} />

        <TradeLimits buyLimit={userData.tradeLimits.buy} sellLimit={userData.tradeLimits.sell} />
      </div>

      <StatsTabs stats={userData.stats} />
    </div>
  )
}

