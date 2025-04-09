"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CustomStatusBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  type: "success" | "error" | "warning"
  title: string
  message: string
  subMessage?: string
  adId?: string
  adType?: string
  actionButtonText?: string
}

export default function CustomStatusBottomSheet({
  isOpen,
  onClose,
  type,
  title,
  message,
  subMessage,
  adId,
  adType,
  actionButtonText = "OK",
}: CustomStatusBottomSheetProps) {
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const bottomSheetRef = useRef<HTMLDivElement>(null)

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

  // Lock body scroll when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div
        ref={bottomSheetRef}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] max-h-[90vh] overflow-y-auto z-[60]"
        style={getTransformStyle()}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="w-full flex justify-center pt-4 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <div className="px-6 pb-8">
          {/* Icon */}
          <div className="flex justify-center mb-8 mt-4">
            <div
              className={`${
                type === "success" ? "bg-[#EDFAF3]" : "bg-[#FFF8E7]"
              } rounded-full p-4 flex items-center justify-center w-[72px] h-[72px]`}
            >
              {type === "success" ? (
                <CheckCircle className="h-10 w-10 text-[#008832]" />
              ) : (
                <AlertCircle className="h-10 w-10 text-[#F59E0B]" />
              )}
            </div>
          </div>

          {/* Title */}
          <h2
            className="mb-6"
            style={{
              fontWeight: 700,
              fontSize: "18px",
              lineHeight: "28px",
            }}
          >
            {title}
          </h2>

          {/* Content */}
          {type === "success" && (
            <>
              <p
                className="mb-6"
                style={{
                  fontWeight: 400,
                  fontSize: "16px",
                  lineHeight: "24px",
                }}
              >
                You've successfully created Ad{adType && adId ? ` (${adType} ${adId})` : "."}
              </p>
              <p
                style={{
                  fontWeight: 400,
                  fontSize: "16px",
                  lineHeight: "24px",
                }}
              >
                {message}
              </p>
            </>
          )}

          {type !== "success" && (
            <p
              style={{
                fontWeight: 400,
                fontSize: "16px",
                lineHeight: "24px",
              }}
            >
              {message}
            </p>
          )}

          {subMessage && (
            <p
              className="mt-6"
              style={{
                fontWeight: 400,
                fontSize: "16px",
                lineHeight: "24px",
              }}
            >
              {subMessage}
            </p>
          )}

          {/* Button */}
          <div className="mt-12">
            <Button
              onClick={onClose}
              className="w-full h-14 bg-[#00D2FF] hover:bg-[#00BFEA] text-black rounded-full font-bold"
            >
              {actionButtonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
