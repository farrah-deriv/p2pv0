import jest from "jest"

import {
  PAYMENT_METHOD_ELEVATION_CANCELLED,
  useSessionElevationStore,
} from "@/stores/session-elevation-store"
import {
  isPaymentMethodElevationCancelled,
} from "@/hooks/use-api-queries"

describe("useSessionElevationStore", () => {
  beforeEach(() => {
    useSessionElevationStore.getState().close()
  })

  it("opens an elevation request and resolves it after verification completes", async () => {
    const onVerified = jest.fn().mockResolvedValue({ id: 42 })
    const request = useSessionElevationStore
      .getState()
      .requestElevation("p2p_payment_method_create", onVerified)

    expect(useSessionElevationStore.getState().isOpen).toBe(true)
    expect(useSessionElevationStore.getState().action).toBe("p2p_payment_method_create")

    await useSessionElevationStore.getState().complete()

    await expect(request).resolves.toEqual({ id: 42 })
    expect(onVerified).toHaveBeenCalledTimes(1)
    expect(useSessionElevationStore.getState().isOpen).toBe(false)
    expect(useSessionElevationStore.getState().pendingAction).toBeNull()
  })

  it("resolves a cancelled elevation request as false and clears pending state", async () => {
    const request = useSessionElevationStore
      .getState()
      .requestElevation("p2p_payment_method_delete", async () => undefined)

    useSessionElevationStore.getState().close()

    await expect(request).resolves.toBe(false)
    expect(useSessionElevationStore.getState().isOpen).toBe(false)
    expect(useSessionElevationStore.getState().action).toBeNull()
    expect(useSessionElevationStore.getState().pendingResolver).toBeNull()
  })
})

describe("isPaymentMethodElevationCancelled", () => {
  it("recognises the cancellation error returned by payment-method mutations", () => {
    const error = Object.assign(new Error("cancelled"), {
      errors: [{ code: PAYMENT_METHOD_ELEVATION_CANCELLED }],
    })

    expect(isPaymentMethodElevationCancelled(error)).toBe(true)
    expect(isPaymentMethodElevationCancelled(new Error("other"))).toBe(false)
  })
})
