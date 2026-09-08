import { formatPaymentMethodName, maskAccountNumber } from "@/lib/utils"

export function normalizePaymentMethodId(id: string | number | null | undefined): string {
  if (id == null) return ""
  return String(id)
}

export function isPaymentMethodIdSelected(
  selectedIds: (string | number)[],
  methodId: string | number,
): boolean {
  const normalized = normalizePaymentMethodId(methodId)
  return selectedIds.some((id) => normalizePaymentMethodId(id) === normalized)
}

export function normalizePaymentMethodIds(ids: (string | number)[]): string[] {
  return ids.map(normalizePaymentMethodId).filter(Boolean)
}

export function toNumericPaymentMethodIds(ids: (string | number)[]): number[] {
  return normalizePaymentMethodIds(ids)
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id))
}

/** Mirrors mobile SelectSellPaymentMethodSheet._handleConfirm — keep order, drop stale ids. */
export function resolveSelectedUserPaymentMethodIds<T extends { id: string | number }>(
  selectedIds: (string | number)[],
  methods: T[],
): string[] {
  const methodIds = new Set(methods.map((method) => normalizePaymentMethodId(method.id)))

  return normalizePaymentMethodIds(selectedIds).filter((id) => methodIds.has(id))
}

export function isPaymentMethodCompatibleWithAdvert(
  method: { method: string },
  acceptedMethods: string[] | undefined,
): boolean {
  if (!acceptedMethods?.length) return false

  return acceptedMethods.some(
    (accepted) => method.method.toLowerCase() === accepted.toLowerCase(),
  )
}

export function filterPaymentMethodsForAdvert<T extends { method: string }>(
  methods: T[],
  acceptedMethods: string[] | undefined,
): T[] {
  if (!acceptedMethods?.length) return []

  return methods.filter((method) => isPaymentMethodCompatibleWithAdvert(method, acceptedMethods))
}

export type PaymentSelectionEntry = "loading" | "selection" | "catalogue"

/**
 * Decide what a "select payment methods" entry point should open, so an empty
 * selection sheet whose only action is "add" is never shown (issue #1387).
 *
 * `eligibleMethods` is the caller's own notion of what may be picked here: the
 * whole saved list on the advert form (the advert has no accepted methods yet),
 * or `filterPaymentMethodsForAdvert(...)` during place order. `methods` stays
 * the raw unfiltered list because pagination is driven off it.
 */
export function resolvePaymentSelectionEntry({
  isLoading,
  hasNextPage,
  methods,
  eligibleMethods,
  currentSelection = [],
}: {
  isLoading: boolean
  hasNextPage: boolean
  methods: unknown[]
  eligibleMethods: unknown[]
  currentSelection?: (string | number)[]
}): PaymentSelectionEntry {
  // Amending an existing selection is not starting from nothing — never skip.
  if (normalizePaymentMethodIds(currentSelection).length > 0) return "selection"

  if (isLoading) return "loading"
  if (eligibleMethods.length > 0) return "selection"

  // Nothing eligible yet, but a compatible method can sit on a later page —
  // exhaust pagination before concluding empty. A short/empty first page has
  // no next page, so this also short-circuits the "no saved methods" case.
  if (methods.length > 0 && hasNextPage) return "loading"

  return "catalogue"
}

export function upsertUserPaymentMethod<T extends { id: string | number }>(
  methods: T[],
  created: T,
): T[] {
  const createdId = normalizePaymentMethodId(created.id)

  return [
    ...methods.filter((method) => normalizePaymentMethodId(method.id) !== createdId),
    created,
  ]
}

/** Merge create response into list immediately — mirrors mobile onSuccessMyAds callback. */
export function mergeCreatedPaymentMethodIntoList<T extends { id: string | number; method: string }>(
  methods: T[],
  created: T | undefined,
  acceptedMethods?: string[],
): T[] {
  if (!created) return methods

  if (
    acceptedMethods?.length &&
    !isPaymentMethodCompatibleWithAdvert(created, acceptedMethods)
  ) {
    return methods
  }

  return upsertUserPaymentMethod(methods, created)
}

