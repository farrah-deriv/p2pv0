import {
  getP2PCooldownLocks,
  getCooldownCopy,
  WITHDRAW_LOCK,
  DEPOSIT_LOCK,
  type P2PActionLock,
} from "@/lib/p2p-cooldown"
import type { PermissionCooldown } from "@/services/api/api-auth"

// Build a cooldown relative to "now" so tests don't rot as wall-clock time
// passes (isActive compares expires_at against Date.now()).
const HOUR = 60 * 60 * 1000
const isoIn = (ms: number) => new Date(Date.now() + ms).toISOString()

const cooldown = (overrides: Partial<PermissionCooldown> = {}): PermissionCooldown => ({
  cooldown_type_code: "password_change",
  action_lock: WITHDRAW_LOCK,
  expires_at: isoIn(HOUR),
  status: "active",
  ...overrides,
})

describe("getP2PCooldownLocks", () => {
  it("returns { sell: null, buy: null } for undefined input", () => {
    expect(getP2PCooldownLocks(undefined)).toEqual({ sell: null, buy: null })
  })

  it("returns { sell: null, buy: null } for null input", () => {
    expect(getP2PCooldownLocks(null)).toEqual({ sell: null, buy: null })
  })

  it("returns { sell: null, buy: null } for an empty list", () => {
    expect(getP2PCooldownLocks([])).toEqual({ sell: null, buy: null })
  })

  it("maps withdraw_lock to the sell lock and deposit_lock to the buy lock", () => {
    const sellExpiry = isoIn(HOUR)
    const buyExpiry = isoIn(2 * HOUR)
    const locks = getP2PCooldownLocks([
      cooldown({ action_lock: WITHDRAW_LOCK, expires_at: sellExpiry, cooldown_type_code: "password_change" }),
      cooldown({ action_lock: DEPOSIT_LOCK, expires_at: buyExpiry, cooldown_type_code: "email_change" }),
    ])

    expect(locks.sell).toEqual<P2PActionLock>({ expiresAt: sellExpiry, reason: "password" })
    expect(locks.buy).toEqual<P2PActionLock>({ expiresAt: buyExpiry, reason: "email" })
  })

  it("keeps the furthest-out expiry when several cooldowns share an action lock", () => {
    const earlier = isoIn(HOUR)
    const later = isoIn(3 * HOUR)
    const locks = getP2PCooldownLocks([
      cooldown({ action_lock: WITHDRAW_LOCK, expires_at: earlier, cooldown_type_code: "email_change" }),
      cooldown({ action_lock: WITHDRAW_LOCK, expires_at: later, cooldown_type_code: "phone_change" }),
    ])

    expect(locks.sell?.expiresAt).toBe(later)
    // The kept lock's reason comes from the furthest-out cooldown.
    expect(locks.sell?.reason).toBe("phone")
  })

  it("keeps the furthest-out expiry regardless of list order", () => {
    const earlier = isoIn(HOUR)
    const later = isoIn(3 * HOUR)
    const locks = getP2PCooldownLocks([
      cooldown({ action_lock: WITHDRAW_LOCK, expires_at: later, cooldown_type_code: "phone_change" }),
      cooldown({ action_lock: WITHDRAW_LOCK, expires_at: earlier, cooldown_type_code: "email_change" }),
    ])

    expect(locks.sell?.expiresAt).toBe(later)
    expect(locks.sell?.reason).toBe("phone")
  })

  it("skips a cooldown whose status is active but whose expiry is already in the past", () => {
    const locks = getP2PCooldownLocks([
      cooldown({ action_lock: WITHDRAW_LOCK, expires_at: isoIn(-HOUR), status: "active" }),
    ])

    expect(locks).toEqual({ sell: null, buy: null })
  })

  it("skips a cooldown whose status is not active", () => {
    const locks = getP2PCooldownLocks([
      cooldown({ action_lock: WITHDRAW_LOCK, expires_at: isoIn(HOUR), status: "expired" }),
    ])

    expect(locks).toEqual({ sell: null, buy: null })
  })

  it("skips a cooldown with an invalid expires_at (NaN from Date.parse)", () => {
    const locks = getP2PCooldownLocks([
      cooldown({ action_lock: WITHDRAW_LOCK, expires_at: "not-a-date" }),
    ])

    expect(locks).toEqual({ sell: null, buy: null })
  })

  it("skips a cooldown with a null action_lock", () => {
    const locks = getP2PCooldownLocks([
      cooldown({ action_lock: null, expires_at: isoIn(HOUR) }),
    ])

    expect(locks).toEqual({ sell: null, buy: null })
  })

  it("ignores an unrelated action_lock value", () => {
    const locks = getP2PCooldownLocks([
      cooldown({ action_lock: "trade_lock", expires_at: isoIn(HOUR) }),
    ])

    expect(locks).toEqual({ sell: null, buy: null })
  })

  it("falls back to the password reason for an unknown cooldown_type_code", () => {
    const locks = getP2PCooldownLocks([
      cooldown({ action_lock: WITHDRAW_LOCK, cooldown_type_code: "face_scan", expires_at: isoIn(HOUR) }),
    ])

    expect(locks.sell?.reason).toBe("password")
  })
})

describe("getCooldownCopy", () => {
  // Stub translator echoes the key (plus JSON params) so assertions can check
  // exactly which key/params were used without depending on locale strings.
  const t = (key: string, params?: Record<string, string | number>) =>
    params ? `${key}::${JSON.stringify(params)}` : key

  const lock: P2PActionLock = {
    expiresAt: "2026-09-12T06:18:52.052527+00:00",
    reason: "password",
  }

  it("uses the sell title + description for a withdraw (sell) lock", () => {
    const copy = getCooldownCopy("sell", lock, t, "en")

    expect(copy.title).toBe("cooldown.sellUnavailableTitle")
    expect(copy.description).toContain("cooldown.sellUnavailableDescription")
  })

  it("uses the buy title + description for a deposit (buy) lock", () => {
    const copy = getCooldownCopy("buy", lock, t, "en")

    expect(copy.title).toBe("cooldown.buyUnavailableTitle")
    expect(copy.description).toContain("cooldown.buyUnavailableDescription")
  })

  it("passes the credential key matching the lock reason plus a date and time", () => {
    const copy = getCooldownCopy("sell", { ...lock, reason: "email" }, t, "en")

    expect(copy.description).toContain("cooldown.credentialEmail")
    expect(copy.description).toContain('"date":')
    expect(copy.description).toContain('"time":')
  })

  it("maps each reason to its credential key", () => {
    for (const [reason, key] of [
      ["password", "cooldown.credentialPassword"],
      ["email", "cooldown.credentialEmail"],
      ["phone", "cooldown.credentialPhone"],
    ] as const) {
      const copy = getCooldownCopy("buy", { ...lock, reason }, t, "en")
      expect(copy.description).toContain(key)
    }
  })
})
