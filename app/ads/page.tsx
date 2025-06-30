"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import MyAdsTable from "./components/my-ads-table"
import MyAdsHeader from "./components/my-ads-header"
import { getUserAdverts, type MyAd } from "@/services/api/api-my-ads"
import { Plus } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { StatusBanner } from "@/components/ui/status-banner"
import StatusModal from "./components/ui/status-modal"
import StatusBottomSheet from "./components/ui/status-bottom-sheet"
import MobileMyAdsList from "./components/mobile-my-ads-list"
import type { SuccessData } from "./types"

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
  const [showUpdatedBanner, setShowUpdatedBanner] = useState(false)
  const isMobile = useIsMobile()
  const router = useRouter()

  const [errorModal, setErrorModal] = useState({
    show: false,
    title: "Error",
    message: "",
  })

  const fetchAds = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedAds = await getUserAdverts()
      console.log("Fetched ads in page:", fetchedAds)
      setAds(fetchedAds)
    } catch (err) {
      console.error("Error fetching ads:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch ads")
    } finally {
      setLoading(false)
    }
  }

  const handleAdDeleted = (status?: string) => {
    if (status === "deleted") {
      console.log("Ad deleted successfully")
      setShowDeletedBanner(true)
      setTimeout(() => {
        setShowDeletedBanner(false)
      }, 3000)
    }
    // Refresh the ads list
    fetchAds()
  }

  const handleAdUpdated = (status?: string) => {
    console.log("Ad updated (deleted or status changed), refreshing list...")
    fetchAds()

    if (status === "updated") {
      setShowUpdatedBanner(true)
      setTimeout(() => {
        setShowUpdatedBanner(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your ads...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {showDeletedBanner && (
        <StatusBanner variant="success" message="Ad deleted" onClose={() => setShowDeletedBanner(false)} />
      )}

      {showUpdatedBanner && (
        <StatusBanner variant="success" message="Ad updated successfully" onClose={() => setShowUpdatedBanner(false)} />
      )}

      <div className="flex-none container mx-auto pr-4">
        <MyAdsHeader hasAds={ads.length > 0} />
        {/* Only show button here on desktop */}
        {ads.length > 0 && !isMobile && (
          <Button
            onClick={() => router.push("/ads/create")}
            variant="cyan"
            size="pill"
            className="font-extrabold text-base leading-4 tracking-[0%] text-center mb-6"
          >
            <Plus className="h-5 w-5" />
            Create ad
          </Button>
        )}
      </div>

      {/* Floating button for mobile view */}
      {ads.length > 0 && isMobile && (
        <div className="fixed bottom-20 right-4 z-10">
          <Button
            onClick={() => router.push("/ads/create")}
            variant="cyan"
            size="pill"
            className="font-extrabold text-base leading-4 tracking-[0%] text-center shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Create ad
          </Button>
        </div>
      )}

      {/* Content area with fixed table header and scrollable body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden container mx-auto p-0">
        {isMobile ? (
          <MobileMyAdsList
            ads={ads.map((ad) => ({
              id: ad.id,
              type: ad.type,
              rate: ad.rate,
              limits: `${ad.limits.currency} ${ad.limits.min} - ${ad.limits.max}`,
              available: ad.available,
              paymentMethods: ad.paymentMethods,
              status: ad.status,
              description: ad.description || "",
            }))}
            onAdDeleted={handleAdDeleted}
          />
        ) : (
          <MyAdsTable ads={ads} onAdDeleted={handleAdDeleted} />
        )}
      </div>

      {successModal.show && !isMobile && (
        <StatusModal
          type="success"
          title="Ad created"
          message="You've successfully created Ad. If your ad doesn't receive an order within 3 days, it will be deactivated."
          onClose={handleCloseSuccessModal}
        />
      )}

      {successModal.show && isMobile && (
        <StatusBottomSheet
          isOpen={successModal.show}
          onClose={handleCloseSuccessModal}
          type="success"
          title="Ad created"
          message="If your ad doesn't receive an order within 3 days, it will be deactivated."
          adType={successModal.type}
          adId={successModal.id}
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
