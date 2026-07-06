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

export function appendSelectedPaymentMethodId(
  selectedIds: (string | number)[],
  createdId: string | number,
  maxSelected = 3,
): string[] {
  const normalizedCreatedId = normalizePaymentMethodId(createdId)
  const normalizedSelectedIds = normalizePaymentMethodIds(selectedIds)

  if (
    normalizedSelectedIds.length >= maxSelected ||
    normalizedSelectedIds.includes(normalizedCreatedId)
  ) {
    return normalizedSelectedIds
  }

  return [...normalizedSelectedIds, normalizedCreatedId]
}

export function sortPaymentMethodsSelectedFirst<T extends { id: string | number }>(
  methods: T[],
  selectedIds: (string | number)[],
): T[] {
  const normalizedSelectedIds = normalizePaymentMethodIds(selectedIds)
  const selected: T[] = []
  const unselected: T[] = []

  for (const method of methods) {
    if (isPaymentMethodIdSelected(normalizedSelectedIds, method.id)) {
      selected.push(method)
    } else {
      unselected.push(method)
    }
  }

  selected.sort(
    (a, b) =>
      normalizedSelectedIds.indexOf(normalizePaymentMethodId(a.id)) -
      normalizedSelectedIds.indexOf(normalizePaymentMethodId(b.id)),
  )

  return [...selected, ...unselected]
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