export function getCreatedPaymentMethodId(data: unknown): string | undefined {
  if (!data) return undefined

  if (Array.isArray(data)) {
    const first = data[0] as { id?: string | number } | undefined
    return first?.id != null ? String(first.id) : undefined
  }

  const record = data as { id?: string | number }
  return record.id != null ? String(record.id) : undefined
}

/** Mirrors mobile `UserPaymentMethod.isBankTransfer`. */
export function isBankTransferMethod(method: { method: string }): boolean {
  return method.method.toLowerCase() === "bank_transfer"
}

/**
 * Mirrors mobile `_hasSelectedEwalletWithSameKey` — banks may share a key;
 * e-wallets may not be selected twice for the same `method` key.
 */
export function hasSelectedEwalletWithSameKey<
  T extends { id: string | number; method: string },
>(methods: T[], selectedIds: (string | number)[], candidate: T): boolean {
  if (isBankTransferMethod(candidate)) return false

  const selectedKeys = new Set(
    methods
      .filter(
        (method) =>
          isPaymentMethodIdSelected(selectedIds, method.id) && !isBankTransferMethod(method),
      )
      .map((method) => method.method.toLowerCase()),
  )

  return selectedKeys.has(candidate.method.toLowerCase())
}

/**
 * Max-3 + same-key e-wallet guard — selected rows stay interactive so they can
 * be deselected. Mirrors mobile `_isSelectionDisabled`.
 */
export function isUserPaymentMethodSelectionDisabled<
  T extends { id: string | number; method: string },
>(
  methods: T[],
  selectedIds: (string | number)[],
  methodId: string | number,
  maxSelected = 3,
): boolean {
  if (isPaymentMethodIdSelected(selectedIds, methodId)) return false
  if (normalizePaymentMethodIds(selectedIds).length >= maxSelected) return true

  const candidate = methods.find(
    (method) => normalizePaymentMethodId(method.id) === normalizePaymentMethodId(methodId),
  )
  if (!candidate) return false

  return hasSelectedEwalletWithSameKey(methods, selectedIds, candidate)
}

export function appendSelectedPaymentMethodId(
  selectedIds: (string | number)[],
  createdId: string | number,
  maxSelected = 3,
  methods?: { id: string | number; method: string }[],
): string[] {
  const normalizedCreatedId = normalizePaymentMethodId(createdId)
  const normalizedSelectedIds = normalizePaymentMethodIds(selectedIds)

  if (
    normalizedSelectedIds.length >= maxSelected ||
    normalizedSelectedIds.includes(normalizedCreatedId)
  ) {
    return normalizedSelectedIds
  }

  if (methods?.length) {
    const created = methods.find(
      (method) => normalizePaymentMethodId(method.id) === normalizedCreatedId,
    )
    if (created && hasSelectedEwalletWithSameKey(methods, selectedIds, created)) {
      return normalizedSelectedIds
    }
  }

  // Append so creating a method does not jump it to the top of the sheet.
  return [...normalizedSelectedIds, normalizedCreatedId]
}

export function sortPaymentMethodsSelectedFirst<T extends { id: string | number }>(
  methods: T[],
  selectedIds: (string | number)[],
): T[] {
  return sortSelectableItemsSelectedFirst(methods, selectedIds, (method) => method.id)
}

/**
 * Keep [orderIds] stable during an open session and only append newly appeared
 * methods. Selected items stay in place (no pin-to-top).
 */
