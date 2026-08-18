"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useGuideStore } from "@/stores/guide-store"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"


interface OptionCardProps {
  icon: React.ReactNode
  title: string
  subtitle: string
  variant: "light" | "primary" | "dark" | "outlined"
  onClick: () => void
}

function OptionCard({ icon, title, subtitle, variant, onClick }: OptionCardProps) {
  const bgClass =
    variant === "primary"
      ? "bg-primary"
      : variant === "dark"
        ? "bg-slate-1200"
        : variant === "outlined"
          ? "bg-transparent"
          : "bg-[var(--quill-primitive-colour-black-opacity-75)]"

  // Hover state is variant-aware: light surfaces tint toward neutral-50 (the
  // codebase's standard card hover), the outlined Ask-Amy option carries a
  // permanent rainbow gradient border so no hover change is needed, and
  // dark/primary surfaces keep the opacity lift since a light tint would
  // read poorly.
  const hoverClass =
    variant === "light"
      ? "hover:bg-neutral-50"
      : variant === "outlined"
        ? ""
        : "hover:opacity-90"

  const titleClass =
    variant === "light" || variant === "outlined" ? "text-slate-1200" : "text-white"

  const subtitleClass =
    variant === "light" || variant === "outlined" ? "text-grayscale-text-muted" : "text-white/70"

  // The Ask-Amy (outlined) card has no fill of its own — only a permanent
  // rainbow gradient border with Quill's 8px radius, matching the sparkle
  // icon at public/icons/ic-ask-amy-sparkle.svg.
  //
  // border-image cannot respect border-radius, so the gradient border is
  // rendered with the two-layer background-clip technique. The rainbow
  // gradient fills the entire border-box; an OPAQUE layer in the surface
  // color (--background-rgb, the dialog's white) clipped to the padding-box
  // masks it everywhere except the 1px border ring. The opaque layer must
  // not be transparent — a transparent mask would let the rainbow bleed
  // into the card body. Using the surface color makes the body blend with
  // the dialog so the card reads as fill-free with only a gradient border.
  const borderStyle = variant === "outlined"
    ? {
        border: "1px solid transparent",
        borderRadius: "8px",
        background:
          "linear-gradient(rgb(var(--background-rgb)), rgb(var(--background-rgb))) padding-box, linear-gradient(to right, #17EABD, #2C9AFF, #0C28F7, #4902E0, #7F0DCF, #CB0DF7, #E6190E, #F55F0A, #FF9C13, #F7C60B, #E0DA02) border-box",
      }
    : undefined

  // The outlined variant must keep a transparent card body so only the
  // gradient border ring shows. bgClass would set the card fill, so we drop
  // it for the outlined variant.
  const cardBgClass = variant === "outlined" ? "" : bgClass

  return (
    <button
      type="button"
      onClick={onClick}
      style={borderStyle}
      className={`flex w-full items-center gap-3 rounded-lg p-4 text-start transition-colors ${hoverClass} active:opacity-80 focus:outline-none ${cardBgClass}`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl`}>
        {icon}
      </span>
      <span className="flex flex-col min-w-0">
        <span className={`font-bold text-base leading-tight ${titleClass}`}>{title}</span>
        <span className={`text-xs mt-0.5 ${subtitleClass}`}>{subtitle}</span>
      </span>
    </button>
  )
}

function IntroContent({ onClose }: { onClose: () => void }) {
  const { t } = useTranslations()
  const dismissIntro = useGuideStore((s) => s.dismissIntro)
  const startGuide = useGuideStore((s) => s.startGuide)
  const setGuideStartedFromIntro = useGuideStore((s) => s.setGuideStartedFromIntro)
  const requestAskAmy = useGuideStore((s) => s.requestAskAmy)
  const router = useRouter()

  const handlePlaceOrder = () => {
    setGuideStartedFromIntro(true)
    dismissIntro()
    startGuide()
  }

  const handleCreateAd = () => {
    setGuideStartedFromIntro(true)
    dismissIntro()
    router.push("/ads/create?guide=true")
  }

  // requestAskAmy() dismisses the intro only; Main fires Intercom("show") once
  // it has actually unmounted, so the two never race (see guide-store comment).
  const handleSkip = () => {
    dismissIntro()
    onClose()
  }

  return (
    <div className="flex flex-col items-center px-6 pb-8 pt-6">
      {/* Title + description */}
      <p className="mb-6 w-full text-left text-2xl font-extrabold text-slate-1200 leading-tight">
        {t("guideIntro.title")}
      </p>
      <p className="mb-4 text-base leading-relaxed" style={{ color: "var(--quill-primitive-colour-black-opacity-900)" }}>
        {t("guideIntro.description")}
      </p>

      {/* Option cards */}
      <div className="flex w-full flex-col gap-2">
        <OptionCard
          variant="light"
          icon={<Image src="/icons/ic-play.svg" alt="" width={20} height={20} aria-hidden className="text-white" />}
          title={t("guideIntro.orderTitle")}
          subtitle={t("guideIntro.orderSubtitle")}
          onClick={handlePlaceOrder}
        />
        <OptionCard
          variant="light"
          icon={<Image src="/icons/ic-play.svg" alt="" width={20} height={20} aria-hidden className="text-white" />}
          title={t("guideIntro.adTitle")}
          subtitle={t("guideIntro.adSubtitle")}
          onClick={handleCreateAd}
        />
        <OptionCard
          variant="outlined"
          icon={<Image src="/icons/ic-ask-amy-sparkle.svg" alt="" width={32} height={32} aria-hidden />}
          title={t("guideIntro.amyTitle")}
          subtitle={t("guideIntro.amySubtitle")}
          onClick={requestAskAmy}
        />
      </div>

      {/* Skip link */}
      <Button
        type="button"
        variant="ghost"
        onClick={handleSkip}
        className="mt-5 h-auto min-h-0 min-w-0 rounded-none p-0 !underline !text-sm !font-normal !hover:bg-transparent hover:text-slate-1200"
      >
        {t("guideIntro.skip")}
      </Button>
    </div>
  )
}

export function P2PGuideIntro() {
  const isIntroOpen = useGuideStore((s) => s.isIntroOpen)
  const dismissIntro = useGuideStore((s) => s.dismissIntro)
  const isMobile = useIsMobile()

  if (!isIntroOpen) return null

  if (isMobile) {
    return (
      <Drawer open={isIntroOpen} onOpenChange={(open) => !open && dismissIntro()}>
        <DrawerContent>
          <DrawerTitle className="sr-only" />
          <DrawerDescription className="sr-only" />
          <IntroContent onClose={dismissIntro} />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isIntroOpen} onOpenChange={(open) => !open && dismissIntro()}>
      <DialogContent className="max-w-sm p-0 sm:rounded-3xl overflow-hidden">
        <DialogTitle className="sr-only" />
        <DialogDescription className="sr-only" />
        <IntroContent onClose={dismissIntro} />
      </DialogContent>
    </Dialog>
  )
}
