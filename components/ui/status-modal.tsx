"use client"

import { Check, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StatusModalProps {
  type: "success" | "error"
  title: string
  message: string
  subMessage?: string
  onClose: () => void
}

export default function StatusModal({ type, title, message, subMessage, onClose }: StatusModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center mb-6">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mb-4
            ${type === "success" ? "bg-green-100" : "bg-yellow-100"}`}
          >
            {type === "success" ? (
              <Check className="h-6 w-6 text-green-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            )}
          </div>

          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          <p className="text-gray-600 mb-2">{message}</p>
          {subMessage && <p className="text-gray-500 text-sm">{subMessage}</p>}
        </div>

        <Button onClick={onClose} className="w-full bg-red-500 hover:bg-red-600 text-white">
          OK
        </Button>
      </div>
    </div>
  )
}
