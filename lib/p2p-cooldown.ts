import type { PermissionCooldown } from "@/services/api/api-auth"
import { formatAppDate } from "@/lib/format-date"
import { localeToBcp47, type Locale } from "@/lib/i18n/config"

// Action-lock codes the P2P cooldown alert reacts to. A `withdraw_lock` blocks
// funds leaving the account, which on P2P is selling; a `deposit_lock` blocks
// funds coming in, which is buying. Kept as constants so an unexpected backend
// value never accidentally matches.
export const WITHDRAW_LOCK = "withdraw_lock"
export const DEPOSIT_LOCK = "deposit_lock"

// The credential change that triggered a cooldown. Drives which noun the copy
// uses ("You changed your password/email address/phone number"). Unknown codes
// fall back to "password" so the alert still reads sensibly.
export type CooldownReason = "password" | "email" | "phone"

const REASON_BY_CODE: Record<string, CooldownReason> = {
  password_change: "password",
  email_change: "email",
  phone_change: "phone",
}

export interface P2PActionLock {
  /** ISO-8601 timestamp when the lock lifts. */
  expiresAt: string
  /** What the client changed to trigger the cooldown. */
  reason: CooldownReason
}

/** Which P2P actions the current cooldowns block. */
export interface P2PCooldownLocks {
  /** Set when withdrawals are locked (blocks selling on P2P). */
  sell: P2PActionLock | null
  /** Set when deposits are locked (blocks buying on P2P). */
  buy: P2PActionLock | null
}

const isActive = (cooldown: PermissionCooldown): boolean => {
  if (cooldown.status !== "active") return false
  const expiry = Date.parse(cooldown.expires_at)
  return Number.isFinite(expiry) && expiry > Date.now()
}

const reasonFor = (cooldown: PermissionCooldown): CooldownReason =>
  REASON_BY_CODE[cooldown.cooldown_type_code] ?? "password"

// When several cooldowns share an action lock, the client stays blocked until
// the last one lifts — so keep the furthest-out expiry.
const laterLock = (current: P2PActionLock | null, cooldown: PermissionCooldown): P2PActionLock => {
  const candidate: P2PActionLock = { expiresAt: cooldown.expires_at, reason: reasonFor(cooldown) }
  if (!current) return candidate
  return Date.parse(cooldown.expires_at) > Date.parse(current.expiresAt) ? candidate : current
}

/**
 * Reduce the raw cooldown list to the active buy/sell locks the P2P alert needs.
 * Returns `{ buy: null, sell: null }` when nothing is locked.
 */
export function getP2PCooldownLocks(cooldowns: PermissionCooldown[] | undefined | null): P2PCooldownLocks {
  const locks: P2PCooldownLocks = { sell: null, buy: null }
  if (!cooldowns) return locks

  for (const cooldown of cooldowns) {
    if (!isActive(cooldown)) continue
    if (cooldown.action_lock === WITHDRAW_LOCK) {
      locks.sell = laterLock(locks.sell, cooldown)
    } else if (cooldown.action_lock === DEPOSIT_LOCK) {
      locks.buy = laterLock(locks.buy, cooldown)
    }
  }

  return locks
}

type Translator = (key: string, params?: Record<string, string | number>) => string

const CREDENTIAL_KEY: Record<CooldownReason, string> = {
  password: "cooldown.credentialPassword",
  email: "cooldown.credentialEmail",
  phone: "cooldown.credentialPhone",
}

/** Locale-aware time label (e.g. "6:18 pm") for the cooldown deadline. */
function formatCooldownTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(localeToBcp47(locale), {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export interface CooldownCopy {
  title: string
  description: string
}

/**
 * Resolve the cooldown alert title + description for a given lock. Used by the
 * order-placement error mapper to render the cooldown copy. `type` is the
 * blocked P2P action: `"sell"` for a withdraw lock, `"buy"` for a deposit lock.
 */
export function getCooldownCopy(
  type: "buy" | "sell",
  lock: P2PActionLock,
  t: Translator,
  locale: Locale,
): CooldownCopy {
  const expiresAt = new Date(lock.expiresAt)
  const time = formatCooldownTime(expiresAt, locale)
  const date = formatAppDate(expiresAt, locale)
  const credential = t(CREDENTIAL_KEY[lock.reason])

  return type === "sell"
    ? {
        title: t("cooldown.sellUnavailableTitle"),
        description: t("cooldown.sellUnavailableDescription", { credential, date, time }),
      }
    : {
        title: t("cooldown.buyUnavailableTitle"),
        description: t("cooldown.buyUnavailableDescription", { credential, date, time }),
      }
}
