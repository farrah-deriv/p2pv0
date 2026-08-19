import jest from "jest"
import { render, screen } from "@testing-library/react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useGuideStore } from "@/stores/guide-store"
import { P2PGuideIntro } from "@/components/p2p-guide/p2p-guide-intro"

jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: jest.fn(),
}))

jest.mock("@/stores/guide-store", () => ({
  useGuideStore: jest.fn(),
}))

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}))

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

// Stub the two primitives so we can assert which one mounted without
// depending on Radix/vaul internals. The real Dialog vs Drawer swap is
// what left two overlays on screen when isMobile was still undefined.
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="guide-intro-dialog">{children}</div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: () => null,
  DialogDescription: () => null,
}))

jest.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="guide-intro-drawer">{children}</div>
  ),
  DrawerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerTitle: () => null,
  DrawerDescription: () => null,
}))

const mockUseIsMobile = useIsMobile as jest.MockedFunction<typeof useIsMobile>
const mockUseGuideStore = useGuideStore as jest.MockedFunction<typeof useGuideStore>

describe("P2PGuideIntro", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Fresh object per test so a write to isIntroOpen (or any other field)
    // cannot leak into the next case. jest.clearAllMocks() only resets call
    // counts on the fns; it does not replace a module-scope object.
    mockUseGuideStore.mockImplementation((selector?: (state: any) => unknown) => {
      const state = {
        isIntroOpen: true,
        dismissIntro: jest.fn(),
        startGuide: jest.fn(),
        setGuideStartedFromIntro: jest.fn(),
        requestAskAmy: jest.fn(),
      }
      return selector ? selector(state) : state
    })
  })

  it("renders nothing while isMobile is undefined", () => {
    // The first paint must not pick Dialog or Drawer — that's the
    // Dialog→Drawer swap that instantiated both Radix portals (two overlays).
    mockUseIsMobile.mockReturnValue(undefined)

    const { container } = render(<P2PGuideIntro />)

    expect(container.firstChild).toBeNull()
    expect(screen.queryByTestId("guide-intro-dialog")).not.toBeInTheDocument()
    expect(screen.queryByTestId("guide-intro-drawer")).not.toBeInTheDocument()
  })

  it("mounts Dialog (not Drawer) when isMobile is false", () => {
    mockUseIsMobile.mockReturnValue(false)

    render(<P2PGuideIntro />)

    expect(screen.getByTestId("guide-intro-dialog")).toBeInTheDocument()
    expect(screen.queryByTestId("guide-intro-drawer")).not.toBeInTheDocument()
  })

  it("mounts Drawer (not Dialog) when isMobile is true", () => {
    mockUseIsMobile.mockReturnValue(true)

    render(<P2PGuideIntro />)

    expect(screen.getByTestId("guide-intro-drawer")).toBeInTheDocument()
    expect(screen.queryByTestId("guide-intro-dialog")).not.toBeInTheDocument()
  })
})
