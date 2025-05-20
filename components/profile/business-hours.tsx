import { Info, PenLine } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface BusinessHoursProps {
  isOpen: boolean
}

export default function BusinessHours({ isOpen }: BusinessHoursProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <h3 className="text-base font-normal leading-6 tracking-normal">Business hours</h3>
          <Info className="h-3 w-3 ml-2 text-slate-400" />
        </div>
        <div className="flex items-center">
          <span className={`text-base font-bold leading-6 tracking-normal ${isOpen ? "text-success" : "text-error"}`}>
            {isOpen ? "Open now" : "Closed"}
          </span>
          <button className="ml-2 text-slate-500">
            <PenLine className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="border-t my-4"></div>

      <div className="flex items-center justify-between mt-6">
        <div>
          <h3 className="text-sm font-normal leading-5 tracking-normal">Show my real name</h3>
          <p className="text-slate-500 text-xs font-normal leading-5 tracking-normal">Jonathan Nick Does</p>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="show-real-name" defaultChecked />
          <Label htmlFor="show-real-name" className="sr-only">
            Show my real name
          </Label>
        </div>
      </div>
    </div>
  )
}
