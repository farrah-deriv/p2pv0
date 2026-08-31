import {
  RANGE_OVERLAP_ERROR_CODE,
  readAdvertApiErrors,
  readConflictingAdvertRange,
  readExistingAdvertId,
} from "@/lib/ads/range-overlap-error"

describe("readAdvertApiErrors", () => {
  it("reads the array the ad mutation hooks attach to the thrown error", () => {
    const errors = [{ code: RANGE_OVERLAP_ERROR_CODE }]
    expect(readAdvertApiErrors({ errors })).toBe(errors)
  })

  it("reads a nested response body", () => {
    const errors = [{ code: RANGE_OVERLAP_ERROR_CODE }]
    expect(readAdvertApiErrors({ response: { data: { errors } } })).toBe(errors)
  })

  it("returns an empty list for anything else", () => {
    expect(readAdvertApiErrors(null)).toEqual([])
    expect(readAdvertApiErrors("boom")).toEqual([])
    expect(readAdvertApiErrors({ errors: "not-an-array" })).toEqual([])
  })
})

describe("readExistingAdvertId", () => {
  /**
   * The shape the backend actually sends: specifics nested under `detail`, alongside a
   * per-entry `status`. Mirrors a captured 400 verbatim except for the code.
   */
  function realRejection(existingAdvertId: unknown, code: string = RANGE_OVERLAP_ERROR_CODE) {
    return { errors: [{ status: 400, code, detail: { existing_advert_id: existingAdvertId } }] }
  }

  it("returns the id the backend nests under detail", () => {
    expect(readExistingAdvertId(realRejection(4282))).toBe("4282")
  })

  it("accepts a string id under detail and trims it", () => {
    expect(readExistingAdvertId(realRejection(" 4282 "))).toBe("4282")
  })

  it("ignores a nested id attached to a different rejection", () => {
    expect(readExistingAdvertId(realRejection(4282, "InsufficientBalance"))).toBeNull()
  })

  it("returns null when detail carries no usable id", () => {
    expect(readExistingAdvertId(realRejection(undefined))).toBeNull()
    expect(readExistingAdvertId(realRejection(""))).toBeNull()
    expect(readExistingAdvertId(realRejection("   "))).toBeNull()
    expect(readExistingAdvertId(realRejection(Number.NaN))).toBeNull()
  })

  it("survives a detail that is absent or not an object", () => {
    expect(readExistingAdvertId({ errors: [{ status: 400, code: RANGE_OVERLAP_ERROR_CODE }] })).toBeNull()
    expect(readExistingAdvertId({ errors: [{ code: RANGE_OVERLAP_ERROR_CODE, detail: "nope" }] })).toBeNull()
    expect(readExistingAdvertId({ errors: [{ code: RANGE_OVERLAP_ERROR_CODE, detail: null }] })).toBeNull()
  })

  // Legacy/fallback path: kept so any caller that still sends the id flat keeps working.
  it("falls back to a flat existing_advert_id when there is no detail", () => {
    const error = { errors: [{ code: RANGE_OVERLAP_ERROR_CODE, existing_advert_id: 4821 }] }
    expect(readExistingAdvertId(error)).toBe("4821")
  })

  it("prefers the nested id when both levels carry one", () => {
    const error = {
      errors: [
        {
          status: 400,
          code: RANGE_OVERLAP_ERROR_CODE,
          detail: { existing_advert_id: 4282 },
          existing_advert_id: 4821,
        },
      ],
    }
    expect(readExistingAdvertId(error)).toBe("4282")
  })
})

describe("readConflictingAdvertRange", () => {
  const advert = {
    data: {
      id: 4821,
      minimum_order_amount: 1,
      maximum_order_amount: 5,
      account_currency: "USD",
    },
  }

  it("describes the occupied range", () => {
    expect(readConflictingAdvertRange("4821", advert)).toEqual({
      id: "4821",
      minimumOrderAmount: 1,
      maximumOrderAmount: 5,
      currency: "USD",
    })
  })

  it("coerces numeric strings the API sometimes returns", () => {
    const stringy = { data: { ...advert.data, minimum_order_amount: "1.5", maximum_order_amount: "5" } }
    expect(readConflictingAdvertRange("4821", stringy)).toEqual(
      expect.objectContaining({ minimumOrderAmount: 1.5, maximumOrderAmount: 5 }),
    )
  })

  it("returns null when the ad cannot be described, so the caller keeps the generic dialog", () => {
    expect(readConflictingAdvertRange("4821", {})).toBeNull()
    expect(readConflictingAdvertRange("4821", { data: {} })).toBeNull()
    expect(
      readConflictingAdvertRange("4821", { data: { ...advert.data, account_currency: undefined } }),
    ).toBeNull()
    expect(
      readConflictingAdvertRange("4821", { data: { ...advert.data, maximum_order_amount: null } }),
    ).toBeNull()
    expect(readConflictingAdvertRange("", advert)).toBeNull()
  })
})
