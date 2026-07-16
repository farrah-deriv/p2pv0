"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { useGuideStore, GUIDE_TOTAL_STEPS } from "@/stores/guide-store"
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

const STEP_CONFIG: StepConfig[] = [
  { targetId: "guide-buy-sell-tabs", titleKey: "guide.step1Title", bodyKey: "guide.step1Body" },
  { targetId: "guide-currency-filter", titleKey: "guide.step2Title", bodyKey: "guide.step2Body" },
  { targetId: "guide-payment-method-filter", titleKey: "guide.step3Title", bodyKey: "guide.step3Body" },
  { targetId: "guide-advanced-filter", titleKey: "guide.step4Title", bodyKey: "guide.step4Body" },
  { targetId: "guide-trade-button", skipIfAbsent: true, titleKey: "guide.step5Title", bodyKey: "guide.step5Body" },
  // Mobile: footer nav. Desktop: footer nav is md:hidden → sidebar nav, tooltip to its right.
  { targetId: "guide-footer-nav", fallbackTargetId: "guide-sidebar-nav", fallbackPlacement: "right", titleKey: "guide.step6Title", bodyKey: "guide.step6Body", fallbackBodyKey: "guide.step6BodyDesktop" },
]

const SPOTLIGHT_PADDING = 8
const TOOLTIP_GAP = 8

function stepWouldBeSkipped(stepConfig: StepConfig): boolean {
  const els = document.querySelectorAll<HTMLElement>(`[data-guide-id="${stepConfig.targetId}"]`)
  if (stepConfig.skipIfAbsent && els.length === 0) return true
  const allHidden = (id: string) => {
    const nodes = document.querySelectorAll<HTMLElement>(`[data-guide-id="${id}"]`)
    if (nodes.length === 0) return false
    return Array.from(nodes).every(e => e.offsetParent === null)
  }
  if (!allHidden(stepConfig.targetId)) return false
  if (stepConfig.fallbackTargetId && !allHidden(stepConfig.fallbackTargetId)) return false
  return true
}

export function P2PGuide() {
  const { t } = useTranslations()
  const { isGuideActive, currentStep, nextStep, goToStep, completeGuide } = useGuideStore()
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)
  // Tracks which step owns the current targetRect; -1 means stale/unset
  const rectStepRef = useRef(-1)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : 0
  )
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200
  )

  const readTargetRect = useCallback(() => {
    const config = STEP_CONFIG[currentStep]
    if (!config) return

    const findVisible = (id: string) => {
      const all = document.querySelectorAll<HTMLElement>(`[data-guide-id="${id}"]`)
      return { el: Array.from(all).find(e => e.offsetParent !== null) ?? null, count: all.length }
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
        if (currentStep >= GUIDE_TOTAL_STEPS - 1) {
          completeGuide()
        } else {
          nextStep()
        }
      }
      return
    }

    let { top, left, bottom, right } = el.getBoundingClientRect()

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
    setViewportHeight(window.innerHeight)
    setViewportWidth(window.innerWidth)
    rectStepRef.current = currentStep
  }, [currentStep, nextStep, completeGuide])

  useEffect(() => {
    if (!isGuideActive) return
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
  const skippedByStep = useMemo(
    () => isGuideActive ? STEP_CONFIG.map(s => stepWouldBeSkipped(s)) : [],
    [isGuideActive, currentStep], // eslint-disable-line react-hooks/exhaustive-deps
  )

  if (!isGuideActive) return null

  const config = STEP_CONFIG[currentStep]

  // Hide spotlight and tooltip while readTargetRect is resolving; keep backdrop visible
  // so the overlay doesn't flash away and back during step transitions.
  const tooltipReady = rectStepRef.current === currentStep
  const isLastStep = currentStep === GUIDE_TOTAL_STEPS - 1
  const isEffectiveLastStep = isLastStep || STEP_CONFIG.slice(currentStep + 1).every((_, i) => skippedByStep[currentStep + 1 + i])

  const handlePrevStep = () => {
    let step = currentStep - 1
    while (step > 0 && skippedByStep[step]) step--
    goToStep(step)
  }

  // Exclude skipped steps from the counter so numbering stays contiguous
  const effectiveTotalSteps = STEP_CONFIG.filter((_, i) => !skippedByStep[i]).length
  const effectiveCurrentStep = STEP_CONFIG.slice(0, currentStep + 1).filter((_, i) => !skippedByStep[i]).length

  const spotlightTop = targetRect ? targetRect.top - SPOTLIGHT_PADDING : 0
  const spotlightLeft = targetRect ? targetRect.left - SPOTLIGHT_PADDING : 0
  const spotlightWidth = targetRect ? targetRect.width + SPOTLIGHT_PADDING * 2 : 0
  const spotlightHeight = targetRect ? targetRect.height + SPOTLIGHT_PADDING * 2 : 0

  // "right" placement: tooltip sits to the right of the spotlight (used for sidebar nav on desktop)
  const isRightPlacement = usingFallback && config.fallbackPlacement === "right"

  // Default placement: above or below based on where the target sits in the viewport
  const targetMidY = targetRect ? targetRect.top + targetRect.height / 2 : viewportHeight / 2
  const tooltipBelow = targetMidY < viewportHeight * 0.55

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
            <div className="flex items-start justify-between mb-2">
              <p id="p2p-guide-title" className="font-bold text-base text-slate-1200 leading-snug pe-2">{t(config.titleKey)}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={completeGuide}
                aria-label={t("guide.closeLabel")}
                className="shrink-0 p-0 h-auto text-grayscale-600 hover:text-slate-1200"
              >
                ✕
              </Button>
            </div>

            <p className="text-sm text-grayscale-600 mb-5 leading-relaxed">{t(usingFallback && config.fallbackBodyKey ? config.fallbackBodyKey : config.bodyKey)}</p>

            {/* Bottom row: step counter left, buttons right */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-grayscale-600">
                {effectiveCurrentStep}/{effectiveTotalSteps}
              </span>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
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
                  onClick={isEffectiveLastStep ? completeGuide : nextStep}
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
