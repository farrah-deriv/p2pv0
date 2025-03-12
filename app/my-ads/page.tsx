"use client"

import { useEffect, useState } from "react"
import Navigation from "@/components/navigation"
import MyAdsTable from "@/components/my-ads/my-ads-table"
import MyAdsHeader from "@/components/my-ads/my-ads-header"
import StatusModal from "@/components/ui/status-modal"
import { getUserAdverts, type MyAd } from "@/services/api/api-my-ads"
import { USER } from "@/lib/local-variables"
import { Check } from "lucide-react"

interface SuccessData {
  type: string
  id: string
}

export default function MyAdsPage() {
  const [ads, setAds] = useState<MyAd[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successModal, setSuccessModal] = useState<{
    show: boolean
    type: string
    id: string
  }>({
    show: false,
    type: "",
    id: "",
  })
  const [showDeletedBanner, setShowDeletedBanner] = useState(false)

  const fetchAds = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log(`Fetching adverts for user ID: ${USER.id}`)
      const userAdverts = await getUserAdverts()
      console.log("User adverts response:", userAdverts)

      setAds(userAdverts)
    } catch (err) {
      console.error("Error fetching ads:", err)
      setError("Failed to load ads. Please try again later.")
      setAds([])
    } finally {
      setLoading(false)
    }
  }

  const handleAdUpdated = () => {
    console.log("Ad updated (deleted or status changed), refreshing list...")
    fetchAds()

    if (arguments[0] === "deleted") {
      setShowDeletedBanner(true)
      setTimeout(() => {
        setShowDeletedBanner(false)
      }, 3000)
    }
  }

  useEffect(() => {
    const checkForSuccessData = () => {
      try {
        const successDataStr = localStorage.getItem("adCreationSuccess")
        if (successDataStr) {
          const successData = JSON.parse(successDataStr) as SuccessData
          setSuccessModal({
            show: true,
            type: successData.type,
            id: successData.id,
          })
          localStorage.removeItem("adCreationSuccess")
        }
      } catch (err) {
        console.error("Error checking for success data:", err)
      }
    }

    fetchAds().then(() => {
      checkForSuccessData()
    })
  }, [])

  const handleCloseSuccessModal = () => {
    setSuccessModal((prev) => ({ ...prev, show: false }))
  }

  return (
    <>
      <Navigation />

      {showDeletedBanner && (
        <div className="fixed top-0 left-0 right-0 bg-green-600 text-white py-4 z-50 flex items-center justify-center">
          <div className="flex items-center">
            <Check className="h-5 w-5 mr-2" />
            <span>Ad deleted</span>
          </div>
        </div>
      )}

      <div>
        <MyAdsHeader hasAds={ads.length > 0} />

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading your ads...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <MyAdsTable
            ads={ads.map((ad) => ({
              id: ad.id,
              type: ad.type,
              rate: ad.rate,
              limits: `${ad.limits.currency} ${ad.limits.min.toFixed(2)} - ${ad.limits.max.toFixed(2)}`,
              available: ad.available,
              paymentMethods: ad.paymentMethods,
              status: ad.status,
            }))}
            onAdDeleted={handleAdUpdated}
          />
        )}
      </div>

      {successModal.show && (
        <StatusModal
          type="success"
          title="Ad created"
          message="You've successfully created Ad!"
          subMessage="If your ad doesn't receive an order within 3 days, it will be deactivated."
          onClose={handleCloseSuccessModal}
        />
      )}
    </>
  )
}

