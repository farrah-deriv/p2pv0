// Add isLoading prop to the interface
import { CustomShimmer } from "@/app/profile/components/ui/custom-shimmer"

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
  isLoading?: boolean // Add isLoading prop
}

// Update the function signature to include the isLoading parameter
export default function TradeLimits({ buyLimit, sellLimit, balance = 0, isLoading = false }: TradeLimitsProps) {
  const buyPercentage = (buyLimit.current / buyLimit.max) * 100
  const sellPercentage = (sellLimit.current / sellLimit.max) * 100

  return (
    <div className="border rounded-lg p-4">
      <div className="mb-6">
        <div className="flex justify-between">
          <div>
            <h3
              className="text-base font-normal mb-3"
              style={{ lineHeight: "24px", letterSpacing: "0%", verticalAlign: "middle" }}
            >
              P2P Balance
            </h3>
            {isLoading ? (
              <CustomShimmer className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-extrabold" style={{ lineHeight: "32px", letterSpacing: "0%" }}>
                USD {balance.toFixed(2)}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-end">
            <button className="bg-primary text-black font-bold py-2 px-6 rounded-full w-[124px] h-[48px]">
              Transfer
            </button>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3
          className="text-base font-normal mb-3"
          style={{ lineHeight: "24px", letterSpacing: "0%", verticalAlign: "middle" }}
        >
          Daily trade limit
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-green-600 font-bold text-sm" style={{ lineHeight: "20px", letterSpacing: "0%" }}>
                Buy
              </span>
              <span className="text-sm font-normal" style={{ lineHeight: "20px", letterSpacing: "0%" }}>
                USD {buyLimit.current.toFixed(2)} / {buyLimit.max.toFixed(2)}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-black rounded-full" style={{ width: `${buyPercentage}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-red-600 font-bold text-sm" style={{ lineHeight: "20px", letterSpacing: "0%" }}>
                Sell
              </span>
              <span className="text-sm font-normal" style={{ lineHeight: "20px", letterSpacing: "0%" }}>
                USD {sellLimit.current.toFixed(2)} / {sellLimit.max.toFixed(2)}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-black rounded-full" style={{ width: `${sellPercentage}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

