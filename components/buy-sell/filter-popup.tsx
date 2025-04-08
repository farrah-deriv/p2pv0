"use client"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"

interface FilterPopupProps {
    isOpen: boolean
    onClose: () => void
    onApply: (filters: FilterOptions) => void
    initialFilters: FilterOptions
}

// Update the FilterOptions interface to be more descriptive of what it actually does
export interface FilterOptions {
    fromFollowing: boolean // When true, this will pass favourites_only: 1 to the API
}

export default function FilterPopup({ isOpen, onClose, onApply, initialFilters }: FilterPopupProps) {
    const [filters, setFilters] = useState<FilterOptions>(initialFilters)

    if (!isOpen) return null

    // Update the handleApply function to ensure it correctly passes the filter state
    const handleApply = () => {
        onApply(filters)
    }

    // Make sure the checkbox correctly toggles the fromFollowing state
    const handleReset = () => {
        setFilters({ fromFollowing: false })
        onApply({ fromFollowing: false })
    }

    return (
        <div className="absolute z-50 mt-1 right-0 top-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-lg shadow-lg w-[320px] border border-slate-200">
                <div className="p-4 space-y-4">
                    <div className="flex space-x-3">
                        <div className="relative flex items-center justify-center">
                            <Checkbox
                                id="followingCheckbox"
                                checked={filters.fromFollowing}
                                onCheckedChange={(checked) => {
                                    // Create the new filter state
                                    const newFilters = { fromFollowing: checked as boolean }
                                    // Update local state
                                    setFilters(newFilters)
                                    // Immediately apply the new filters to parent component
                                    onApply(newFilters)
                                }}
                                className="cursor-pointer"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="followingCheckbox" className="font text-sm cursor-pointer">
                                Ads from advertisers you follow
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
