import { act, renderHook } from "@testing-library/react"
import { useStablePaymentMethodOrder } from "@/hooks/use-stable-payment-method-order"

describe("useStablePaymentMethodOrder", () => {
  it("keeps encounter order stable across rerenders in the same session", () => {
    type Method = { id: number; name: string }
    const initial: Method[] = [
      { id: 1, name: "a" },
      { id: 2, name: "b" },
      { id: 3, name: "c" },
    ]

    const { result, rerender } = renderHook(
      ({ methods, sessionKey, isActive }) =>
        useStablePaymentMethodOrder(
          methods,
          sessionKey,
          (method: Method) => method.id,
          isActive,
        ),
      {
        initialProps: {
          methods: initial,
          sessionKey: "open",
          isActive: true,
        },
      },
    )

    expect(result.current.map((method) => method.id)).toEqual([1, 2, 3])

    rerender({
      methods: [...initial],
      sessionKey: "open",
      isActive: true,
    })
    expect(result.current.map((method) => method.id)).toEqual([1, 2, 3])
  })

  it("appends newly loaded methods without reordering existing rows", () => {
    type Method = { id: number }
    const { result, rerender } = renderHook(
      ({ methods }) =>
        useStablePaymentMethodOrder(methods, "session", (method: Method) => method.id, true),
      {
        initialProps: {
          methods: [{ id: 1 }, { id: 2 }] as Method[],
        },
      },
    )

    expect(result.current.map((method) => method.id)).toEqual([1, 2])

    act(() => {
      rerender({
        methods: [{ id: 1 }, { id: 2 }, { id: 3 }],
      })
    })

    expect(result.current.map((method) => method.id)).toEqual([1, 2, 3])
  })

  it("resets order when the session becomes inactive then active again", () => {
    type Method = { id: number }
    const { result, rerender } = renderHook(
      ({ methods, isActive }) =>
        useStablePaymentMethodOrder(methods, "session", (method: Method) => method.id, isActive),
      {
        initialProps: {
          methods: [{ id: 2 }, { id: 1 }] as Method[],
          isActive: true,
        },
      },
    )

    expect(result.current.map((method) => method.id)).toEqual([2, 1])

    rerender({
      methods: [{ id: 1 }, { id: 2 }],
      isActive: false,
    })
    rerender({
      methods: [{ id: 1 }, { id: 2 }],
      isActive: true,
    })

    expect(result.current.map((method) => method.id)).toEqual([1, 2])
  })

})
