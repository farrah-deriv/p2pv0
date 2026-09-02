import { QueryClient } from '@tanstack/react-query'
import { SchemaMismatchError } from './api/schema-mismatch-error'

const DEFAULT_OPTIONS = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      // Never auto-retry a schema mismatch — the response shape is wrong
      // regardless of how many times we ask again. Everything else keeps the
      // previous single-retry behavior.
      retry: (failureCount: number, error: unknown) =>
        error instanceof SchemaMismatchError ? false : failureCount < 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: (failureCount: number, error: unknown) =>
        error instanceof SchemaMismatchError ? false : failureCount < 1,
    },
  },
}

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
