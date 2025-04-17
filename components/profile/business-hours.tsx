interface BusinessHoursProps {
  isOpen: boolean
  availability: string
}

// Replace the entire component with this version that returns null
export default function BusinessHours({ isOpen, availability }: BusinessHoursProps) {
  // Temporarily hide this component until it's fully working
  return null

  /* Original code preserved for when it's ready to be enabled:
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
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" value="" className="sr-only peer" defaultChecked />
          <div className="bg-slate-200 peer-focus:outline-none peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary w-[52px] h-[32px] rounded-[45px]"></div>
        </label>
      </div>
    </div>
  )
  */
}


