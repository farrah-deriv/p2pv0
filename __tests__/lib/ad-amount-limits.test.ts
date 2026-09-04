import {
  amountToInputValue,
  areAmountsValid,
  getAmountLimitsSubmissionError,
  getVisibleAmountErrors,
  parseAmountInput,
  resolveSyncedAmountInput,
  validateAmountFields,
} from "@/lib/ads/ad-amount-limits"

/** Echoes the key back so assertions read as the rule that fired. */
const t = (key: string) => key

describe("parseAmountInput", () => {
  it("returns the number for a complete entry", () => {
    expect(parseAmountInput("1")).toBe(1)
    expect(parseAmountInput("0.5")).toBe(0.5)
    expect(parseAmountInput("1.50")).toBe(1.5)
    expect(parseAmountInput("10")).toBe(10)
  })

  it("treats a zero the user actually typed as a real zero, not as absent", () => {
    expect(parseAmountInput("0")).toBe(0)
  })

  it("returns undefined for a blank entry instead of coercing it to 0", () => {
    // The `|| 0` in the old push-up is what let an empty field reach the API
    // as minimum_order_amount: 0.
    expect(parseAmountInput("")).toBeUndefined()
    expect(parseAmountInput("   ")).toBeUndefined()
    expect(parseAmountInput(undefined)).toBeUndefined()
  })

  it("returns undefined for a half-typed entry instead of coercing it to 0", () => {
    expect(parseAmountInput(".")).toBeUndefined()
    expect(parseAmountInput("-")).toBeUndefined()
    expect(parseAmountInput("0.")).toBeUndefined()
    expect(parseAmountInput("1.")).toBeUndefined()
  })

  it("returns undefined for junk rather than a partial parse", () => {
    expect(parseAmountInput("abc")).toBeUndefined()
    expect(parseAmountInput("1abc")).toBeUndefined()
  })
})

describe("resolveSyncedAmountInput", () => {
  it("keeps the user's own string when the parent echoes the same number back", () => {
    // The reported wipe: typing the leading "0" of "0.5" pushed 0 upward, and
    // amountToInputValue(0) === "" erased the field mid-keystroke.
    expect(resolveSyncedAmountInput(0, "0")).toBe("0")
    expect(resolveSyncedAmountInput(1, "1")).toBe("1")
  })

  it("keeps a trailing zero the user is still typing", () => {
    // "1.50" parses to 1.5; echoing "1.5" back deleted the caret's character.
    expect(resolveSyncedAmountInput(1.5, "1.50")).toBe("1.50")
  })

  it("never overwrites a half-typed entry the parent cannot represent", () => {
    expect(resolveSyncedAmountInput(undefined, "0.")).toBe("0.")
    expect(resolveSyncedAmountInput(1, "1.")).toBe("1.")
  })

  it("still accepts a genuinely external value, so edit-mode prefill works", () => {
    expect(resolveSyncedAmountInput(5, "")).toBe("5")
    expect(resolveSyncedAmountInput(25, "5")).toBe("25")
  })

  it("clears the field when the parent genuinely has no value", () => {
    expect(resolveSyncedAmountInput(undefined, "")).toBe("")
  })
})

describe("validateAmountFields", () => {
  it("accepts the reported entry Total=10 / Min=1 / Max=5", () => {
    // The exact values from the report, which rendered two "must be greater
    // than 0" errors while showing 1 and 5.
    expect(
      validateAmountFields({ totalAmount: "10", minAmount: "1", maxAmount: "5" }, t),
    ).toEqual({})
  })

  it("accepts sub-unit limits", () => {
    expect(
      validateAmountFields({ totalAmount: "10", minAmount: "0.5", maxAmount: "5" }, t),
    ).toEqual({})
  })

  it("rejects a zero minimum", () => {
    const errors = validateAmountFields(
      { totalAmount: "10", minAmount: "0", maxAmount: "5" },
      t,
    )
    expect(errors.minAmount).toBe("adForm.minAmountGreaterThanZero")
  })

  it("rejects a zero maximum", () => {
    const errors = validateAmountFields(
      { totalAmount: "10", minAmount: "1", maxAmount: "0" },
      t,
    )
    expect(errors.maxAmount).toBe("adForm.maxAmountGreaterThanZero")
  })

  it("reports a blank field as required, not as a zero", () => {
    const errors = validateAmountFields(
      { totalAmount: "10", minAmount: "", maxAmount: "5" },
      t,
    )
    expect(errors.minAmount).toBe("adForm.minAmountRequired")
  })

  it("blames only the maximum when the maximum is the field that is zero", () => {
    // A max of 0 must not also report "minimum must be less than maximum" —
    // that is the contradictory-validation class this whole change is about.
    const errors = validateAmountFields(
      { totalAmount: "10", minAmount: "1", maxAmount: "0" },
      t,
    )
    expect(errors.maxAmount).toBe("adForm.maxAmountGreaterThanZero")
    expect(errors.minAmount).toBeUndefined()
  })

  it("rejects min above max", () => {
    const errors = validateAmountFields(
      { totalAmount: "10", minAmount: "6", maxAmount: "5" },
      t,
    )
    expect(errors.minAmount).toBe("adForm.minAmountLessThanMax")
    expect(errors.maxAmount).toBe("adForm.maxAmountGreaterThanMin")
  })

  it("rejects a maximum above the total", () => {
    const errors = validateAmountFields(
      { totalAmount: "10", minAmount: "1", maxAmount: "50" },
      t,
    )
    expect(errors.maxAmount).toBe("adForm.maxAmountLessThanTotal")
  })

  it("does not invent a min-above-max error from two blank fields", () => {
    const errors = validateAmountFields(
      { totalAmount: "10", minAmount: "", maxAmount: "" },
      t,
    )
    expect(errors.minAmount).toBe("adForm.minAmountRequired")
    expect(errors.maxAmount).toBe("adForm.maxAmountRequired")
  })
})

