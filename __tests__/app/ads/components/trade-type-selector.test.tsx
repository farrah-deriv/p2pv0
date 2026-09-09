import jest from "jest"
import { render, screen } from "@testing-library/react"
import { TradeTypeSelector } from "@/app/ads/components/ui/trade-type-selector"
import { resolveTranslation } from "@/lib/i18n/translation-tree"
import en from "@/lib/i18n/translations/en.json"
import es from "@/lib/i18n/translations/es.json"

let activeTree = en

jest.mock("@/lib/i18n/use-translations", () => ({
  useTranslations: () => ({
    t: (key, params) => resolveTranslation(activeTree, en, key, params),
    locale: "en",
  }),
}))

describe("TradeTypeSelector", () => {
  const buyTab = () => screen.getByTestId("ad-form-radio-type-buy")
  const sellTab = () => screen.getByTestId("ad-form-radio-type-sell")

  beforeEach(() => {
    activeTree = en
  })

  it("localizes the tab labels instead of rendering hardcoded English", () => {
    activeTree = es

    render(<TradeTypeSelector value="buy" onChange={jest.fn()} currency="USD" />)

    expect(buyTab()).toHaveTextContent("Comprar USD")
    expect(sellTab()).toHaveTextContent("Vender USD")
    expect(screen.queryByText("Buy USD")).not.toBeInTheDocument()
    expect(screen.queryByText("Sell USD")).not.toBeInTheDocument()
  })

  it("leaves the English labels unchanged", () => {
    render(<TradeTypeSelector value="buy" onChange={jest.fn()} currency="USD" />)

    expect(buyTab()).toHaveTextContent("Buy USD")
    expect(sellTab()).toHaveTextContent("Sell USD")
  })

  it("renders the account currency it is given rather than a hardcoded USD", () => {
    render(<TradeTypeSelector value="sell" onChange={jest.fn()} currency="EUR" />)

    expect(buyTab()).toHaveTextContent("Buy EUR")
    expect(sellTab()).toHaveTextContent("Sell EUR")
  })
})
