import {
  appendSelectedPaymentMethodId,
  getCreatedPaymentMethodId,
  hasSelectedEwalletWithSameKey,
  isBankTransferMethod,
  isPaymentMethodIdSelected,
  isUserPaymentMethodSelectionDisabled,
  mergeCreatedPaymentMethodIntoList,
  normalizePaymentMethodId,
  resolveSelectedUserPaymentMethodIds,
  sortPaymentMethodsSelectedFirst,
  toNumericPaymentMethodIds,
} from "@/lib/payment-methods/payment-method-selection-utils"

describe("payment-method-selection-utils", () => {
  it("matches string and numeric payment method ids", () => {
    expect(isPaymentMethodIdSelected(["1", "2"], 1)).toBe(true)
    expect(isPaymentMethodIdSelected([1, 2], "3")).toBe(false)
    expect(normalizePaymentMethodId(42)).toBe("42")
  })

  it("sorts selected methods first using normalized ids", () => {
    const methods = [
      { id: 1, name: "a" },
      { id: "2", name: "b" },
      { id: 3, name: "c" },
    ]

    expect(
      sortPaymentMethodsSelectedFirst(methods, ["3", 2]).map((method) => method.id),
    ).toEqual(["2", 3, 1])
  })

  it("converts selected ids to numeric payload values", () => {
    expect(toNumericPaymentMethodIds(["1", 2, "bad"])).toEqual([1, 2])
  })

  it("drops stale ids on confirm while preserving order", () => {
    const methods = [{ id: 2 }, { id: 5 }]

    expect(resolveSelectedUserPaymentMethodIds(["1", "2", "5"], methods)).toEqual(["2", "5"])
    expect(resolveSelectedUserPaymentMethodIds([2, "5"], methods)).toEqual(["2", "5"])
  })

  it("reads created payment method id from object or array payloads", () => {
    expect(getCreatedPaymentMethodId(undefined)).toBeUndefined()
    expect(getCreatedPaymentMethodId({ id: 7 })).toBe("7")
    expect(getCreatedPaymentMethodId([{ id: "9" }])).toBe("9")
  })

  it("identifies bank_transfer methods case-insensitively", () => {
    expect(isBankTransferMethod({ method: "bank_transfer" })).toBe(true)
    expect(isBankTransferMethod({ method: "Bank_Transfer" })).toBe(true)
    expect(isBankTransferMethod({ method: "airtel" })).toBe(false)
  })

  it("guards appendSelectedPaymentMethodId against max selection and duplicates", () => {
    expect(appendSelectedPaymentMethodId(["1", "2", "3"], "4")).toEqual(["1", "2", "3"])
    expect(appendSelectedPaymentMethodId(["1", "2"], "2")).toEqual(["1", "2"])
    expect(appendSelectedPaymentMethodId(["1"], 2)).toEqual(["2", "1"])
  })

  it("blocks appending same-key e-wallet but allows multiple bank transfers", () => {
    const methods = [
      { id: 1, method: "airtel" },
      { id: 2, method: "airtel" },
      { id: 3, method: "bank_transfer" },
      { id: 4, method: "bank_transfer" },
      { id: 5, method: "ecocash" },
    ]

    expect(appendSelectedPaymentMethodId(["1"], 2, 3, methods)).toEqual(["1"])
    expect(appendSelectedPaymentMethodId(["1"], 5, 3, methods)).toEqual(["5", "1"])
    expect(appendSelectedPaymentMethodId(["3"], 4, 3, methods)).toEqual(["4", "3"])
    expect(hasSelectedEwalletWithSameKey(methods, ["1"], methods[1])).toBe(true)
    expect(hasSelectedEwalletWithSameKey(methods, ["3"], methods[3])).toBe(false)
  })

  it("disables unselected methods at max selection or same-key e-wallet", () => {
    const methods = [
      { id: 1, method: "airtel" },
      { id: 2, method: "Airtel" },
      { id: 3, method: "bank_transfer" },
      { id: 4, method: "bank_transfer" },
      { id: 5, method: "ecocash" },
    ]

    expect(isUserPaymentMethodSelectionDisabled(methods, ["1"], 2)).toBe(true)
    expect(isUserPaymentMethodSelectionDisabled(methods, ["1"], 5)).toBe(false)
    expect(isUserPaymentMethodSelectionDisabled(methods, ["1"], 3)).toBe(false)
    expect(isUserPaymentMethodSelectionDisabled(methods, ["3"], 4)).toBe(false)
    expect(isUserPaymentMethodSelectionDisabled(methods, ["1", "3", "4"], 5)).toBe(true)
    expect(isUserPaymentMethodSelectionDisabled(methods, ["1", "3", "4"], 1)).toBe(false)
  })

  it("merges created payment methods immediately for selector reopen", () => {
    const existing = [{ id: "1", method: "bank_transfer" }]
    const created = { id: "2", method: "ecocash" }

    expect(mergeCreatedPaymentMethodIntoList(existing, created)).toEqual([...existing, created])
    expect(
      mergeCreatedPaymentMethodIntoList(existing, created, ["ecocash"]),
    ).toEqual([...existing, created])
    expect(
      mergeCreatedPaymentMethodIntoList(existing, created, ["bank_transfer"]),
    ).toEqual(existing)
  })
})
