"use client"

import { useState } from "react"

interface DebugInfoProps {
  data: any
  title?: string
}

export default function DebugInfo({ data, title = "Debug Info" }: DebugInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <div className="mt-4 p-2 border border-gray-300 rounded bg-gray-50">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="text-sm font-mono text-gray-700">{title}</h3>
        <span>{isExpanded ? "▼" : "▶"}</span>
      </div>

      {isExpanded && (
        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}
