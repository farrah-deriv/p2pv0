import jest from "jest"
import { fireEvent, render, screen } from "@testing-library/react"
import { P2PRegionNotSupported } from "@/components/p2p-region-not-supported"
import { getHomeUrl } from "@/lib/utils"

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}))

jest.mock("@/lib/i18n/use-translations", () => ({
  useTranslations: () => ({
    t: (key: string) => key,
    locale: "en",
  }),
}))

jest.mock("@/lib/utils", () => {
  const actual = jest.requireActual("@/lib/utils")
  return {
    ...actual,
    getHomeUrl: jest.fn(() => "https://home.deriv.com/dashboard/home"),
  }
})

describe("P2PRegionNotSupported", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "" },
    })
  })

  it("renders title, description, illustration, and Back to Home", () => {
    render(<P2PRegionNotSupported />)

    expect(screen.getByText("p2pRegion.title")).toBeInTheDocument()
    expect(screen.getByText("p2pRegion.description")).toBeInTheDocument()
    expect(screen.getByAltText("p2pRegion.illustrationAlt")).toHaveAttribute(
      "src",
      "/icons/illustration-unsupported-region.png",
    )
    expect(screen.getByRole("button", { name: "p2pRegion.backToHome" })).toBeInTheDocument()
  })

  // The destination is unconditional — the component reads no signup version, so
  // v1 and v2 accounts resolve to the same Home URL. `section` must be the string
  // "home": passing anything else (previously a boolean) falls through to
  // getHomeUrl's fallback and yields a relative navigation.
  it("sends the user to Deriv Home on Back to Home", () => {
    render(<P2PRegionNotSupported />)

    fireEvent.click(screen.getByRole("button", { name: "p2pRegion.backToHome" }))

    expect(getHomeUrl).toHaveBeenCalledWith("home")
    expect(window.location.href).toBe("https://home.deriv.com/dashboard/home")
  })
})
