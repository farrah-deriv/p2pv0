import type React from "react"

interface Ad {
  id: string
  title: string
  rate: number
  limits: string
  status: string
}

interface MobileMyAdsListProps {
  ads: Ad[]
}

const MobileMyAdsList: React.FC<MobileMyAdsListProps> = ({ ads }) => {
  return (
    <div className="sm:hidden">
      {ads.map((ad) => (
        <div key={ad.id} className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h3 className="text-lg font-semibold mb-2">{ad.title}</h3>
          <div className="flex flex-col gap-1">
            <div>
              <span className="text-black text-xs font-bold leading-5">Rate:</span> {ad.rate}
            </div>
            <div>
              <span className="text-black text-xs font-bold leading-5">Limits:</span> {ad.limits}
            </div>
            <div>
              <span className="text-black font-medium">Status:</span> {ad.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MobileMyAdsList
