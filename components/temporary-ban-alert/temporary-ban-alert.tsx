import { Alert } from "@/components/ui/alert"
import { formatDateTime } from "@/lib/utils"

interface TemporaryBanAlertProps {
  tempBanUntil: number
}

export function TemporaryBanAlert({ tempBanUntil }: TemporaryBanAlertProps) {
  const banUntil = formatDateTime(tempBanUntil)

  return (
    <Alert variant="warning">
      <div className="text-sm">
        {`Your account is temporarily restricted. Some actions will be unavailable until ${banUntil}.`}
      </div>
    </Alert>
  )
}
