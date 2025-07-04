"use client"

import { useState, useEffect } from "react"
import { USER } from "@/lib/local-variables"
import Image from "next/image"

interface UserInfoProps {
  username: string
  rating: string
  recommendedAverage: string
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
  recommendedAverage,
  joinDate,
  blockedCount,
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
  }, [username, rating, completionRate, joinDate, blockedCount, realName, isVerified])

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
                <Image src="/icons/custom-star-icon.png" alt="Star rating" width={16} height={16} className="mr-1" />
                {rating > 0 ? <span className="text-slate-600">{rating}</span> : <span className="text-slate-600">Not rated yet</span>}
              </div>
              <div className="mx-4 h-4 w-px bg-slate-300"></div>
            )}
            {recommendedAverage && (
              <div className="flex items-center text-slate-600">
                <Image
                  src="/icons/custom-check-icon.png"
                  alt="Recommended"
                  width={16}
                  height={16}
                  className="mr-1"
                />
                <span>{recommendedAverage} (Recommended)</span>
              </div>
              <div className="mx-4 h-4 w-px bg-slate-300"></div>
            )}
            {joinDate && <div className="text-slate-600">{joinDate}</div>}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {isVerified.id && (
              <div className="bg-success-bg text-success px-3 h-[24px] rounded-[4px] text-xs flex items-center">
                <Image src="/icons/custom-check-icon.png" alt="Verified" width={12} height={12} className="mr-1" />
                ID
              </div>
            )}
            {isVerified.address && (
              <div className="bg-success-bg text-success px-3 h-[24px] rounded-[4px] text-xs flex items-center">
                <Image src="/icons/custom-check-icon.png" alt="Verified" width={12} height={12} className="mr-1" />
                Address
              </div>
            )}
            {isVerified.phone && (
              <div className="bg-success-bg text-success px-3 h-[24px] rounded-[4px] text-xs flex items-center">
                <Image src="/icons/custom-check-icon.png" alt="Verified" width={12} height={12} className="mr-1" />
                Phone number
              </div>
            )}
            <div className="bg-success-bg text-success px-3 h-[24px] rounded-[4px] text-xs flex items-center">
              <Image src="/icons/custom-check-icon.png" alt="Verified" width={12} height={12} className="mr-1" />
              Email
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
