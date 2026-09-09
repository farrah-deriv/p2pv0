import { create } from "zustand"

export const PAYMENT_METHOD_ELEVATION_CANCELLED = "PaymentMethodElevationCancelled"

export type PaymentMethodElevationAction =
  | "p2p_payment_method_create"
  | "p2p_payment_method_update"
  | "p2p_payment_method_delete"

interface SessionElevationState {
  isOpen: boolean
  action: PaymentMethodElevationAction | null
  pendingResolver: ((result: unknown | false) => void) | null
  pendingRejecter: ((error: unknown) => void) | null
  pendingAction: (() => Promise<unknown>) | null
  requestElevation: <T>(action: PaymentMethodElevationAction, onVerified: () => Promise<T>) => Promise<T | false>
  complete: () => Promise<void>
  close: () => void
}

const waitForNextFrame = () =>
  new Promise<void>((resolve) => {
    if (typeof window === "undefined") {
      resolve()
      return
    }
    window.requestAnimationFrame(() => resolve())
  })

export const useSessionElevationStore = create<SessionElevationState>((set, get) => ({
  isOpen: false,
  action: null,
  pendingResolver: null,
  pendingRejecter: null,
  pendingAction: null,
  requestElevation: <T>(action: PaymentMethodElevationAction, onVerified: () => Promise<T>) =>
    new Promise<unknown | false>((resolve, reject) => {
      get().pendingResolver?.(false)
      set({
        isOpen: true,
        action,
        pendingResolver: resolve,
        pendingRejecter: reject,
        pendingAction: onVerified,
      })
    }) as Promise<T | false>,
  complete: async () => {
    const { pendingAction, pendingRejecter, pendingResolver } = get()
    try {
      const result = await pendingAction?.()
      pendingResolver?.(result)
    } catch (error) {
      pendingRejecter?.(error)
    } finally {
      // Let the mutation caller close its own payment-method panel (or open
      // its error UI) while the elevation loader still covers the page.
      await waitForNextFrame()
      // Do not close or clear a newer request that started while this one was
      // finishing (for example during a rapid retry after an API failure).
      if (get().pendingAction === pendingAction) {
        set({
          isOpen: false,
          action: null,
          pendingResolver: null,
          pendingRejecter: null,
          pendingAction: null,
        })
      }
    }
  },
  close: () => {
    get().pendingResolver?.(false)
    set({
      isOpen: false,
      action: null,
      pendingResolver: null,
      pendingRejecter: null,
      pendingAction: null,
    })
  },
}))
