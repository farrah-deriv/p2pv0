"use client"

import { useState, useEffect } from "react"
import Navigation from "@/components/navigation"
import UserInfo from "@/components/profile/user-info"
import BusinessHours from "@/components/profile/business-hours"
import TradeLimits from "@/components/profile/trade-limits"
import StatsTabs from "./components/stats-tabs"
import { USER, API, AUTH } from "@/lib/local-variables"

export default function ProfilePage() {
  const [userData, setUserData] = useState({
    username: "John_doe",
    rating: "Not rated yet",
    completionRate: "100%",
    joinDate: "Joined today",
    blockedCount: 2,
    realName: "Jonathan Nick Does",
    balance: 1234.56,
    isVerified: {
      id: true,
      address: true,
      phone: true,
    },
    businessHours: {
      isOpen: true,
      availability: "available 24/7",
    },
    tradeLimits: {
      buy: {
        current: 400,
        max: 500,
      },
      sell: {
        current: 180,
        max: 500,
      },
    },
    stats: {
      buyCompletion: { rate: "100% (50)", period: "(30d)" },
      sellCompletion: { rate: "100% (50)", period: "(30d)" },
      avgPayTime: { time: "5 min", period: "(30d)" },
      avgReleaseTime: { time: "5 min", period: "(30d)" },
      tradePartners: 10,
      totalOrders30d: 25,
      totalOrdersLifetime: 50,
      tradeVolume30d: { amount: "500.00", currency: "USD", period: "(30d)" },
      tradeVolumeLifetime: { amount: "1,000.00", currency: "USD" },
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
        console.log("User data API response:", responseData)

        if (responseData && responseData.data) {
          const data = responseData.data

          // Convert timestamp to date string
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

          // Update user data with the retrieved information
          setUserData((prevData) => ({
            ...prevData,
            username: data.nickname || prevData.username,
            rating: data.rating_average_lifetime !== null ? `${data.rating_average_lifetime}/5` : "Not rated yet",
            completionRate: `${data.completion_average_30day || 0}%`,
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
            balance: data.balances?.USD || 0,
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
      <Navigation />

      <UserInfo
        username={userData.username}
        rating={userData.rating}
        completionRate={userData.completionRate}
        joinDate={userData.joinDate}
        blockedCount={userData.blockedCount}
        realName={userData.realName}
        isVerified={userData.isVerified}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <BusinessHours isOpen={userData.businessHours.isOpen} availability={userData.businessHours.availability} />

        <TradeLimits buyLimit={userData.tradeLimits.buy} sellLimit={userData.tradeLimits.sell} />
      </div>

      <StatsTabs stats={userData.stats} />
    </div>
  )
}