export function applyStablePaymentMethodOrder<T>(
  methods: T[],
  orderIds: string[],
  getId: (item: T) => string | number,
): T[] {
  const byId = new Map(
    methods.map((method) => [normalizePaymentMethodId(getId(method)), method] as const),
  )
  const ordered: T[] = []

  for (const id of orderIds) {
    const method = byId.get(id)
    if (method) {
      ordered.push(method)
      byId.delete(id)
    }
  }

  for (const method of methods) {
    const id = normalizePaymentMethodId(getId(method))
    if (byId.has(id)) {
      ordered.push(method)
      byId.delete(id)
    }
  }

  return ordered
}

/** Build the initial session order from current method encounter order. */
export function buildSessionPaymentMethodOrderIds<T>(
  methods: T[],
  getId: (item: T) => string | number,
): string[] {
  return methods.map((method) => normalizePaymentMethodId(getId(method)))
}

/** Append any method ids that are not yet in the session order. */
export function extendSessionPaymentMethodOrderIds<T>(
  orderIds: string[],
  methods: T[],
  getId: (item: T) => string | number,
): string[] {
  const seen = new Set(orderIds)
  const next = [...orderIds]
  for (const method of methods) {
    const id = normalizePaymentMethodId(getId(method))
    if (!seen.has(id)) {
      seen.add(id)
      next.push(id)
    }
  }
  return next
}

export function sortSelectableItemsSelectedFirst<T>(
  items: T[],
  selectedIds: (string | number)[],
  getId: (item: T) => string | number,
): T[] {
  const normalizedSelectedIds = normalizePaymentMethodIds(selectedIds)
  const selected: T[] = []
  const unselected: T[] = []

  for (const item of items) {
    const id = getId(item)
    if (isPaymentMethodIdSelected(normalizedSelectedIds, id)) {
      selected.push(item)
    } else {
      unselected.push(item)
    }
  }

  selected.sort(
    (a, b) =>
      normalizedSelectedIds.indexOf(normalizePaymentMethodId(getId(a))) -
      normalizedSelectedIds.indexOf(normalizePaymentMethodId(getId(b))),
  )

  return [...selected, ...unselected]
}

export function formatPaymentMethodAccountLine(
  displayName: string,
  accountValue: string | undefined,
  t: (key: string) => string,
): string {
  const name = formatPaymentMethodName(displayName, t)
  if (!accountValue) return name

  return `${name} - ${maskAccountNumber(accountValue)}`
}

function readPaymentMethodFieldValue(
  fields: Record<string, unknown> | undefined,
  key: string,
): string {
  if (!fields) return ""
  const raw = fields[key]
  if (raw == null) return ""
  if (typeof raw === "object" && raw !== null && "value" in raw) {
    const value = (raw as { value?: unknown }).value
    return value != null ? String(value) : ""
  }
  return String(raw)
}

/**
 * Two-line selection copy:
 * 1) bank name (bank) / payment method name (e-wallet)
 * 2) account only
 */
export function getPaymentMethodSelectionLines(
  method: {
    display_name: string
    type?: string
    method?: string
    fields?: Record<string, unknown>
  },
  t: (key: string) => string,
): { title: string; subtitle: string } {
  const displayName = formatPaymentMethodName(method.display_name, t)
  const isBank =
    method.type === "bank" || method.method?.toLowerCase() === "bank_transfer"
  const bankName =
    readPaymentMethodFieldValue(method.fields, "bank_name") ||
    readPaymentMethodFieldValue(method.fields, "bankName")
  const account = readPaymentMethodFieldValue(method.fields, "account")

  if (isBank) {
    return {
      title: bankName || displayName,
      subtitle: account,
    }
  }

  return {
    title: displayName,
    subtitle: account,
  }
}

/** Chip label in the selected section — `Name account`. */
export function getPaymentMethodSelectionChipLabel(
  method: {
    display_name: string
    type?: string
    method?: string
    fields?: Record<string, unknown>
  },
  t: (key: string) => string,
): string {
  const { title, subtitle } = getPaymentMethodSelectionLines(method, t)
  if (!subtitle) return title
  return `${title} ${subtitle}`
}
