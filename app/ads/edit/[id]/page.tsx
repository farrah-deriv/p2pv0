"use client"

export const runtime = 'edge'

import { useParams } from "next/navigation"
import MultiStepAdForm from "@/app/ads/components/shared/multi-step-ad-form"
import { EmailGatedPage } from "@/components/email-gated-page"

export default function EditAdPage() {
  const { id } = useParams() as { id: string }

  return (
    <EmailGatedPage>
      <MultiStepAdForm mode="edit" adId={id} />
    </EmailGatedPage>
  )
}
