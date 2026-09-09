"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { StandaloneXmarkRegularIcon } from "@deriv/quill-icons/Standalone"
import { useGuideStore, type GuideType } from "@/stores/guide-store"
import { useTranslations } from "@/lib/i18n/use-translations"
import { Button } from "@/components/ui/button"

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

interface StepConfig {
  targetId: string
  // Additional targets whose rects are unioned with the primary spotlight
  additionalTargetIds?: string[]
  // When primary target is hidden, use this element instead
  fallbackTargetId?: string
  // "right" → place tooltip to the right of the spotlight (used when fallback is a sidebar)
  fallbackPlacement?: "right"
  // Override body text when the fallback target is active
  fallbackBodyKey?: string
  // Skip this step entirely when the target is not in the DOM (e.g. no ads loaded)
  skipIfAbsent?: boolean
  titleKey: string
  bodyKey: string
}

const MARKETS_STEP_CONFIG: StepConfig[] = [
  { targetId: "guide-buy-sell-tabs", titleKey: "guide.step1Title", bodyKey: "guide.step1Body" },
  { targetId: "guide-currency-filter", titleKey: "guide.step2Title", bodyKey: "guide.step2Body" },
  // Payment-method + advanced-filter controls sit side by side; one spotlight covers both.
  { targetId: "guide-payment-method-filter", additionalTargetIds: ["guide-advanced-filter"], titleKey: "guide.step3Title", bodyKey: "guide.step3Body" },
  { targetId: "guide-advertiser-name", skipIfAbsent: true, titleKey: "guide.step4Title", bodyKey: "guide.step4Body" },
  { targetId: "guide-trade-button", skipIfAbsent: true, titleKey: "guide.step5Title", bodyKey: "guide.step5Body" },
  // Mobile: footer nav. Desktop: footer nav is md:hidden → sidebar nav, tooltip to its right.
  { targetId: "guide-footer-nav", fallbackTargetId: "guide-sidebar-nav", fallbackPlacement: "right", titleKey: "guide.step6Title", bodyKey: "guide.step6Body", fallbackBodyKey: "guide.step6BodyDesktop" },
]

const ADS_STEP_CONFIG: StepConfig[] = [
  { targetId: "ad-guide-trade-type", skipIfAbsent: true, titleKey: "adGuide.step1Title", bodyKey: "adGuide.step1Body" },
  { targetId: "ad-guide-currency", titleKey: "adGuide.step2Title", bodyKey: "adGuide.step2Body" },
  { targetId: "ad-guide-rate", titleKey: "adGuide.step3Title", bodyKey: "adGuide.step3Body" },
  { targetId: "ad-guide-amount", titleKey: "adGuide.step4Title", bodyKey: "adGuide.step4Body" },
  { targetId: "ad-guide-payment", titleKey: "adGuide.step5Title", bodyKey: "adGuide.step5Body" },
  { targetId: "ad-guide-conditions", titleKey: "adGuide.step6Title", bodyKey: "adGuide.step6Body" },
]

const STEP_CONFIG_BY_TYPE: Record<GuideType, StepConfig[]> = {
  markets: MARKETS_STEP_CONFIG,
  ads: ADS_STEP_CONFIG,
}

const SPOTLIGHT_PADDING = 8
const TOOLTIP_GAP = 8
// Safe-area-inset on notched phones (iOS ≈ 34 px, Android ≈ 16–24 px).
// Overflow within this band at the bottom is a layout artifact, not a sign
// the element needs scrolling (the footer nav lives in a non-scrollable container).
const SAFE_AREA_BOTTOM_THRESHOLD = 60

// Walks up the ancestor chain to find the first container that *actually* scrolls
// vertically (scrollHeight > clientHeight). Falls back to window scroll if none found.
// Using this instead of el.scrollIntoView() avoids the Table wrapper's
// overflow-auto div being picked as the scroll target even though it never overflows.
function scrollToVisible(el: HTMLElement, vh: number) {
  let container: HTMLElement | null = el.parentElement
  while (container && container !== document.documentElement) {
    const style = window.getComputedStyle(container)
    const overflowY = style.overflowY
    if ((overflowY === "auto" || overflowY === "scroll") && container.scrollHeight > container.clientHeight + 1) {
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      if (elRect.top < 0) {
        // Element scrolled above viewport (navigating backward in guide).
        // Reset to top so all header/filter targets become visible.
        container.scrollTop = 0
      } else {
        // Element is below viewport (navigating forward). Position at ~30% from top.
        const desiredTop = container.scrollTop + (elRect.top - containerRect.top) - Math.round(vh * 0.3)
        container.scrollTop = Math.max(0, desiredTop)
      }
      return
    }
    container = container.parentElement
  }
  // Fallback: plain scrollIntoView for document-level scroll
  el.scrollIntoView({ behavior: "auto", block: "start" })
}

