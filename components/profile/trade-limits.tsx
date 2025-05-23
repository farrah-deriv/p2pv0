import { CustomShimmer } from "@/app/profile/components/ui/custom-shimmer"
import { Button } from "@/components/ui/button"

interface TradeLimitsProps {
  buyLimit: {
    current: number
    max: number
  }
  sellLimit: {
    current: number
    max: number
  }
  balance?: number
  isLoading?: boolean
  userData?: any // Add userData prop to accept the API response
}

export default function TradeLimits({
  buyLimit,
  sellLimit,
  balance = 0,
  isLoading = false,
  userData, // Accept userData from parent component
}: TradeLimitsProps) {
  // Use API data if available, otherwise fall back to props
  const userBalance = userData?.balances?.USD ?? balance
  const buyMax = userData?.daily_limits?.buy ?? buyLimit.max
  const buyRemaining = userData?.daily_limits_remaining?.buy ?? buyLimit.current
  const sellMax = userData?.daily_limits?.sell ?? sellLimit.max
  const sellRemaining = userData?.daily_limits_remaining?.sell ?? sellLimit.current

  // Calculate percentages based on API data if available
  const buyPercentage = (buyRemaining / buyMax) * 100
  const sellPercentage = (sellRemaining / sellMax) * 100

  return (
    <div className="border rounded-lg p-4">
      <div className="mb-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-base font-normal mb-3 leading-6 tracking-normal">P2P Balance</h3>
            {isLoading ? (
              <CustomShimmer className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-extrabold leading-8 tracking-normal">USD {userBalance.toFixed(2)}</div>
            )}
          </div>
          <div className="flex flex-col justify-end">
            <Button variant="cyan" size="pill" className="w-[124px] h-[48px] font-bold">
              Transfer
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-base font-normal mb-3 leading-6 tracking-normal">Daily trade limit</h3>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-buy font-bold text-sm leading-5 tracking-normal">Buy</span>
              <span className="text-sm font-normal leading-5 tracking-normal">
                USD {buyRemaining.toFixed(2)} / {buyMax.toFixed(2)}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full bg-black rounded-full w-[${buyPercentage}%]`}></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sell font-bold text-sm leading-5 tracking-normal">Sell</span>
              <span className="text-sm font-normal leading-5 tracking-normal">
                USD {sellRemaining.toFixed(2)} / {sellMax.toFixed(2)}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full bg-black rounded-full w-[${sellPercentage}%]`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
