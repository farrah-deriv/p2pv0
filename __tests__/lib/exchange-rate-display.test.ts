import jest from "jest"
import { buildExchangeRateLine } from "@/lib/exchange-rate-display"

describe("buildExchangeRateLine", () => {
  it("LTR: rate and payment first, account currency muted suffix", () => {
    const line = buildExchangeRateLine(374, "AMD", "USD", false)
    expect(line.primary).toBe("374.00 AMD")
    expect(line.muted).toBe("/USD")
    expect(line.mutedPosition).toBe("suffix")
  })

  it("RTL: account currency muted prefix, then payment and rate", () => {
    const line = buildExchangeRateLine(374, "AMD", "USD", true)
    expect(line.muted).toBe("USD/")
    expect(line.primary).toBe("AMD 374.00")
    expect(line.mutedPosition).toBe("prefix")
  })
})
