import { OrderErrorAction } from "./order-error-actions"

export interface OrderErrorDispatcherDeps {
  queryClient: { invalidateQueries: (opts: { queryKey: unknown[] }) => void }
  router: { push: (path: string) => void }
  handleClose: () => void
  track: (event: string, props?: Record<string, unknown>) => void
  retry: () => void
  isV1Signup: boolean
  advertisementsQueryKey: readonly unknown[]
  getHomeUrl: (isV1: boolean, page: string) => string
}

export function createOrderErrorDispatcher(deps: OrderErrorDispatcherDeps) {
  return function dispatch(action: OrderErrorAction, ctx: { orderId?: number } = {}): void {
    const { queryClient, router, handleClose, track, retry, isV1Signup, advertisementsQueryKey, getHomeUrl } = deps

    switch (action) {
      case OrderErrorAction.Dismiss:
      case OrderErrorAction.GoBack:
      case OrderErrorAction.AdjustAmount:
      case OrderErrorAction.ConfirmRateSlippage:
        return
      case OrderErrorAction.Retry:
        track("ek_retry_order_markets_advert_sheet")
        retry()
        return
      case OrderErrorAction.OpenLiveChat:
        track("ek_open_live_chat_markets_advert_sheet")
        if (typeof window !== "undefined" && window.Intercom) {
          window.Intercom("show")
        }
        return
      case OrderErrorAction.ViewOtherAds:
        track("ek_view_other_ads_markets_advert_sheet")
        queryClient.invalidateQueries({ queryKey: advertisementsQueryKey })
        handleClose()
        return
      case OrderErrorAction.ManageBlocked:
        track("ek_manage_blocked_markets_advert_sheet")
        handleClose()
        router.push("/profile?tab=blocked")
        return
      case OrderErrorAction.ViewActiveOrder:
        track("ek_view_active_order_markets_advert_sheet")
        handleClose()
        router.push(ctx.orderId ? `/orders/${ctx.orderId}` : "/orders")
        return
      case OrderErrorAction.ViewProfile:
        track("ek_view_profile_markets_advert_sheet")
        handleClose()
        router.push("/profile")
        return
      case OrderErrorAction.ViewOrders:
        track("ek_view_orders_markets_advert_sheet")
        handleClose()
        router.push("/orders")
        return
      case OrderErrorAction.VerifyAccount:
        track("ek_verify_account_markets_advert_sheet")
        window.location.href = getHomeUrl(isV1Signup, "poi")
        return
      case OrderErrorAction.CompleteAssessment:
        track("ek_complete_assessment_markets_advert_sheet")
        window.location.href = getHomeUrl(isV1Signup, "financialAssessment")
        return
      case OrderErrorAction.GoToMarkets:
        track("ek_go_to_markets_p2p_disabled_error")
        handleClose()
        router.push("/")
        return
    }
  }
}
