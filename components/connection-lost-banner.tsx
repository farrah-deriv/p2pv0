"use client"

import { useEffect, useState } from "react"
import { Snackbar } from "@deriv-com/quill-ui-v2"
import { StandaloneTriangleExclamationRegularIcon } from "@deriv/quill-icons/Standalone"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useWebSocketContext } from "@/contexts/websocket-context"

// SnackbarProps doesn't declare data-*/aria-* attributes in its type, but the
// component spreads unknown props onto its root div at runtime — spreading through
// an indexed record (rather than passing them as literal JSX props) sidesteps the
// excess-property check without resorting to an `any` cast.
const a11yProps: Record<string, string> = {
  "data-testid": "connection-lost-banner",
  "aria-live": "assertive",
}

export function ConnectionLostBanner() {
  const { t } = useTranslations()
  const { hasExhaustedRetries } = useWebSocketContext()
  const [dismissed, setDismissed] = useState(false)

  // Re-arm the banner for the next exhausted-retries episode — a dismissal
  // shouldn't stay in effect once the connection has recovered and drops again.
  useEffect(() => {
    if (hasExhaustedRetries) setDismissed(false)
  }, [hasExhaustedRetries])

  if (!hasExhaustedRetries || dismissed) return null

  return (
    <Snackbar
      {...a11yProps}
      type="fail"
      position="top-center"
      autoHideDuration={0}
      iconLeft={
        <StandaloneTriangleExclamationRegularIcon iconSize="sm" fill="currentColor" aria-hidden="true" />
      }
      message={t("connection.lostMessage")}
      showButton
      buttonLabel={t("connection.refreshCta")}
      onButtonClick={() => window.location.reload()}
      showClose
      onClose={() => setDismissed(true)}
    />
  )
}
