"use client"

import { useState, useEffect } from "react"
import { Star, Check, Info } from "lucide-react"
import { USER } from "@/lib/local-variables"

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
    email?: boolean
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
  const [nickname, setNickname] = useState(username)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    console.log("UserInfo props received:", {
      username,
      rating,
      completionRate,
      joinDate,
      blockedCount,
      realName,
      isVerified,
    })

    try {
      if (USER && USER.nickname) {
        console.log("Using nickname from local variables:", USER.nickname)
        setNickname(USER.nickname)
      } else {
        console.log("No nickname found in local variables, using prop:", username)
      }
    } catch (error) {
      console.error("Error accessing user data:", error)
    }

    // Log rendering values
    if (rating) console.log("Rendering rating:", rating)
    else console.log("Rating not available or is default")

    if (completionRate) console.log("Rendering completion rate:", completionRate)
    else console.log("Completion rate not available or is default")

    if (joinDate) console.log("Rendering join date:", joinDate)
    else console.log("Join date not available or is default")

    if (blockedCount > 0) console.log("Rendering blocked count:", blockedCount)
    else console.log("Blocked count not available or is zero")
  }, [username, rating, completionRate, joinDate, blockedCount, realName, isVerified])

  return (
    <div className="mb-8 w-fit max-w-3xl">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-xl">
          {nickname.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{nickname}</h2>
          <div className="flex items-center mt-1 text-sm">
            {rating && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span className="text-gray-700">{rating}</span>
              </div>
            )}

            {rating && completionRate && <div className="mx-4 h-4 w-px bg-gray-300"></div>}

            {completionRate && (
              <div className="flex items-center text-gray-700">
                <Check className="h-4 w-4 text-primary mr-1" />
                <span>{completionRate}</span>
                <Info className="h-4 w-4 ml-1 text-gray-400" />
              </div>
            )}

            {completionRate && joinDate && <div className="mx-4 h-4 w-px bg-gray-300"></div>}

            {joinDate && <div className="text-gray-700">{joinDate}</div>}

            {joinDate && blockedCount > 0 && <div className="mx-4 h-4 w-px bg-gray-300"></div>}

            {blockedCount > 0 && <div className="text-gray-700">Blocked by: {blockedCount}</div>}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {isVerified.id && (
              <div className="bg-[#EAF3EB] text-[#29823B] px-3 h-[24px] rounded-[4px] text-xs flex items-center">
                <Check className="h-3 w-3 mr-1 text-[#29823B]" />
                ID
              </div>
            )}
            {isVerified.address && (
              <div className="bg-[#EAF3EB] text-[#29823B] px-3 h-[24px] rounded-[4px] text-xs flex items-center">
                <Check className="h-3 w-3 mr-1 text-[#29823B]" />
                Address
              </div>
            )}
            {isVerified.phone && (
              <div className="bg-[#EAF3EB] text-[#29823B] px-3 h-[24px] rounded-[4px] text-xs flex items-center">
                <Check className="h-3 w-3 mr-1 text-[#29823B]" />
                Phone number
              </div>
            )}
            <div className="bg-[#EAF3EB] text-[#29823B] px-3 h-[24px] rounded-[4px] text-xs flex items-center">
              <Check className="h-3 w-3 mr-1 text-[#29823B]" />
              Email
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



