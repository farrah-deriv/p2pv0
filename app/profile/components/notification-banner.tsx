"use client"

import { StatusBanner } from "@/components/ui/status-banner"

interface NotificationBannerProps {
  message: string
  onClose: () => void
  duration?: number
}

export default function NotificationBanner({ message, onClose, duration = 5000 }: NotificationBannerProps) {
  return <StatusBanner variant="success" message={message} onClose={onClose} autoHideDuration={duration} />
}
