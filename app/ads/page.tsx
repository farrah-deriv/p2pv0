"use client"

import { useEffect, useState } from "react"
import Navigation from "@/components/navigation"
import MyAdsTable from "./components/my-ads-table"
import MyAdsHeader from "./components/my-ads-header"
import StatusModal from "@/components/ui/status-modal"
import { getUserAdverts } from "./api/api-ads"
import { USER } from "@/lib/local-variables"
import { Check, PlusCircle } from "lucide-react"
import type { MyAd, SuccessData } from "./types"
import MobileMyAdsList from "./components/mobile-my-ads-list"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AdsPage() {
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
  const [showUpdatedBanner, setShowUpdatedBanner] = useState(false)
  const isMobile = useIsMobile()
  const router = useRouter()

  // Add error modal state
  const [errorModal, setErrorModal] = useState({
    show: false,
    title: "Error",
    message: "",
  })

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

      // Show error modal
      setErrorModal({
        show: true,
        title: "Error Loading Ads",
        message: err instanceof Error ? err.message : "Failed to load ads. Please try again later.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAdUpdated = (status?: string) => {
    console.log("Ad updated (deleted or status changed), refreshing list...")
    fetchAds()

    if (status === "deleted") {
      setShowDeletedBanner(true)
      setTimeout(() => {
        setShowDeletedBanner(false)
      }, 3000)
    }
  }

  useEffect(() => {
    const checkForSuccessData = () => {
      try {
        const creationDataStr = localStorage.getItem("adCreationSuccess")
        if (creationDataStr) {
          const successData = JSON.parse(creationDataStr) as SuccessData
          setSuccessModal({
            show: true,
            type: successData.type,
            id: successData.id,
          })
          localStorage.removeItem("adCreationSuccess")
        }

        const updateDataStr = localStorage.getItem("adUpdateSuccess")
        if (updateDataStr) {
          setShowUpdatedBanner(true)
          setTimeout(() => {
            setShowUpdatedBanner(false)
          }, 3000)
          localStorage.removeItem("adUpdateSuccess")
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

  const handleCloseErrorModal = () => {
    setErrorModal((prev) => ({ ...prev, show: false }))
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Fixed header section */}
      <div className="flex-none">
        <Navigation />
      </div>

      {/* Fixed success banners - Updated with container class and rounded corners */}
      {showDeletedBanner && (
        <div className="fixed top-4 left-0 right-0 z-50 flex justify-center">
          <div className="container mx-auto px-4">
            <div className="bg-green-600 text-white py-3 px-4 rounded-lg flex items-center justify-center max-w-[600px] mx-auto">
              <Check className="h-5 w-5 mr-2" />
              <span>Ad deleted</span>
            </div>
          </div>
        </div>
      )}

      {showUpdatedBanner && (
        <div className="fixed top-4 left-0 right-0 z-50 flex justify-center">
          <div className="container mx-auto px-4">
            <div className="bg-green-600 text-white py-3 px-4 rounded-lg flex items-center justify-center max-w-[600px] mx-auto">
              <Check className="h-5 w-5 mr-2" />
              <span>Ad updated successfully</span>
            </div>
          </div>
        </div>
      )}

      {/* Fixed controls section */}
      <div className="flex-none container mx-auto px-4">
        <MyAdsHeader hasAds={ads.length > 0} />
        <Button onClick={() => router.push("/ads/create")} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Ad
        </Button>
      </div>

      {/* Content area with fixed table header and scrollable body */}
      <div className="flex-1 overflow-hidden container mx-auto px-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent"></div>
            <p className="mt-2 text-gray-600">Loading your ads...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : isMobile ? (
          <MobileMyAdsList
            ads={ads.map((ad) => ({
              id: ad.id,
              type: ad.type,
              rate: ad.rate,
              limits: `${ad.limits.currency} ${ad.limits.min.toFixed(2)} - ${ad.limits.max.toFixed(2)}`,
              available: ad.available,
              paymentMethods: ad.paymentMethods,
              status: ad.status,
              description: "",
            }))}
            onAdDeleted={handleAdUpdated}
          />
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
              description: "",
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

      {errorModal.show && (
        <StatusModal
          type="error"
          title={errorModal.title}
          message={errorModal.message}
          onClose={handleCloseErrorModal}
        />
      )}
    </div>
  )
}

