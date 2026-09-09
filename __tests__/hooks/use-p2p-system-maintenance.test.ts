import jest from "jest"
import { act, renderHook } from "@testing-library/react"
import { useP2PQueriesBlocked, useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import { useP2PMaintenanceStore } from "@/stores/p2p-maintenance-store"

describe("useP2PSystemMaintenance", () => {
  beforeEach(() => {
    useP2PMaintenanceStore.getState().clearMaintenance()
    delete process.env.NEXT_PUBLIC_P2P_SYSTEM_MAINTENANCE_ENABLED
  })

  it("returns false when env and API latch are inactive", () => {
    const { result } = renderHook(() => useP2PSystemMaintenance())

    expect(result.current.isActive).toBe(false)
  })

  it("returns true when env flag is enabled", () => {
    process.env.NEXT_PUBLIC_P2P_SYSTEM_MAINTENANCE_ENABLED = "1"

    const { result } = renderHook(() => useP2PSystemMaintenance())

    expect(result.current.isActive).toBe(true)
  })

  it("returns true when API maintenance latch is active", () => {
    useP2PMaintenanceStore.getState().setApiMaintenanceActive(true)

    const { result } = renderHook(() => useP2PSystemMaintenance())

    expect(result.current.isActive).toBe(true)
  })
})

describe("useP2PQueriesBlocked", () => {
  beforeEach(() => {
    useP2PMaintenanceStore.getState().clearMaintenance()
    delete process.env.NEXT_PUBLIC_P2P_SYSTEM_MAINTENANCE_ENABLED
  })

  it("mirrors maintenance active state from env or API latch", () => {
    const { result } = renderHook(() => useP2PQueriesBlocked())

    expect(result.current).toBe(false)

    act(() => {
      useP2PMaintenanceStore.getState().setApiMaintenanceActive(true)
    })

    expect(result.current).toBe(true)
  })
})
