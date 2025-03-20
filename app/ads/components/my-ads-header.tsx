"use client"

import { useRouter } from "next/navigation"

interface MyAdsHeaderProps {
  hasAds: boolean
  isMobile?: boolean // Make isMobile optional
}

export default function MyAdsHeader({ hasAds, isMobile }: MyAdsHeaderProps) {
  const router = useRouter()

  // Don't render anything if there are no ads
  // This component is now only for additional controls when ads exist
  if (!hasAds) {
    return null
  }

  // Return an empty container without the button
  // The button is already being rendered in the parent component
  return (
    <div className="mt-4 mb-6">
      <div className="container mx-auto">{/* Button removed to prevent duplication */}</div>
    </div>
  )
}

