import { Info } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  hasInfo?: boolean
}

function StatCard({ title, value, subtitle, hasInfo = false }: StatCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center text-sm text-gray-500 mb-1">
        {title}
        {hasInfo && <Info className="h-4 w-4 ml-1 text-gray-400" />}
      </div>
      <div className="text-xl font-bold">{value !== undefined && value !== null ? value : "N/A"}</div>
      {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
    </div>
  )
}

interface StatsGridProps {
  stats:
    | {
        buyCompletion: { rate: string; period: string }
        sellCompletion: { rate: string; period: string }
        avgPayTime: { time: string; period: string }
        avgReleaseTime: { time: string; period: string }
        tradePartners: number
        totalOrders30d: number
        totalOrdersLifetime: number
        tradeVolume30d: { amount: string; currency: string; period: string }
        tradeVolumeLifetime: { amount: string; currency: string }
      }
    | null
    | undefined // Allow null/undefined for stats
}

export default function StatsGrid({ stats }: StatsGridProps) {
  // Add a null check - if stats is null/undefined, provide default data
  const defaultStats = {
    buyCompletion: { rate: "N/A", period: "(30d)" },
    sellCompletion: { rate: "N/A", period: "(30d)" },
    avgPayTime: { time: "N/A", period: "(30d)" },
    avgReleaseTime: { time: "N/A", period: "(30d)" },
    tradePartners: 0,
    totalOrders30d: 0,
    totalOrdersLifetime: 0,
    tradeVolume30d: { amount: "0.00", currency: "USD", period: "(30d)" },
    tradeVolumeLifetime: { amount: "0.00", currency: "USD" },
  }

  // Use the stats object if it exists, otherwise use defaultStats
  const displayStats = stats || defaultStats

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
        <StatCard
          title={`Buy completion ${displayStats.buyCompletion.period}`}
          value={displayStats.buyCompletion.rate}
        />
        <StatCard
          title={`Sell completion ${displayStats.sellCompletion.period}`}
          value={displayStats.sellCompletion.rate}
        />
        <StatCard title={`Avg. pay time ${displayStats.avgPayTime.period}`} value={displayStats.avgPayTime.time} />
        <StatCard
          title={`Avg. release time ${displayStats.avgReleaseTime.period}`}
          value={displayStats.avgReleaseTime.time}
        />
        <StatCard title="Trade partners" value={displayStats.tradePartners} hasInfo={true} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title={`Total orders ${displayStats.buyCompletion.period}`} value={displayStats.totalOrders30d} />
        <StatCard title="Total orders (Lifetime)" value={displayStats.totalOrdersLifetime} />
        <StatCard
          title={`Trade volume ${displayStats.tradeVolume30d.period}`}
          value={`${displayStats.tradeVolume30d.currency} ${displayStats.tradeVolume30d.amount}`}
          hasInfo={true}
        />
        <StatCard
          title="Trade volume (Lifetime)"
          value={`${displayStats.tradeVolumeLifetime.currency} ${displayStats.tradeVolumeLifetime.amount}`}
          hasInfo={true}
        />
      </div>
    </div>
  )
}
