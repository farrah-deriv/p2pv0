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
      <div className="text-xl font-bold">{value}</div>
      {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
    </div>
  )
}

interface StatsGridProps {
  stats: {
    buyCompletion: { rate: string; period: string }
    sellCompletion: { rate: string; period: string }
    avgPayTime: { time: string; period: string }
    avgReleaseTime: { time: string; period: string }
    tradePartners: number
    totalOrders30d: number
    totalOrdersLifetime: number
    tradeVolume30d: { amount: string; currency: string }
    tradeVolumeLifetime: { amount: string; currency: string }
  }
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
        <StatCard title={`Buy completion ${stats.buyCompletion.period}`} value={stats.buyCompletion.rate} />
        <StatCard title={`Sell completion ${stats.sellCompletion.period}`} value={stats.sellCompletion.rate} />
        <StatCard title={`Avg. pay time ${stats.avgPayTime.period}`} value={stats.avgPayTime.time} />
        <StatCard title={`Avg. release time ${stats.avgReleaseTime.period}`} value={stats.avgReleaseTime.time} />
        <StatCard title="Trade partners" value={stats.tradePartners} hasInfo={true} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title={`Total orders ${stats.buyCompletion.period}`} value={stats.totalOrders30d} />
        <StatCard title="Total orders (Lifetime)" value={stats.totalOrdersLifetime} />
        <StatCard
          title={`Trade volume ${stats.tradeVolume30d.period}`}
          value={`${stats.tradeVolume30d.currency} ${stats.tradeVolume30d.amount}`}
          hasInfo={true}
        />
        <StatCard
          title="Trade volume (Lifetime)"
          value={`${stats.tradeVolumeLifetime.currency} ${stats.tradeVolumeLifetime.amount}`}
          hasInfo={true}
        />
      </div>
    </div>
  )
}

