import { QueryClient } from '@tanstack/react-query'

const DEFAULT_OPTIONS = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
} as const

// Browser-side singleton — created once and shared for the whole session.
// Undefined on the server so each SSR pass gets an isolated fresh client.
let browserClient: QueryClient | undefined

/**
 * Returns the shared QueryClient.
 * - Browser: always the same singleton instance.
 * - Server (SSR): a fresh instance per call to avoid cross-request data leakage.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return new QueryClient(DEFAULT_OPTIONS)
  }
  if (!browserClient) {
    browserClient = new QueryClient(DEFAULT_OPTIONS)
  }
  return browserClient
}
