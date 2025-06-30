export interface StatusModalState {
  show: boolean
  type: "success" | "error" | "warning"
  title: string
  message: string
  subMessage?: string
  adType?: string
  adId?: string
  actionButtonText?: string
}
