"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface StatusBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  type: "success" | "error" | "warning"
  title: string
  message: string
  subMessage?: string
  adId?: string
  adType?: string
  actionButtonText?: string
  isUpdate?: boolean
}

export default function StatusBottomSheet({
  isOpen,
  onClose,
  type,
  title,
  message,
  subMessage,
  adId,
  adType,
  actionButtonText = "OK",
  isUpdate = false,
}: StatusBottomSheetProps) {
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const bottomSheetRef = useRef<HTMLDivElement>(null)

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
      if (currentY - startY > 100) {
        onClose()
      }
      setIsDragging(false)
    }
  }

  const getTransformStyle = () => {
    if (isDragging && currentY > startY) {
      return { transform: `translateY(${currentY - startY}px)` }
    }
    return {}
  }

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

  const getIconSrc = () => {
    return type === "success" ? "/icons/success_icon_round.png" : "/icons/error_icon_round.png"
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div
        ref={bottomSheetRef}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] max-h-[90vh] overflow-y-auto overflow-x-hidden z-[60]"
        style={getTransformStyle()}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bg-gray-100 pb-6">
          <div className="w-full flex justify-center pt-4 pb-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
          </div>

          <div className="flex justify-center mb-8 mt-4">
            <div className="flex items-center justify-center w-[72px] h-[72px]">
              <Image
                src={getIconSrc()}
                alt={type === "success" ? "Success" : "Error"}
                width={72}
                height={72}
                className="w-[72px] h-[72px]"
              />
            </div>
          </div>
        </div>

        <div className="px-6 pb-8">
          <h2 className="mb-6 mt-4 text-2xl font-extrabold leading-7">{title}</h2>

          {type === "success" && (
            <>
              <p className="mb-6 font-normal text-base leading-6">
                {isUpdate
                  ? `You've successfully updated Ad${adType && adId ? ` (${adType} ${adId})` : "."}`
                  : `You've successfully created Ad${adType && adId ? ` (${adType} ${adId})` : "."}`}
              </p>
              <p className="font-normal text-base leading-6">{message}</p>
            </>
          )}

          {type !== "success" && <p className="font-normal text-base leading-6">{message}</p>}

          {subMessage && <p className="mt-6 font-normal text-base leading-6">{subMessage}</p>}

          <div className="mt-12">
            <Button onClick={onClose} className="w-full h-14">
              {actionButtonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
