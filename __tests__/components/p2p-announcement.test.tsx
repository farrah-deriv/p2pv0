import jest from "jest"
import { render, screen, fireEvent } from "@testing-library/react"
import { P2PAnnouncement } from "@/components/p2p-announcement/p2p-announcement"

jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: jest.fn(),
}))

jest.mock("@/lib/i18n/use-translations", () => ({
  useTranslations: () => ({
    t: (key: string) => key,
    locale: "en",
  }),
}))

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}))

import { useIsMobile } from "@/hooks/use-mobile"

const mockUseIsMobile = useIsMobile as jest.MockedFunction<typeof useIsMobile>

describe("P2PAnnouncement", () => {
  const onDismiss = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("desktop layout (Dialog)", () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(false)
    })

    it("renders whats-new title translation key", () => {
      render(<P2PAnnouncement kind="whatsNew" onDismiss={onDismiss} />)
      expect(screen.getByText("p2pAnnouncement.whatsNew.title")).toBeInTheDocument()
    })

    it("renders whats-new primary CTA", () => {
      render(<P2PAnnouncement kind="whatsNew" onDismiss={onDismiss} />)
      expect(screen.getByText("p2pAnnouncement.whatsNew.primaryCta")).toBeInTheDocument()
    })

    it("calls onDismiss when primary CTA is clicked", () => {
      render(<P2PAnnouncement kind="whatsNew" onDismiss={onDismiss} />)
      fireEvent.click(screen.getByText("p2pAnnouncement.whatsNew.primaryCta"))
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it("renders whats-coming with secondary CTA", () => {
      render(<P2PAnnouncement kind="whatsComing" onDismiss={onDismiss} />)
      expect(screen.getByText("p2pAnnouncement.whatsComing.secondaryCta")).toBeInTheDocument()
    })

    it("calls onDismiss when secondary CTA is clicked", () => {
      render(<P2PAnnouncement kind="whatsComing" onDismiss={onDismiss} />)
      fireEvent.click(screen.getByText("p2pAnnouncement.whatsComing.secondaryCta"))
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })
  })

  describe("mobile layout (Drawer)", () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true)
    })

    it("renders whats-new title in drawer", () => {
      render(<P2PAnnouncement kind="whatsNew" onDismiss={onDismiss} />)
      expect(screen.getByText("p2pAnnouncement.whatsNew.title")).toBeInTheDocument()
    })

    it("renders whats-new description key", () => {
      render(<P2PAnnouncement kind="whatsNew" onDismiss={onDismiss} />)
      expect(
        screen.getByText("p2pAnnouncement.whatsNew.description"),
      ).toBeInTheDocument()
    })
  })
})
