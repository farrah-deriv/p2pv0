"use client"

import { useEffect } from "react"
import { initDatadog } from "@/lib/datadog"

export function DatadogRumInit() {

  useEffect(() => {
    initDatadog()
  }, [])

  return null
}
