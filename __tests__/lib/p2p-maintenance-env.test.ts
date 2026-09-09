import { isP2PMaintenanceActive } from "@/lib/p2p-maintenance-env"
import { useP2PMaintenanceStore } from "@/stores/p2p-maintenance-store"

describe("isP2PMaintenanceActive", () => {
  const originalEnv = process.env.NEXT_PUBLIC_P2P_SYSTEM_MAINTENANCE_ENABLED

  beforeEach(() => {
    useP2PMaintenanceStore.getState().clearMaintenance()
    delete process.env.NEXT_PUBLIC_P2P_SYSTEM_MAINTENANCE_ENABLED
  })

  afterAll(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_P2P_SYSTEM_MAINTENANCE_ENABLED
    } else {
      process.env.NEXT_PUBLIC_P2P_SYSTEM_MAINTENANCE_ENABLED = originalEnv
    }
  })

  it("returns false when env and API latch are inactive", () => {
    expect(isP2PMaintenanceActive()).toBe(false)
  })

  it("returns true when env flag is enabled", () => {
    process.env.NEXT_PUBLIC_P2P_SYSTEM_MAINTENANCE_ENABLED = "1"

    expect(isP2PMaintenanceActive()).toBe(true)
  })

  it("returns true when API maintenance latch is active", () => {
    useP2PMaintenanceStore.getState().setApiMaintenanceActive(true)

    expect(isP2PMaintenanceActive()).toBe(true)
  })
})
