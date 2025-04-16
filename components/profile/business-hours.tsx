import { Info, PenLine } from "lucide-react"

interface BusinessHoursProps {
  isOpen: boolean
  availability: string
}

export default function BusinessHours({ isOpen, availability }: BusinessHoursProps) {
  return (
    <div className="border rounded-lg p-4">
      {/* Header section */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h3
            className="text-base font-normal"
            style={{ lineHeight: "24px", letterSpacing: "0%", verticalAlign: "middle" }}
          >
            Business hours
          </h3>
          <Info className="h-3 w-3 ml-2 text-gray-400" />
        </div>
        <div className="flex items-center">
          <span
            className={`text-base font-bold ${isOpen ? "text-green-600" : "text-red-600"}`}
            style={{ lineHeight: "24px", letterSpacing: "0%", verticalAlign: "middle" }}
          >
            {isOpen ? "Open now" : "Closed"}
          </span>
          <button className="ml-2 text-gray-500">
            <PenLine className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t my-4"></div>

      {/* Toggle section */}
      <div className="flex items-center justify-between mt-6">
        <div>
          <h3
            className="text-sm font-normal"
            style={{
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: "20px",
              letterSpacing: "0%",
              verticalAlign: "middle",
            }}
          >
            Show my real name
          </h3>
          <p
            className="text-gray-500 text-xs font-normal"
            style={{
              fontWeight: 400,
              fontSize: "12px",
              lineHeight: "20px",
              letterSpacing: "0%",
              verticalAlign: "middle",
            }}
          >
            Jonathan Nick Does
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" value="" className="sr-only peer" defaultChecked />
          <div
            className="bg-gray-200 peer-focus:outline-none peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#00D2FF]"
            style={{ width: "52px", height: "32px", borderRadius: "45px" }}
          ></div>
        </label>
      </div>
    </div>
  )
}
