"use client"

import { useState, useEffect, useRef } from "react"
import { calculateTimeRemaining, type TimeRemaining } from "@/lib/time-utils"

export function useTimeRemaining(expiresAt: string) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(calculateTimeRemaining(expiresAt))
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
      const updateTimeRemaining = () => {
      const newTimeRemaining = calculateTimeRemaining(expiresAt)
      setTimeRemaining(newTimeRemaining)
      
      if (newTimeRemaining.isExpired && intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    updateTimeRemaining()

    if (!timeRemaining.isExpired) {
          intervalRef.current = setInterval(updateTimeRemaining, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [expiresAt])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return timeRemaining
}
