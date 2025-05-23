"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Check, Search, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PaymentMethodBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (methods: string[]) => void
  selectedMethods: string[]
  availableMethods: string[]
  maxSelections: number
}

export default function PaymentMethodBottomSheet({
  isOpen,
  onClose,
  onSelect,
  selectedMethods,
  availableMethods,
  maxSelections = 3,
}: PaymentMethodBottomSheetProps) {
  const [localSelectedMethods, setLocalSelectedMethods] = useState<string[]>(selectedMethods)
  const [searchQuery, setSearchQuery] = useState("")
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const bottomSheetRef = useRef<HTMLDivElement>(null)

  // Filter methods based on search query
  const filteredMethods = availableMethods.filter((method) => method.toLowerCase().includes(searchQuery.toLowerCase()))

  // Reset local state when props change
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedMethods(selectedMethods)
      setSearchQuery("")
    }
  }, [isOpen, selectedMethods])

  // Handle method selection
  const toggleMethod = (method: string, e: React.MouseEvent) => {
    // Stop event propagation to prevent it from reaching parent elements
    e.preventDefault()
    e.stopPropagation()

    if (localSelectedMethods.includes(method)) {
      setLocalSelectedMethods(localSelectedMethods.filter((m) => m !== method))
    } else if (localSelectedMethods.length < maxSelections) {
      setLocalSelectedMethods([...localSelectedMethods, method])
    }
  }

  // Check if a method is selected
  const isMethodSelected = (method: string) => localSelectedMethods.includes(method)

  // Check if we've reached the maximum number of selections
  const isMaxReached = localSelectedMethods.length >= maxSelections

  // Handle save selection
  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSelect(localSelectedMethods)
    onClose()
  }

  // Handle cancel
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking the overlay, not the content
    if (e.target === e.currentTarget) {
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
  }

  // Handle touch events for dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      setCurrentY(e.touches[0].clientY)
    }
  }

  const handleTouchEnd = () => {
    if (isDragging) {
      // If dragged down more than 100px, close the sheet
      if (currentY - startY > 100) {
        onClose()
      }
      setIsDragging(false)
    }
  }

  // Calculate transform style based on drag position
  const getTransformStyle = () => {
    if (isDragging && currentY > startY) {
      return { transform: `translateY(${currentY - startY}px)` }
    }
    return {}
  }

  // Prevent form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div
        ref={bottomSheetRef}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[90vh] overflow-y-auto z-[60]"
        style={getTransformStyle()}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          e.stopPropagation()
          handleTouchStart(e)
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="w-full flex justify-center pt-2 pb-4">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <form onSubmit={handleFormSubmit} className="px-6 pb-8">
          <h2 className="text-2xl font-bold text-center mb-2">Payment methods</h2>
          <p className="text-center text-gray-600 mb-6">You can select up to 3 payment methods.</p>

          {/* Search input */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-black" />
            </div>
            <Input
              type="text"
              placeholder="Search"
              variant="tertiary"
              value={searchQuery}
              onChange={(e) => {
                e.stopPropagation()
                setSearchQuery(e.target.value)
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Payment methods list */}
          <div className="space-y-4 mb-8 h-[300px] overflow-y-auto">
            {filteredMethods.length > 0 ? (
              filteredMethods.map((method) => (
                <button
                  key={method}
                  type="button"
                  className="w-full flex items-center gap-3 py-3"
                  onClick={(e) => toggleMethod(method, e)}
                  onMouseDown={(e) => e.stopPropagation()}
                  disabled={!isMethodSelected(method) && isMaxReached}
                >
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-md border ${isMethodSelected(method)
                      ? "bg-primary border-primary"
                      : isMaxReached
                        ? "border-gray-200 bg-gray-100"
                        : "border-gray-200"
                      }`}
                  >
                    {isMethodSelected(method) && <Check className="h-6 w-6 text-white" />}
                  </div>
                  <span className={isMaxReached && !isMethodSelected(method) ? "text-gray-400" : "text-gray-900"}>
                    {method}
                  </span>
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-1">No payment methods found</h3>
                <p className="text-gray-500 max-w-xs">The payment method you're searching for is not available.</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              onClick={handleSelect}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full h-[48px] bg-primary hover:bg-cyan-hover text-black rounded-full"
            >
              Select
            </Button>
            <Button
              type="button"
              onClick={handleCancel}
              onMouseDown={(e) => e.stopPropagation()}
              variant="outline"
              className="w-full h-[48px] border-gray-300 rounded-full"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
