import { StandaloneArrowLeftFillIcon } from "@deriv/quill-icons/Standalone"

import { cn } from "@/lib/utils"
import { RTL_MIRROR_ICON } from "@/lib/rtl"

type BackArrowIconProps = {
  alt?: string
  width?: number
  height?: number
  className?: string
}

export function BackArrowIcon({ alt, width = 24, height = 24, className }: BackArrowIconProps) {
  return (
    <>
      <StandaloneArrowLeftFillIcon
        width={width}
        height={height}
        className={cn(RTL_MIRROR_ICON, className)}
        aria-hidden="true"
      />
      {alt && <span className="sr-only">{alt}</span>}
    </>
  )
}
