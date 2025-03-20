interface TradeLimitsProps {
  buyLimit: {
    current: number
    max: number
  }
  sellLimit: {
    current: number
    max: number
  }
}

export default function TradeLimits({ buyLimit, sellLimit }: TradeLimitsProps) {
  const buyPercentage = (buyLimit.current / buyLimit.max) * 100
  const sellPercentage = (sellLimit.current / sellLimit.max) * 100

  return (
    <div className="border rounded-lg p-4 mb-6">
      <h3 className="font-medium mb-4">Daily trade limit</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-primary font-medium">Buy</span>
            <span className="text-sm">
              USD {buyLimit.current.toFixed(2)} / {buyLimit.max.toFixed(2)}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${buyPercentage}%` }}></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-secondary font-medium">Sell</span>
            <span className="text-sm">
              USD {sellLimit.current.toFixed(2)} / {sellLimit.max.toFixed(2)}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-secondary rounded-full" style={{ width: `${sellPercentage}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

