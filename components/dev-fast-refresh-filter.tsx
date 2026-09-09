"use client"

// Suppress Next.js [Fast Refresh] rebuilding/done console noise in development.
// Runs at module-evaluation time so the override is active before any HMR tick.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const _log = console.log
  console.log = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith("[Fast Refresh]")) return
    _log.apply(console, args)
  }
}

export function DevFastRefreshFilter() {
  return null
}
