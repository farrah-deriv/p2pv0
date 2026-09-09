export interface RatingData {
  rating: number
  recommend: boolean | null
}

export interface RatingSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: RatingData) => Promise<void>
  isSubmitting?: boolean
  title?: string
  ratingLabel?: string
  recommendLabel?: string
}
