"use client"

import { useState, useEffect } from "react"
import { Star, Check, Info } from "lucide-react"
import { USER } from "@/lib/local-variables"

interface UserInfoProps {
  username: string
  rating: string
  completionRate: string
  joinDate: string
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
  realName,
  isVerified,
}: UserInfoProps) {
  const [nickname, setNickname] = useState(username)

  useEffect(() => {
    try {
      if (USER && USER.nickname) {
        setNickname(USER.nickname)
      }
    } catch (error) {
      console.error("Error accessing user data:", error)
    }
  }, [username, rating, completionRate, joinDate, realName, isVerified])

  return (
    <div className="mb-8 w-fit max-w-3xl">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xl">
          {nickname.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{nickname}</h2>
          <div className="flex items-center mt-1 text-sm">
            {rating && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-warning-icon mr-1" />
                <span className="text-slate-600">{rating}</span>
              </div>
            )}

            {rating && completionRate && <div className="mx-4 h-4 w-px bg-slate-300"></div>}

            {completionRate && (
              <div className="flex items-center text-slate-600">
                <Check className="h-4 w-4 text-primary mr-1" />
                <span>{completionRate}</span>
                <Info className="h-4 w-4 ml-1 text-slate-400" />
              </div>
            )}

            {completionRate && joinDate && <div className="mx-4 h-4 w-px bg-slate-300"></div>}

            {joinDate && <div className="text-slate-600">{joinDate}</div>}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {isVerified.id && (
              <div className="bg-success-bg text-success px-3 h-[24px] rounded-[4px] text-xs flex items-center">
                <Check className="h-3 w-3 mr-1 text-success" />
                ID
              </div>
            )}
            {isVerified.address && (
              <div className="bg-success-bg text-success px-3 h-[24px] rounded-[4px] text-xs flex items-center">
                <Check className="h-3 w-3 mr-1 text-success" />
                Address
              </div>
            )}
            {isVerified.phone && (
              <div className="bg-success-bg text-success px-3 h-[24px] rounded-[4px] text-xs flex items-center">
                <Check className="h-3 w-3 mr-1 text-success" />
                Phone number
              </div>
            )}
            <div className="bg-success-bg text-success px-3 h-[24px] rounded-[4px] text-xs flex items-center">
              <Check className="h-3 w-3 mr-1 text-success" />
              Email
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
