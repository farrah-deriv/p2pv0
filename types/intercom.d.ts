declare global {
  interface Window {
    Intercom?: (command: string, ...args: unknown[]) => void
    intercomSettings?: Record<string, unknown>
    __intercomBooted?: boolean
  }
}

export {}