function renderBold(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} style={{ color: "var(--quill-primitive-colour-black-opacity-900)" }}>{part}</strong>
      : part
  )
}

function stepWouldBeSkipped(stepConfig: StepConfig): boolean {
  const els = document.querySelectorAll<HTMLElement>(`[data-guide-id="${stepConfig.targetId}"]`)
  if (stepConfig.skipIfAbsent && els.length === 0) return true
  const allHidden = (id: string) => {
    const nodes = document.querySelectorAll<HTMLElement>(`[data-guide-id="${id}"]`)
    if (nodes.length === 0) return false
    return Array.from(nodes).every(e => {
      const r = e.getBoundingClientRect()
      return r.width === 0 && r.height === 0
    })
  }
  if (!allHidden(stepConfig.targetId)) return false
  if (stepConfig.fallbackTargetId && !allHidden(stepConfig.fallbackTargetId)) return false
  return true
}

export function P2PGuide() {
  const { t } = useTranslations()
  const router = useRouter()
  const { isGuideActive, guideType, currentStep, nextStep, goToStep, completeGuide, guideStartedFromIntro, adTradeType, marketTradeType } = useGuideStore()
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)
  // Tracks which step owns the current targetRect; -1 means stale/unset
  const rectStepRef = useRef(-1)
  // Populated lazily on the first readTargetRect call so the DOM has settled
  // (the form sync effect fires before the 80ms timer, ensuring all guide targets
  // are in the DOM before the snapshot is taken).
  const skippedAtStartRef = useRef<boolean[] | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== "undefined" ? (window.visualViewport?.height ?? window.innerHeight) : 0
  )
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200
  )

  const readTargetRect = useCallback(() => {
    const activeConfig = STEP_CONFIG_BY_TYPE[guideType] ?? MARKETS_STEP_CONFIG
    const config = activeConfig[currentStep]
    if (!config) return

    // Capture stable skip state on first call so the DOM has already settled
    // (the form sync useEffect fires before this 80ms timer fires).
    if (skippedAtStartRef.current === null) {
      skippedAtStartRef.current = activeConfig.map(s => stepWouldBeSkipped(s))
    }

    const findVisible = (id: string) => {
      const all = document.querySelectorAll<HTMLElement>(`[data-guide-id="${id}"]`)
      // offsetParent is unreliable on Safari iOS for below-fold elements inside flex/overflow-y:auto
      // chains — it returns null even though the element is in the layout. getBoundingClientRect()
      // is consistent: display:none → all zeros; below-fold → non-zero width/height.
      const el = Array.from(all).find(e => {
        const r = e.getBoundingClientRect()
        return r.width > 0 || r.height > 0
      }) ?? null
      return { el, count: all.length }
    }

    let { el, count } = findVisible(config.targetId)
    let usedFallback = false

    // Primary target hidden — try fallback (e.g. sidebar on desktop when footer nav is md:hidden)
    if (!el && count > 0 && config.fallbackTargetId) {
      const fallback = findVisible(config.fallbackTargetId)
      el = fallback.el
      count = el ? fallback.count : 0
      usedFallback = !!el
    }

    if (!el) {
      if (count === 0 && !config.skipIfAbsent) {
        // Not in DOM and not required to be present — show tooltip without spotlight
        setTargetRect(null)
        setUsingFallback(false)
        rectStepRef.current = currentStep
      } else {
        // All instances hidden, or absent with skipIfAbsent — skip this step
        if (currentStep >= activeConfig.length - 1) {
          completeGuide()
        } else {
          nextStep()
        }
      }
      return
    }

    const elRect = el.getBoundingClientRect()
    // visualViewport.height accounts for the on-screen keyboard and browser chrome
    // (URL bar) on real iOS/Android devices; falls back to innerHeight elsewhere.
    const vh = window.visualViewport?.height ?? window.innerHeight

    // Scroll and retry only when the element is meaningfully out of the viewport.
    // Bottom overflow within SAFE_AREA_BOTTOM_THRESHOLD is a layout artifact
    // (safe-area padding), not a sign the element needs scrolling.
    const bottomOverflow = elRect.bottom - vh
    const needsScroll =
      elRect.top < 0 ||
      (bottomOverflow > SAFE_AREA_BOTTOM_THRESHOLD) ||
      (bottomOverflow > 0 && elRect.top >= vh)

    if (needsScroll) {
      scrollToVisible(el, vh)
      setTimeout(readTargetRect, 80)
      return
    }

    let { top, left, bottom, right } = elRect

    // Expand spotlight to cover any additional targets
    for (const additionalId of config.additionalTargetIds ?? []) {
      const { el: addEl } = findVisible(additionalId)
      if (addEl) {
        const r = addEl.getBoundingClientRect()
        top = Math.min(top, r.top)
        left = Math.min(left, r.left)
        bottom = Math.max(bottom, r.bottom)
        right = Math.max(right, r.right)
      }
    }

    setTargetRect({ top, left, width: right - left, height: bottom - top })
    setUsingFallback(usedFallback)
    setViewportHeight(window.visualViewport?.height ?? window.innerHeight)
    setViewportWidth(window.innerWidth)
    rectStepRef.current = currentStep
  }, [currentStep, guideType, nextStep, completeGuide])

  useEffect(() => {
    if (!isGuideActive) {
      skippedAtStartRef.current = null
      return
    }
    const timer = setTimeout(readTargetRect, 80)
    return () => clearTimeout(timer)
  }, [isGuideActive, currentStep, readTargetRect])

  useEffect(() => {
    if (!isGuideActive) return
    const handleResize = () => readTargetRect()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isGuideActive, readTargetRect])

  // Focus trap: move focus into the tooltip once its position is resolved for this step and
  // contain Tab/Shift-Tab within it. Depends on targetRect so it re-fires after readTargetRect
  // settles — at step-change time tooltipRef.current is still null and the effect returns early.
  useEffect(() => {
    if (rectStepRef.current !== currentStep) return
    const container = tooltipRef.current
    if (!container) return

    container.focus()

    const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) { e.preventDefault(); return }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first || document.activeElement === container) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isGuideActive, currentStep, targetRect]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-compute skip status once per step change — avoids repeated querySelectorAll during render
  const activeStepConfig = STEP_CONFIG_BY_TYPE[guideType] ?? MARKETS_STEP_CONFIG
  const skippedByStep = useMemo(
    () => isGuideActive ? activeStepConfig.map(s => stepWouldBeSkipped(s)) : [],
    [isGuideActive, currentStep], // eslint-disable-line react-hooks/exhaustive-deps
  )
  // Stable snapshot populated by readTargetRect on its first call — guaranteed to run
  // after the form sync effect has moved the wizard back to step 0, so the snapshot
  // reflects the real DOM state rather than the transient state at guide activation.
  const skippedAtStart = skippedAtStartRef.current ?? []

  if (!isGuideActive) return null

  const STEP_CONFIG = STEP_CONFIG_BY_TYPE[guideType] ?? MARKETS_STEP_CONFIG
  const config = STEP_CONFIG[currentStep]

  // Hide spotlight and tooltip while readTargetRect is resolving; keep backdrop visible
  // so the overlay doesn't flash away and back during step transitions.
  const tooltipReady = rectStepRef.current === currentStep
  const isLastStep = currentStep === STEP_CONFIG.length - 1
  const isEffectiveLastStep = isLastStep || STEP_CONFIG.slice(currentStep + 1).every((_, i) => skippedByStep[currentStep + 1 + i])

  const handlePrevStep = () => {
    let step = currentStep - 1
    while (step > 0 && skippedByStep[step]) step--
    goToStep(step)
  }

  // Exclude skipped steps from the counter so numbering stays contiguous.
  // Uses skippedAtStart (not skippedByStep) so the total stays stable as wizard
  // navigation moves already-visited elements out of the DOM.
  const effectiveTotalSteps = STEP_CONFIG.filter((_, i) => !skippedAtStart[i]).length
  const effectiveCurrentStep = STEP_CONFIG.slice(0, currentStep + 1).filter((_, i) => !skippedAtStart[i]).length

  const spotlightTop = targetRect ? targetRect.top - SPOTLIGHT_PADDING : 0
  const spotlightLeft = targetRect ? targetRect.left - SPOTLIGHT_PADDING : 0
  const spotlightWidth = targetRect ? targetRect.width + SPOTLIGHT_PADDING * 2 : 0
  const spotlightHeight = targetRect ? targetRect.height + SPOTLIGHT_PADDING * 2 : 0

  // "right" placement: tooltip sits to the right of the spotlight (used for sidebar nav on desktop)
  const isRightPlacement = usingFallback && config.fallbackPlacement === "right"

  // Place tooltip below the spotlight if there's room, otherwise above.
  // Checking available space (not a fixed 55% midpoint) handles small screens and
  // tall elements where the fixed threshold produces overflow.
  const ESTIMATED_TOOLTIP_HEIGHT = 200
  const tooltipBelow = isRightPlacement || (
    spotlightTop + spotlightHeight + TOOLTIP_GAP + ESTIMATED_TOOLTIP_HEIGHT <= viewportHeight
  )

  const tooltipTopValue = tooltipBelow
    ? spotlightTop + spotlightHeight + TOOLTIP_GAP
    : undefined
  const tooltipBottomValue = !tooltipBelow
    ? viewportHeight - spotlightTop + TOOLTIP_GAP
    : undefined

  // Horizontally center the tooltip on the spotlight, clamped so it stays 16px inside the viewport
  const TOOLTIP_MAX_WIDTH = 332
  const TOOLTIP_EDGE_GAP = 16
  const spotlightCenterX = targetRect ? spotlightLeft + spotlightWidth / 2 : viewportWidth / 2
  const tooltipCenterX = Math.min(
    Math.max(spotlightCenterX, TOOLTIP_MAX_WIDTH / 2 + TOOLTIP_EDGE_GAP),
    viewportWidth - TOOLTIP_MAX_WIDTH / 2 - TOOLTIP_EDGE_GAP
  )

  const tooltipStyle = isRightPlacement
    ? { left: spotlightLeft + spotlightWidth + TOOLTIP_GAP, top: Math.max(8, spotlightTop + 16) }
    : tooltipTopValue !== undefined
      ? { top: Math.max(8, tooltipTopValue), left: tooltipCenterX }
      : { bottom: tooltipBottomValue, left: tooltipCenterX }

  return (
    <div
      className="fixed inset-0 z-[60]"
      aria-modal="true"
      role="dialog"
      aria-labelledby={tooltipReady ? "p2p-guide-title" : undefined}
    >
      {/* Captures all pointer events so the page stays non-interactive while the guide is open */}
      <div className="absolute inset-0 pointer-events-auto" />

      {/*
        Dark fill: when the spotlight is ready, the box-shadow spread provides it with a
        rounded cutout. When it is not yet ready (readTargetRect still resolving, or
        auto-advancing past a skipped step), a plain full-screen div keeps the dark overlay
        present so the page never flashes through during transitions.
      */}
      {tooltipReady && targetRect ? (
        <div
          className="absolute rounded-lg pointer-events-none [box-shadow:0_0_0_9999px_rgba(0,0,0,0.6)]"
          style={{
            top: spotlightTop,
            left: spotlightLeft,
            width: spotlightWidth,
            height: spotlightHeight,
            zIndex: 1,
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      )}

      {tooltipReady && (
        <div
          className={isRightPlacement
            ? "absolute max-w-[332px] w-[calc(100%-32px)] z-[2]"
            : "absolute -translate-x-1/2 w-[calc(100%-32px)] max-w-[332px] z-[2]"
          }
          style={tooltipStyle}
        >
          <div ref={tooltipRef} tabIndex={-1} className="relative bg-white rounded-2xl shadow-xl p-5 outline-none">

            {/* Title row with X dismiss button */}
            <div className="flex items-center justify-between mb-2">
              <p id="p2p-guide-title" className="font-bold text-base text-slate-1200 leading-snug pe-2">{t(config.titleKey)}</p>
              <Button
                type="button"
                variant="icon-muted"
                onClick={() => {
                    completeGuide()
                    if (guideType === "ads" && guideStartedFromIntro) router.push("/")
                  }}
                aria-label={t("guide.closeLabel")}
                className="shrink-0"
              >
                <StandaloneXmarkRegularIcon width={24} height={24} aria-hidden />
              </Button>
            </div>

            <p className="text-sm text-grayscale-600 mb-5 leading-relaxed">{renderBold(t((() => {
              const key = usingFallback && config.fallbackBodyKey ? config.fallbackBodyKey : config.bodyKey
              const isSellAd = adTradeType === "sell"
              const isSellMarket = marketTradeType === "buy"
              if (key === "adGuide.step2Body") return isSellAd ? "adGuide.step2BodySell" : "adGuide.step2BodyBuy"
              if (key === "adGuide.step4Body") return isSellAd ? "adGuide.step4BodySell" : "adGuide.step4BodyBuy"
              if (key === "adGuide.step5Body") return isSellAd ? "adGuide.step5BodySell" : "adGuide.step5BodyBuy"
              if (key === "adGuide.step6Body") return isSellAd ? "adGuide.step6BodySell" : "adGuide.step6BodyBuy"
              if (key === "guide.step5Body") return isSellMarket ? "guide.step5BodySell" : "guide.step5BodyBuy"
              return key
            })()))}</p>

            {/* Bottom row: step counter left, buttons right */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-grayscale-600">
                {effectiveCurrentStep}/{effectiveTotalSteps}
              </span>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="secondary-outline"
                    size="sm"
                    className="rounded-full font-bold"
                    onClick={handlePrevStep}
                  >
                    {t("guide.back")}
                  </Button>
                )}
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-full font-bold"
                  onClick={isEffectiveLastStep ? () => {
                    completeGuide()
                    if (guideType === "ads" && guideStartedFromIntro) router.push("/")
                  } : nextStep}
                >
                  {isEffectiveLastStep ? t("guide.done") : t("guide.next")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
