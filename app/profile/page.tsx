"use client"

import { useState, useEffect } from "react"
import UserInfo from "@/components/profile/user-info"
import TradeLimits from "@/components/profile/trade-limits"
import StatsTabs from "./components/stats-tabs"
import { USER, API, AUTH } from "@/lib/local-variables"

export default function ProfilePage() {
  const [userData, setUserData] = useState({
    username:"",
    rating: "Not rated yet",
    completionRate: "",
    recommend_average_lifetime:"",
    joinDate: "",
    realName: "",
    isVerified: {
      id: false,
      address: false,
    },
    tradeLimits: {
      buy: {
        current: 0,
        max: 0,
      },
      sell: {
        current: 0,
        max: 0,
      },
    },
    stats: {
      buyCompletion: { rate: "", period: "" },
      sellCompletion: { rate:"", period: "" },
      avgPayTime: { time: "", period: "" },
      avgReleaseTime: { time: "", period: "" },
      tradePartners: 0,
      totalOrders30d: 0,
      totalOrdersLifetime: 0,
      tradeVolume30d: { amount: "", currency: "", period: "" },
      tradeVolumeLifetime: { amount: "", currency: "" },
    },
  })

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = USER.id
        const url = `${API.baseUrl}/users/${userId}`

        const response = await fetch(url, {
          headers: {
            ...AUTH.getAuthHeader(),
            accept: "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`)
        }

        const responseData = await response.json()

        if (responseData && responseData.data) {
          const data = responseData.data

          const joinDate = new Date(data.created_at)
          const now = new Date()
          const diff = now.getTime() - joinDate.getTime()
          const days = Math.floor(diff / (1000 * 60 * 60 * 24))

          let joinDateString
          if (days === 0) {
            joinDateString = "Joined today"
          } else if (days === 1) {
            joinDateString = "Joined yesterday"
          } else {
            joinDateString = `Joined ${days} days ago`
          }

          setUserData((prevData) => ({
            ...prevData,
            username: data.nickname || prevData.username,
            rating: data.rating_average_lifetime !== null ? `${data.rating_average_lifetime}/5` : "Not rated yet",
            completionRate: `${data.completion_average_30day || 0}%`,
            recommendedAverage: data.recommend_average_lifetime
            joinDate: joinDateString,
            tradeLimits: {
              buy: {
                current: data.daily_limits_remaining?.buy || 0,
                max: data.daily_limits?.buy || 0,
              },
              sell: {
                current: data.daily_limits_remaining?.sell || 0,
                max: data.daily_limits?.sell || 0,
              },
            },
          }))
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [])

  return (
    <div className="px-4 md:px-4">
      <UserInfo
        username={userData.username}
        rating={userData.rating}
        recommendedAverage={userData.recommendedAverage}
        joinDate={userData.joinDate}
        blockedCount={userData.blockedCount}
        realName={userData.realName}
        isVerified={userData.isVerified}
      />
      <TradeLimits buyLimit={userData.tradeLimits.buy} sellLimit={userData.tradeLimits.sell} />
      <StatsTabs stats={userData.stats} />
    </div>
  )
}
