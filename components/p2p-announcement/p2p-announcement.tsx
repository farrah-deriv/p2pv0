"use client"

import { memo, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { useTranslations } from "@/lib/i18n/use-translations"
import {
  type AnnouncementKind,
  ANNOUNCEMENT_ASSET_PATHS,
  ANNOUNCEMENT_TRANSLATION_KEYS,
} from "./p2p-announcement-config"

interface P2PAnnouncementProps {
  kind: AnnouncementKind
  onDismiss: () => void
}

interface AnnouncementContentProps extends P2PAnnouncementProps {
  layout: "modal" | "sheet"
}

interface AnnouncementCarouselProps {
  imagePaths: readonly string[]
  alt: string
  layout: "modal" | "sheet"
}

const AnnouncementCarousel = memo(function AnnouncementCarousel({
  imagePaths,
  alt,
}: AnnouncementCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  return (
    <div className="flex shrink-0 flex-col">
      <Image
        src={imagePaths[currentSlide]}
        alt={alt}
        width={1024}
        height={575}
        className="block w-full h-auto"
        priority
        sizes="(max-width: 448px) 100vw, 448px"
      />
      {imagePaths.length > 1 && (
        <div className="flex justify-center gap-1 px-6 pt-2">
          {imagePaths.map((_, index) => (
            <button
              key={index}
              type="button"
              data-testid={`announcement-dot-${index}`}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2 rounded-full transition-all ${
                currentSlide === index
                  ? "w-4 bg-slate-1200"
                  : "w-2 bg-grayscale-400"
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
})

// Memoized so the content subtree is not recreated when the parent re-renders
// due to useIsMobile returning a new value on viewport resize.
const AnnouncementContent = memo(function AnnouncementContent({
  kind,
  onDismiss,
  layout,
}: AnnouncementContentProps) {
  const { t } = useTranslations()
  const keys = ANNOUNCEMENT_TRANSLATION_KEYS[kind]
  const assetPaths = ANNOUNCEMENT_ASSET_PATHS[kind]
  const isModal = layout === "modal"

  return (
    <div className="flex flex-col overflow-hidden">
      {Array.isArray(assetPaths) ? (
        <AnnouncementCarousel
          imagePaths={assetPaths}
          alt={t(keys.title)}
          layout={layout}
        />
      ) : (
        <Image
          src={assetPaths}
          alt={t(keys.title)}
          width={320}
          height={192}
          className="block w-full h-auto shrink-0"
          priority
          sizes="(max-width: 448px) 100vw, 448px"
        />
      )}

      {/* Content area */}
      <div className={isModal ? "px-8 pt-6 pb-4" : "px-6 pt-6 pb-4"}>
        <h2 className="text-xl font-bold text-slate-1200 mb-4">
          {t(keys.title)}
        </h2>
        {"description" in keys ? (
          <p className="text-base text-grayscale-600">
            {t(keys.description)}
          </p>
        ) : (
          <ul className="space-y-2">
            {keys.bullets.map((bulletKey, index) => (
              <li key={index} className="flex items-start gap-2 text-base text-grayscale-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-grayscale-600" />
                {t(bulletKey)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CTA area */}
      <div className={`flex flex-col gap-2 ${isModal ? "px-8 pb-8 pt-2" : "px-6 pb-8 pt-2"}`}>
        <Button data-testid="announcement-btn-primary" className="w-full" onClick={onDismiss}>
          {t(keys.primaryCta)}
        </Button>
        {"secondaryCta" in keys && (
          <Button data-testid="announcement-btn-secondary" className="w-full" variant="outline" onClick={onDismiss}>
            {t((keys as typeof ANNOUNCEMENT_TRANSLATION_KEYS.whatsComing).secondaryCta)}
          </Button>
        )}
      </div>
    </div>
  )
})

export function P2PAnnouncement({ kind, onDismiss }: P2PAnnouncementProps) {
  const { t } = useTranslations()
  const isMobile = useIsMobile()
  const keys = ANNOUNCEMENT_TRANSLATION_KEYS[kind]

  if (isMobile) {
    return (
      <Drawer open dismissible={false}>
        <DrawerContent
          data-testid="announcement-modal"
          hideHandle
          className="gap-0 max-h-none overflow-hidden rounded-t-2xl border-0 p-0"
        >
          <DrawerTitle className="sr-only">
            {t(keys.title)}
          </DrawerTitle>
          <AnnouncementContent kind={kind} onDismiss={onDismiss} layout="sheet" />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onDismiss() }}>
      <DialogContent data-testid="announcement-modal" className="gap-0 p-0 max-w-md rounded-2xl overflow-hidden">
        <DialogTitle className="sr-only">
          {t(keys.title)}
        </DialogTitle>
        <AnnouncementContent kind={kind} onDismiss={onDismiss} layout="modal" />
      </DialogContent>
    </Dialog>
  )
}
