import { Star, Check, Info } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface UserInfoProps {
  username: string
  rating: string
  completionRate: string
  joinDate: string
  blockedCount: number
  realName: string
  isVerified: {
    id: boolean
    address: boolean
    phone: boolean
  }
}

export default function UserInfo({
  username,
  rating,
  completionRate,
  joinDate,
  blockedCount,
  realName,
  isVerified,
}: UserInfoProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-xl">
          {username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{username}</h2>
          <div className="flex items-center gap-4 mt-1 text-sm">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-gray-700">{rating}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Check className="h-4 w-4 text-green-500 mr-1" />
              <span>{completionRate}</span>
              <Info className="h-4 w-4 ml-1 text-gray-400" />
            </div>
            <div className="text-gray-700">{joinDate}</div>
            <div className="text-gray-700">Blocked by: {blockedCount}</div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {isVerified.id && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs flex items-center">
                <Check className="h-3 w-3 mr-1" />
                ID
              </div>
            )}
            {isVerified.address && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs flex items-center">
                <Check className="h-3 w-3 mr-1" />
                Address
              </div>
            )}
            {isVerified.phone && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs flex items-center">
                <Check className="h-3 w-3 mr-1" />
                Phone number
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm text-gray-700">Show my real name</div>
            <div className="text-xs text-gray-500">{realName}</div>
          </div>
          <Switch />
        </div>
      </div>
    </div>
  )
}

