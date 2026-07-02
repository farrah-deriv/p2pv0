'use client'

import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/react-query-client'

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  // getQueryClient() returns the browser singleton in the browser and a fresh
  // client per SSR call on the server, matching TanStack Query v5 guidance.
  const queryClient = getQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
