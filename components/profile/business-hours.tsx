import { Info, Edit } from "lucide-react"

interface BusinessHoursProps {
  isOpen: boolean
  availability: string
}

export default function BusinessHours({ isOpen, availability }: BusinessHoursProps) {
  return (
    <div className="border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h3 className="font-medium">Business hours</h3>
          <Info className="h-4 w-4 ml-1 text-gray-400" />
        </div>
        <button className="text-gray-500">
          <Edit className="h-4 w-4" />
        </button>
      </div>
      <div className="text-green-600 font-medium">{isOpen ? "Open now" : "Closed"}</div>
      <div className="text-sm text-gray-500">({availability})</div>
    </div>
  )
}

