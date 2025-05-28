import { Info } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  hasInfo?: boolean
}

function StatCard({ title, value, hasInfo = false }: StatCardProps) {
  return (
    <div className="py-6">
      <div className="text-slate-500 mb-2 font-normal text-sm leading-5 tracking-normal">
        {title}
        {hasInfo && <Info className="inline-block h-3 w-3 ml-1 text-slate-400" />}
      </div>
      <div className="font-bold text-black text-base leading-6 tracking-normal">
        {value !== undefined && value !== null ? value : "N/A"}
      </div>
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
  | undefined
}

export default function StatsGrid({ stats }: StatsGridProps) {
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

  const displayStats = stats || defaultStats

  return (
    <div className="bg-custom-gray rounded-lg px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-200">
        <StatCard
          title={`Buy completion ${displayStats.buyCompletion.period}`}
          value={displayStats.buyCompletion.rate}
        />
        <StatCard
          title={`Sell completion ${displayStats.sellCompletion.period}`}
          value={displayStats.sellCompletion.rate}
        />
        <StatCard title="Trade partners" value={displayStats.tradePartners} hasInfo={true} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 border-b border-slate-200">
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
        <StatCard title={`Avg. pay time ${displayStats.avgPayTime.period}`} value={displayStats.avgPayTime.time} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3">
        <StatCard title={`Total orders ${displayStats.buyCompletion.period}`} value={displayStats.totalOrders30d} />
        <StatCard title="Total orders (Lifetime)" value={displayStats.totalOrdersLifetime} />
        <StatCard
          title={`Avg. release time ${displayStats.avgReleaseTime.period}`}
          value={displayStats.avgReleaseTime.time}
        />
      </div>
    </div>
  )
}