describe("getVisibleAmountErrors", () => {
  const values = { totalAmount: "10", minAmount: "0", maxAmount: "5" }

  it("hides an error for a field the user has not finished with", () => {
    // Typing the leading "0" of "0.5" must not render "must be greater than 0".
    const errors = validateAmountFields(values, t)
    const visible = getVisibleAmountErrors(errors, {
      totalAmount: false,
      minAmount: false,
      maxAmount: false,
    })
    expect(visible.minAmount).toBeUndefined()
  })

  it("shows the error once the field has been blurred", () => {
    const errors = validateAmountFields(values, t)
    const visible = getVisibleAmountErrors(errors, {
      totalAmount: false,
      minAmount: true,
      maxAmount: false,
    })
    expect(visible.minAmount).toBe("adForm.minAmountGreaterThanZero")
  })
})

describe("areAmountsValid", () => {
  it("is independent of which fields have been touched", () => {
    // Validity must come from the values, display from `touched`. Entangling
    // them is what let an untouched zero keep Next enabled.
    expect(
      areAmountsValid({ totalAmount: "10", minAmount: "1", maxAmount: "5" }, t),
    ).toBe(true)
    expect(
      areAmountsValid({ totalAmount: "10", minAmount: "0", maxAmount: "5" }, t),
    ).toBe(false)
  })

  it("is false while any field is blank or half-typed", () => {
    expect(
      areAmountsValid({ totalAmount: "10", minAmount: "", maxAmount: "5" }, t),
    ).toBe(false)
    expect(
      areAmountsValid({ totalAmount: "10", minAmount: "0.", maxAmount: "5" }, t),
    ).toBe(false)
  })
})

describe("getAmountLimitsSubmissionError", () => {
  it("allows a well-formed set of limits through", () => {
    expect(
      getAmountLimitsSubmissionError(
        { totalAmount: 10, minAmount: 1, maxAmount: 5 },
        t,
      ),
    ).toBeNull()
  })

  it("blocks the advert that was actually published with a 0.00 floor", () => {
    // advert 175397: Buy BND, Active, order limit 0.00 - 1.00.
    expect(
      getAmountLimitsSubmissionError(
        { totalAmount: 10, minAmount: 0, maxAmount: 1 },
        t,
      ),
    ).toBe("adForm.minAmountGreaterThanZero")
  })

  it("blocks a zero maximum", () => {
    expect(
      getAmountLimitsSubmissionError(
        { totalAmount: 10, minAmount: 1, maxAmount: 0 },
        t,
      ),
    ).toBe("adForm.maxAmountGreaterThanZero")
  })

  it("blocks a missing limit instead of posting it as 0", () => {
    // `minimum_order_amount: finalData.minAmount || 0` turned undefined into a
    // valid-looking zero. Nothing may reconstruct that.
    expect(
      getAmountLimitsSubmissionError(
        { totalAmount: 10, minAmount: undefined, maxAmount: 5 },
        t,
      ),
    ).toBe("adForm.minAmountGreaterThanZero")
    expect(
      getAmountLimitsSubmissionError(
        { totalAmount: 10, minAmount: 1, maxAmount: undefined },
        t,
      ),
    ).toBe("adForm.maxAmountGreaterThanZero")
  })

  it("blocks min above max", () => {
    expect(
      getAmountLimitsSubmissionError(
        { totalAmount: 10, minAmount: 6, maxAmount: 5 },
        t,
      ),
    ).toBe("adForm.minAmountLessThanMax")
  })

  it("blocks max above the total", () => {
    expect(
      getAmountLimitsSubmissionError(
        { totalAmount: 10, minAmount: 1, maxAmount: 50 },
        t,
      ),
    ).toBe("adForm.maxAmountLessThanTotal")
  })

  it("names the total, not the maximum, when the total is the broken field", () => {
    // total=0 with plausible limits used to come back as "maximum exceeds
    // total", pointing the user at a field that is fine.
    expect(
      getAmountLimitsSubmissionError(
        { totalAmount: 0, minAmount: 1, maxAmount: 5 },
        t,
      ),
    ).toBe("adForm.totalAmountGreaterThanZero")
  })

  it("blocks a zero or missing total", () => {
    expect(
      getAmountLimitsSubmissionError(
        { totalAmount: 0, minAmount: 1, maxAmount: 5 },
        t,
      ),
    ).toBe("adForm.totalAmountGreaterThanZero")
    expect(
      getAmountLimitsSubmissionError(
        { totalAmount: undefined, minAmount: 1, maxAmount: 5 },
        t,
      ),
    ).toBe("adForm.totalAmountGreaterThanZero")
  })

  it("accepts the string forms the wizard stores in formData", () => {
    expect(
      getAmountLimitsSubmissionError(
        { totalAmount: "10", minAmount: "1", maxAmount: "5" },
        t,
      ),
    ).toBeNull()
    expect(
      getAmountLimitsSubmissionError(
        { totalAmount: "10", minAmount: "", maxAmount: "5" },
        t,
      ),
    ).toBe("adForm.minAmountGreaterThanZero")
  })
})

describe("amountToInputValue", () => {
  it("renders a real zero as a zero rather than blanking the field", () => {
    expect(amountToInputValue(0)).toBe("0")
  })

  it("renders absent values as an empty field", () => {
    expect(amountToInputValue(undefined)).toBe("")
    expect(amountToInputValue("")).toBe("")
  })

  it("renders ordinary amounts unchanged", () => {
    expect(amountToInputValue(5)).toBe("5")
    expect(amountToInputValue("1.50")).toBe("1.50")
  })
})
