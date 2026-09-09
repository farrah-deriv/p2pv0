import jest from "jest"
import { render, screen } from "@testing-library/react"
import { PriceTypeSelector } from "@/app/ads/components/ui/price-type-selector"

jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: jest.fn(() => false),
}))

jest.mock("@/lib/i18n/use-translations", () => ({
  useTranslations: () => ({
    t: (key) => key,
    locale: "ar",
  }),
}))

describe("PriceTypeSelector", () => {
  it("sets dir=rtl on root for Arabic locale", () => {
    const { container } = render(
      <PriceTypeSelector
        marketPrice={100}
        value="fixed"
        onChange={jest.fn()}
        isFloatingRateEnabled
      />,
    )

    const root = container.querySelector('[dir="rtl"]')
    expect(root).toBeInTheDocument()
    expect(screen.getByRole("combobox")).toBeInTheDocument()
  })
})
