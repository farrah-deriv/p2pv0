import { buildRateChangeCopyParams } from "@/lib/buy-sell/rate-change-copy"

const decimalsOf = (value: string) => (value.split(".")[1] ?? "").length

describe("buildRateChangeCopyParams", () => {
  // The reported defect: the dialog interpolated the NEW rate into both the
  // "you're buying X for ..." clause and the "the new rate is ..." clause, so it
  // printed one value twice (152.00 and 152.000000) and never named the old rate.
  it("names the quoted rate and the new rate as two different values", () => {
    const params = buildRateChangeCopyParams({ amount: "1", oldRate: 150, newRate: 152 })

    expect(params.oldRate).not.toBe(params.newRate)
    expect(params.oldRate).toBe("150.00")
    expect(params.newRate).toBe("152.00")
  })

  it("renders both rates at the same precision", () => {
    const params = buildRateChangeCopyParams({ amount: "1", oldRate: 150, newRate: 152.5 })

    expect(decimalsOf(params.oldRate)).toBe(decimalsOf(params.newRate))
    expect(decimalsOf(params.newRate)).toBe(2)
  })

  it("quotes the total the buyer was shown, derived from the old rate", () => {
    const params = buildRateChangeCopyParams({ amount: "10", oldRate: 150, newRate: 152 })

    expect(params.oldTotal).toBe("1500.00")
    expect(params.newTotal).toBe("1520.00")
  })

  it("treats a blank or unparseable amount as zero rather than NaN", () => {
    const params = buildRateChangeCopyParams({ amount: "", oldRate: 150, newRate: 152 })

    expect(params.oldTotal).toBe("0.00")
    expect(params.newTotal).toBe("0.00")
    expect(params.oldRate).toBe("150.00")
  })
})
