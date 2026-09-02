import { createOrderErrorDispatcher, type OrderErrorDispatcherDeps } from "@/lib/orders/order-error-dispatcher"
import { OrderErrorAction } from "@/lib/orders/order-error-actions"

const ADS_QUERY_KEY = ["api", "buy-sell", "advertisements"]

const makeDeps = (overrides: Partial<OrderErrorDispatcherDeps> = {}): OrderErrorDispatcherDeps => ({
  queryClient: { invalidateQueries: jest.fn() },
  router: { push: jest.fn() },
  handleClose: jest.fn(),
  track: jest.fn(),
  retry: jest.fn(),
  advertisementsQueryKey: ADS_QUERY_KEY,
  getHomeUrl: (page: string) => `https://home.example.com/${page}`,
  ...overrides,
})

describe("createOrderErrorDispatcher", () => {
  // ─── No-op actions ──────────────────────────────────────────────────────────

  describe("no-op actions", () => {
    it.each([
      OrderErrorAction.Dismiss,
      OrderErrorAction.GoBack,
      OrderErrorAction.AdjustAmount,
      OrderErrorAction.ConfirmRateSlippage,
    ])("%s is a no-op", (action) => {
      const deps = makeDeps()
      createOrderErrorDispatcher(deps)(action)
      expect(deps.handleClose).not.toHaveBeenCalled()
      expect(deps.router.push).not.toHaveBeenCalled()
      expect(deps.retry).not.toHaveBeenCalled()
      expect(deps.queryClient.invalidateQueries).not.toHaveBeenCalled()
    })
  })

  // ─── Retry ──────────────────────────────────────────────────────────────────

  describe("Retry", () => {
    it("tracks and calls retry function", () => {
      const deps = makeDeps()
      createOrderErrorDispatcher(deps)(OrderErrorAction.Retry)
      expect(deps.track).toHaveBeenCalledWith("ek_retry_order_markets_advert_sheet")
      expect(deps.retry).toHaveBeenCalledTimes(1)
      expect(deps.handleClose).not.toHaveBeenCalled()
    })
  })

  // ─── ViewOtherAds ────────────────────────────────────────────────────────────

  describe("ViewOtherAds", () => {
    it("invalidates advertisements query and closes sidebar", () => {
      const deps = makeDeps()
      createOrderErrorDispatcher(deps)(OrderErrorAction.ViewOtherAds)
      expect(deps.queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ADS_QUERY_KEY })
      expect(deps.handleClose).toHaveBeenCalledTimes(1)
    })

    it("tracks the event", () => {
      const deps = makeDeps()
      createOrderErrorDispatcher(deps)(OrderErrorAction.ViewOtherAds)
      expect(deps.track).toHaveBeenCalledWith("ek_view_other_ads_markets_advert_sheet")
    })
  })

  // ─── ManageBlocked ───────────────────────────────────────────────────────────

  describe("ManageBlocked", () => {
    it("closes sidebar and navigates to blocked tab", () => {
      const deps = makeDeps()
      createOrderErrorDispatcher(deps)(OrderErrorAction.ManageBlocked)
      expect(deps.handleClose).toHaveBeenCalledTimes(1)
      expect(deps.router.push).toHaveBeenCalledWith("/profile?tab=blocked")
    })
  })

  // ─── ViewActiveOrder ─────────────────────────────────────────────────────────

  describe("ViewActiveOrder", () => {
    it("routes to specific order when orderId provided", () => {
      const deps = makeDeps()
      createOrderErrorDispatcher(deps)(OrderErrorAction.ViewActiveOrder, { orderId: 42 })
      expect(deps.router.push).toHaveBeenCalledWith("/orders/42")
    })

    it("routes to orders list when orderId absent", () => {
      const deps = makeDeps()
      createOrderErrorDispatcher(deps)(OrderErrorAction.ViewActiveOrder)
      expect(deps.router.push).toHaveBeenCalledWith("/orders")
    })

    it("closes sidebar in both cases", () => {
      const deps = makeDeps()
      createOrderErrorDispatcher(deps)(OrderErrorAction.ViewActiveOrder, { orderId: 7 })
      expect(deps.handleClose).toHaveBeenCalledTimes(1)
    })
  })

  // ─── ViewProfile ─────────────────────────────────────────────────────────────

  describe("ViewProfile", () => {
    it("closes sidebar and navigates to profile", () => {
      const deps = makeDeps()
      createOrderErrorDispatcher(deps)(OrderErrorAction.ViewProfile)
      expect(deps.handleClose).toHaveBeenCalledTimes(1)
      expect(deps.router.push).toHaveBeenCalledWith("/profile")
    })
  })

  // ─── ViewOrders ──────────────────────────────────────────────────────────────

  describe("ViewOrders", () => {
    it("closes sidebar and navigates to orders", () => {
      const deps = makeDeps()
      createOrderErrorDispatcher(deps)(OrderErrorAction.ViewOrders)
      expect(deps.handleClose).toHaveBeenCalledTimes(1)
      expect(deps.router.push).toHaveBeenCalledWith("/orders")
    })
  })

  // ─── OpenLiveChat ────────────────────────────────────────────────────────────

  describe("OpenLiveChat", () => {
    it("calls window.Intercom('show') when Intercom is available", () => {
      const mockIntercom = jest.fn()
      ;(window as unknown as Record<string, unknown>).Intercom = mockIntercom
      const deps = makeDeps()
      createOrderErrorDispatcher(deps)(OrderErrorAction.OpenLiveChat)
      expect(deps.track).toHaveBeenCalledWith("ek_open_live_chat_markets_advert_sheet")
      expect(mockIntercom).toHaveBeenCalledWith("show")
      delete (window as unknown as Record<string, unknown>).Intercom
    })

    it("does not throw when Intercom is unavailable", () => {
      delete (window as unknown as Record<string, unknown>).Intercom
      const deps = makeDeps()
      expect(() => createOrderErrorDispatcher(deps)(OrderErrorAction.OpenLiveChat)).not.toThrow()
    })
  })

  // ─── VerifyAccount ───────────────────────────────────────────────────────────

  describe("VerifyAccount", () => {
    it("sets window.location.href to POI verification URL", () => {
      const deps = makeDeps()
      createOrderErrorDispatcher(deps)(OrderErrorAction.VerifyAccount)
      expect(window.location.href).toContain("poi")
    })

    it("calls getHomeUrl with the poi page", () => {
      const getHomeUrl = jest.fn(() => "https://example.com/poi")
      const deps = makeDeps({ getHomeUrl })
      createOrderErrorDispatcher(deps)(OrderErrorAction.VerifyAccount)
      expect(getHomeUrl).toHaveBeenCalledWith("poi")
    })
  })

  // ─── CompleteAssessment ──────────────────────────────────────────────────────

  describe("CompleteAssessment", () => {
    it("sets window.location.href to financial assessment URL", () => {
      const getHomeUrl = jest.fn(() => "https://example.com/financialAssessment")
      const deps = makeDeps({ getHomeUrl })
      createOrderErrorDispatcher(deps)(OrderErrorAction.CompleteAssessment)
      expect(getHomeUrl).toHaveBeenCalledWith("financialAssessment")
    })
  })
})
