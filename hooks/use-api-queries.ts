import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import * as BuySellAPI from '@/services/api/api-buy-sell'
import * as OrdersAPI from '@/services/api/api-orders'
import * as AuthAPI from '@/services/api/api-auth'
import * as AdsAPI from '@/services/api/api-my-ads'
import * as ProfileAPI from '@/services/api/api-profile'
import * as WalletsAPI from '@/services/api/api-wallets'
import { flattenWalletTransactionPages } from '@/lib/wallet-transactions-pagination'
import { withNicknameKey } from '@/lib/profile-list-search'
import { useUserDataStore } from '@/stores/user-data-store'
import { useP2PQueriesBlocked } from '@/hooks/use-p2p-system-maintenance'
import { isPaymentMethodSessionElevationEnabled } from '@/lib/payment-method-session-elevation'
import { isP2PWebSocketEligibleFromState } from '@/lib/p2p-websocket-eligibility'
import { isKnownNonP2PUser } from '@/lib/email-eligibility'
import { wrapWithP2PEmailMutationGate } from '@/lib/p2p-email-mutation-guard'
import type { Advertisement, SearchParams as BuySellSearchParams, PaymentMethod } from '@/services/api/api-buy-sell'
import type { Order, OrderFilters } from '@/services/api/api-orders'
import type { MyAd } from '@/services/api/api-my-ads'
import {
  PAYMENT_METHOD_ELEVATION_CANCELLED,
  useSessionElevationStore,
  type PaymentMethodElevationAction,
} from '@/stores/session-elevation-store'

export interface PaymentMethodError extends Error {
  errors?: Array<{ code?: string; message?: string }>
}

export const isPaymentMethodElevationCancelled = (error: PaymentMethodError) =>
  error.errors?.[0]?.code === PAYMENT_METHOD_ELEVATION_CANCELLED

const elevatePaymentMethodAction = async <T>(action: PaymentMethodElevationAction, onVerified: () => Promise<T>) => {
  const result = await useSessionElevationStore.getState().requestElevation(action, onVerified)
  if (result !== false) return result
  const error: PaymentMethodError = Object.assign(new Error("Payment method verification was cancelled"), {
    errors: [{ code: PAYMENT_METHOD_ELEVATION_CANCELLED }],
  })
  throw error
}

const runPaymentMethodMutation = <T>(action: PaymentMethodElevationAction, mutate: () => Promise<T>) =>
  isPaymentMethodSessionElevationEnabled() ? elevatePaymentMethodAction(action, mutate) : mutate()

// Query Keys
const ALL_KEYS = ['api'] as const
const AUTH_KEYS = [...ALL_KEYS, 'auth'] as const
const BUY_SELL_KEYS = [...ALL_KEYS, 'buy-sell'] as const
const ORDERS_KEYS = [...ALL_KEYS, 'orders'] as const
const ADS_KEYS = [...ALL_KEYS, 'ads'] as const
const WALLET_KEYS = [...ALL_KEYS, 'wallet'] as const

export const queryKeys = {
  all: ALL_KEYS,

  // Auth queries
  auth: {
    all: AUTH_KEYS,
    session: () => [...AUTH_KEYS, 'session'] as const,
    me: () => [...AUTH_KEYS, 'me'] as const,
    kycStatus: () => [...AUTH_KEYS, 'kyc-status'] as const,
    onboardingStatus: () => [...AUTH_KEYS, 'onboarding-status'] as const,
    totalBalance: () => [...AUTH_KEYS, 'total-balance'] as const,
    userBalance: () => [...AUTH_KEYS, 'user-balance'] as const,
    settings: () => [...AUTH_KEYS, 'settings'] as const,
    clientProfile: () => [...AUTH_KEYS, 'client-profile'] as const,
    socketToken: () => [...AUTH_KEYS, 'socket-token'] as const,
    advertStats: (currency: string) => [...AUTH_KEYS, 'advert-stats', currency] as const,
    currencies: () => [...AUTH_KEYS, 'currencies'] as const,
    userPaymentMethods: () => [...AUTH_KEYS, 'user-payment-methods'] as const,
    // The nickname-searched lists. Called with no argument these return the unfiltered key,
    // which is also the prefix of every nickname variant — so the existing
    // `invalidateQueries({ queryKey: queryKeys.auth.blockedUsers() })` call sites refresh
    // every search in the cache, not just the unfiltered one.
    blockedUsers: (nickname?: string) => withNicknameKey([...AUTH_KEYS, 'blocked-users'] as const, nickname),
    tradePartners: (nickname?: string) => withNicknameKey([...AUTH_KEYS, 'trade-partners'] as const, nickname),
    followers: (nickname?: string) => withNicknameKey([...AUTH_KEYS, 'followers'] as const, nickname),
  },

  // Buy/Sell queries
  buySell: {
    all: BUY_SELL_KEYS,
    advertisements: () => [...BUY_SELL_KEYS, 'advertisements'] as const,
    advertisementsByParams: (params: BuySellSearchParams) => [
      ...BUY_SELL_KEYS,
      'advertisements',
      params.type,
      params.currency,
      params.account_currency,
      params.paymentMethod ? JSON.stringify(params.paymentMethod) : undefined,
      params.sortBy,
      params.favourites_only,
      params.nickname,
    ] as const,
    paymentMethods: () => [...BUY_SELL_KEYS, 'payment-methods'] as const,
    advertiser: (id: string | number) => [...BUY_SELL_KEYS, 'advertiser', id] as const,
    advertiserAds: (id: string | number) => [...BUY_SELL_KEYS, 'advertiser-ads', id] as const,
    favouriteUsers: (nickname?: string) => withNicknameKey([...BUY_SELL_KEYS, 'favourite-users'] as const, nickname),
  },

  // Orders queries
  orders: {
    all: ORDERS_KEYS,
    list: () => [...ORDERS_KEYS, 'list'] as const,
    listByFilters: (filters: OrderFilters | undefined) => [...ORDERS_KEYS, 'list', filters] as const,
    detail: (id: string) => [...ORDERS_KEYS, 'detail', id] as const,
  },

  // Ads queries
  ads: {
    all: ADS_KEYS,
    userAdverts: (isActive?: boolean) => [...ADS_KEYS, 'user-adverts', isActive] as const,
    allUserAdverts: () => [...ADS_KEYS, 'user-adverts'] as const,
  },

  // Wallet queries
  wallet: {
    all: WALLET_KEYS,
    transactions: (currency?: string | null) => [...WALLET_KEYS, 'transactions', currency ?? null] as const,
    transaction: (referenceId: string) => [...WALLET_KEYS, 'transaction', referenceId] as const,
  },
}

// Auth Hooks
export function useSession() {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: () => AuthAPI.getSession(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !maintenanceBlocked,
  })
}

export function useMe() {
  const maintenanceBlocked = useP2PQueriesBlocked()
  const pathname = usePathname()
  const allowMaintenanceRecoveryCheck = pathname.startsWith('/profile')
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => AuthAPI.getMe(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !maintenanceBlocked || allowMaintenanceRecoveryCheck,
  })
}

export function useKycStatus() {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useQuery({
    queryKey: queryKeys.auth.kycStatus(),
    queryFn: () => AuthAPI.getKycStatus(),
    staleTime: 1000 * 60 * 5,
    enabled: !maintenanceBlocked,
  })
}

export function useOnboardingStatus(enabled = true) {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useQuery({
    queryKey: queryKeys.auth.onboardingStatus(),
    queryFn: () => AuthAPI.getOnboardingStatus(),
    staleTime: 1000 * 60 * 5,
    enabled: enabled && !maintenanceBlocked,
  })
}

export function useTotalBalance() {
  const maintenanceBlocked = useP2PQueriesBlocked()
  const userId = useUserDataStore((state) => state.userId)
  // Skip a call we already know 403s: `/v1/client/total-balance` has no wallets to report
  // for a client with no P2P profile. Gated on the positive signal only — `userId` is `""`
  // once `/p2p/v1/users/me` has told us there is no profile, and `null` while the store is
  // still hydrating. Gating on `!isExistingP2PUser(userId)` would also catch `null` and
  // disable the query mid-hydration; a disabled query reports `isLoading: false` with no
  // data, so a funded user would flash the zero-wallets empty state on every load.
  const hasNoP2PProfile = isKnownNonP2PUser(userId)
  return useQuery({
    queryKey: queryKeys.auth.totalBalance(),
    queryFn: () => AuthAPI.getTotalBalance(),
    staleTime: 1000 * 60 * 2, // 2 minutes for balance
    enabled: !maintenanceBlocked && !hasNoP2PProfile,
  })
}

export function useUserBalance() {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useQuery({
    queryKey: queryKeys.auth.userBalance(),
    queryFn: () => AuthAPI.getUserBalance(),
    staleTime: 1000 * 60 * 2,
    enabled: !maintenanceBlocked,
  })
}

export function useSettings() {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useQuery({
    queryKey: queryKeys.auth.settings(),
    queryFn: () => AuthAPI.getSettings(),
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 0,
    enabled: !maintenanceBlocked,
  })
}

export function useClientProfile() {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useQuery({
    queryKey: queryKeys.auth.clientProfile(),
    queryFn: () => AuthAPI.getClientProfile(),
    staleTime: 1000 * 60 * 5,
    enabled: !maintenanceBlocked,
  })
}

export function useSocketToken() {
  const maintenanceBlocked = useP2PQueriesBlocked()
  const userId = useUserDataStore((state) => state.userId)
  const isWebSocketEligible = isP2PWebSocketEligibleFromState(userId)

  return useQuery({
    queryKey: queryKeys.auth.socketToken(),
    queryFn: () => AuthAPI.getSocketToken(),
    staleTime: 1000 * 60 * 30,
    enabled: !maintenanceBlocked && isWebSocketEligible,
  })
}

export function useAdvertStats(currency: string, enabled = true) {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useQuery({
    queryKey: queryKeys.auth.advertStats(currency),
    queryFn: () => AuthAPI.getAdvertStatistics(currency),
    staleTime: 1000 * 60 * 5,
    enabled: enabled && !maintenanceBlocked,
  })
}

export function useCurrencies() {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useQuery({
    queryKey: queryKeys.auth.currencies(),
    queryFn: () => AuthAPI.getCurrencies(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !maintenanceBlocked,
  })
}

// Wallet Hooks
export function useWalletTransactions(currency?: string | null, enabled = true) {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useInfiniteQuery({
    queryKey: queryKeys.wallet.transactions(currency),
    queryFn: ({ pageParam }) =>
      WalletsAPI.fetchTransactions(currency ?? undefined, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 2, // 2 minutes — matches balance hooks
    enabled: enabled && !maintenanceBlocked,
  })
}

/** Flatten infinite-query pages into a single wallet transaction list. */
export function flattenWalletTransactionsPages(
  data: { pages: WalletsAPI.WalletTransactionsPageResult[] } | undefined,
) {
  return flattenWalletTransactionPages(data)
}

export const USER_PAYMENT_METHODS_PAGE_SIZE = 50

/** Minimal v2 user payment-method shape shared by paginated consumers. */
export type UserPaymentMethod = ProfileAPI.UserPaymentMethod

export type UserPaymentMethodsPage = { data: UserPaymentMethod[] }

/** Flatten infinite-query pages into a single payment-method list. */
export function flattenUserPaymentMethodsPages(
  data: { pages: UserPaymentMethodsPage[] } | undefined,
): UserPaymentMethod[] {
  return data?.pages.flatMap((page) => page.data ?? []) ?? []
}

export function useUserPaymentMethods(enabled = true) {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useInfiniteQuery({
    queryKey: queryKeys.auth.userPaymentMethods(),
    queryFn: ({ pageParam = 1 }) =>
      ProfileAPI.getUserPaymentMethods(pageParam as number, USER_PAYMENT_METHODS_PAGE_SIZE),
    getNextPageParam: (lastPage: UserPaymentMethodsPage, allPages) =>
      (lastPage.data?.length ?? 0) < USER_PAYMENT_METHODS_PAGE_SIZE
        ? undefined
        : allPages.length + 1,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: enabled && !maintenanceBlocked,
  })
}

export function useBlockedUsers(enabled = true, nickname?: string) {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useInfiniteQuery({
    queryKey: queryKeys.auth.blockedUsers(nickname),
    queryFn: ({ pageParam = 1 }) => ProfileAPI.getBlockedUsers(pageParam as number, PAGE_SIZE, nickname),
    getNextPageParam: (lastPage: any[], allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length + 1,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: enabled && !maintenanceBlocked,
  })
}

export function useTradePartners(enabled = true, nickname?: string) {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useInfiniteQuery({
    queryKey: queryKeys.auth.tradePartners(nickname),
    queryFn: ({ pageParam = 1 }) => ProfileAPI.getTradePartners(pageParam as number, PAGE_SIZE, nickname),
    getNextPageParam: (lastPage: any[], allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length + 1,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: enabled && !maintenanceBlocked,
  })
}

export function useFollowers(enabled = true, nickname?: string) {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useInfiniteQuery({
    queryKey: queryKeys.auth.followers(nickname),
    queryFn: ({ pageParam = 1 }) => ProfileAPI.getFollowers(pageParam as number, PAGE_SIZE, nickname),
    getNextPageParam: (lastPage: any[], allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length + 1,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: enabled && !maintenanceBlocked,
  })
}

export function useAddPaymentMethod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: wrapWithP2PEmailMutationGate(async ({ method, fields }: { method: string; fields: Record<string, string> }) => {
      return runPaymentMethodMutation("p2p_payment_method_create", async () => {
        const result = await ProfileAPI.addPaymentMethod(method, fields)
        if (!result.success) {
          const error: PaymentMethodError = Object.assign(
            new Error(result.errors?.[0]?.message || 'Failed to add payment method'),
            { errors: result.errors },
          )
          throw error
        }
        return result
      })
    }),
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.userPaymentMethods() })
    },
  })
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: wrapWithP2PEmailMutationGate(async ({ id, method, fields }: { id: string; method: string; fields: Record<string, string> }) => {
      return runPaymentMethodMutation("p2p_payment_method_update", async () => {
        const result = await ProfileAPI.updatePaymentMethod(id, { method, fields })
        if (!result.success) {
          const error: PaymentMethodError = Object.assign(
            new Error(result.errors?.[0]?.message || 'Failed to update payment method'),
            { errors: result.errors },
          )
          throw error
        }
        return result
      })
    }),
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.userPaymentMethods() })
    },
  })
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: wrapWithP2PEmailMutationGate(async (id: string) => {
      return runPaymentMethodMutation("p2p_payment_method_delete", async () => {
        const result = await ProfileAPI.deletePaymentMethod(id)
        if (!result.success && result.errors && result.errors.length > 0) {
          const error: PaymentMethodError = Object.assign(
            new Error(result.errors[0].message || 'Failed to delete payment method'),
            { errors: result.errors },
          )
          throw error
        }
        return result
      })
    }),
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.userPaymentMethods() })
    },
  })
}

const PAGE_SIZE = 20

export function useUserAdverts(isActive?: boolean, enabled = true) {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useInfiniteQuery({
    queryKey: queryKeys.ads.userAdverts(isActive),
    queryFn: ({ pageParam = 1 }) => AdsAPI.getUserAdverts(isActive, pageParam as number, PAGE_SIZE),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length + 1,
    initialPageParam: 1,
    staleTime: 1000 * 30,
    enabled: enabled && !maintenanceBlocked,
  })
}

export function useCreateAd() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: wrapWithP2PEmailMutationGate(async (payload: any) => {
      const result = await AdsAPI.createAd(payload)
      if (!result.success && result.errors && result.errors.length > 0) {
        const error: any = new Error(result.errors[0].message || 'Failed to create ad')
        error.errors = result.errors
        throw error
      }
      return result
    }),
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ads.allUserAdverts() })
    },
  })
}

export function useUpdateAd() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: wrapWithP2PEmailMutationGate(async ({ id, adData }: { id: string; adData: any }) => {
      const result = await AdsAPI.updateAd(id, adData)
      if (!result.success && result.errors && result.errors.length > 0) {
        const error: any = new Error(result.errors[0].message || 'Failed to update ad')
        error.errors = result.errors
        throw error
      }
      return result
    }),
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ads.allUserAdverts() })
    },
  })
}

export function useDeleteAd() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: wrapWithP2PEmailMutationGate(async (id: string) => {
      const response = await AdsAPI.deleteAd(id)
      if (!response.success) {
        const error: any = new Error(response.errors?.[0]?.message || 'Failed to delete ad')
        error.errors = response.errors
        throw error
      }
      return response
    }),
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ads.allUserAdverts() })
    },
  })
}

export function useToggleAdActiveStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: wrapWithP2PEmailMutationGate(async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const result = await AdsAPI.toggleAdActiveStatus(id, isActive)
      if (!result.success && result.errors && result.errors.length > 0) {
        const error: any = new Error(result.errors[0].message || 'Failed to update ad status')
        error.errors = result.errors
        throw error
      }
      return result
    }),
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ads.allUserAdverts() })
    },
  })
}

export function useHideMyAds() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: wrapWithP2PEmailMutationGate((hide: boolean) => AdsAPI.hideMyAds(hide)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ads.allUserAdverts() })
    },
  })
}

// Buy/Sell Hooks
export function useAdvertisements(params?: BuySellSearchParams) {
  const maintenanceBlocked = useP2PQueriesBlocked()
  const queryKey = useMemo(() => {
    if (!params) return undefined
    return queryKeys.buySell.advertisementsByParams({
      type: params.type,
      currency: params.currency,
      account_currency: params.account_currency,
      paymentMethod: params.paymentMethod,
      sortBy: params.sortBy,
      favourites_only: params.favourites_only,
    })
  }, [params?.type, params?.currency, params?.account_currency, JSON.stringify(params?.paymentMethod), params?.sortBy, params?.favourites_only, params?.nickname])

  const query = useInfiniteQuery({
    queryKey: queryKey || ['no-params'],
    queryFn: ({ pageParam = 1 }) =>
      BuySellAPI.getAdvertisements({ ...params!, page: pageParam as number, per_page: PAGE_SIZE }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length + 1,
    initialPageParam: 1,
    staleTime: 1000 * 10,
    enabled: Boolean(params && queryKey && params.currency && params.account_currency) && !maintenanceBlocked,
  })

  return {
    ...query,
    error: query.error as Error | null,
    queryKey,
  }
}

export function useAdvertiserSearch(params: BuySellSearchParams & { nickname: string; type?: string }) {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useInfiniteQuery({
    queryKey: [...queryKeys.buySell.all, 'advertiser-search', params.nickname, params.type],
    queryFn: ({ pageParam = 1 }) =>
      BuySellAPI.getAdvertisements({ nickname: params.nickname, type: params.type, page: pageParam as number, per_page: PAGE_SIZE }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length + 1,
    initialPageParam: 1,
    enabled: params.nickname.trim().length > 0 && !maintenanceBlocked,
    staleTime: 1000 * 10,
  })
}

export function usePaymentMethods() {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useQuery({
    queryKey: queryKeys.buySell.paymentMethods(),
    queryFn: () => BuySellAPI.getPaymentMethods(),
    staleTime: 1000 * 60 * 30,
    enabled: !maintenanceBlocked,
  })
}

export function useAdvertiser(id: string | number) {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useQuery({
    queryKey: queryKeys.buySell.advertiser(id),
    queryFn: () => BuySellAPI.getAdvertiserById(id),
    staleTime: 1000 * 60 * 5,
    enabled: !maintenanceBlocked,
  })
}

export function useAdvertiserAds(id: string | number) {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useInfiniteQuery({
    queryKey: queryKeys.buySell.advertiserAds(id),
    queryFn: ({ pageParam = 1 }) => BuySellAPI.getAdvertiserAds(id, pageParam as number, PAGE_SIZE),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length + 1,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
    enabled: !maintenanceBlocked,
  })
}

export function useFavouriteUsers(enabled = true, nickname?: string) {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useInfiniteQuery({
    queryKey: queryKeys.buySell.favouriteUsers(nickname),
    queryFn: ({ pageParam = 1 }) => ProfileAPI.getFavouriteUsers(pageParam as number, PAGE_SIZE, nickname),
    getNextPageParam: (lastPage: any[], allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length + 1,
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
    enabled: enabled && !maintenanceBlocked,
  })
}

// Orders Hooks
export function useOrders(filters?: OrderFilters) {
  const maintenanceBlocked = useP2PQueriesBlocked()
  const userId = useUserDataStore((state) => state.userId)
  return useInfiniteQuery({
    queryKey: queryKeys.orders.listByFilters(filters),
    queryFn: ({ pageParam = 1 }) => OrdersAPI.getOrders(filters, pageParam as number, PAGE_SIZE),
    getNextPageParam: (lastPage, allPages) => {
      const items = Array.isArray(lastPage) ? lastPage : (lastPage as any)?.data ?? []
      return items.length < PAGE_SIZE ? undefined : allPages.length + 1
    },
    initialPageParam: 1,
    staleTime: 1000 * 30,
    enabled: !maintenanceBlocked && !!userId,
  })
}

export function useOrderById(id: string) {
  const maintenanceBlocked = useP2PQueriesBlocked()
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => OrdersAPI.getOrderById(id),
    staleTime: 1000 * 30,
    enabled: !maintenanceBlocked,
  })
}

// Mutations
export function useMarkPaymentAsSent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => OrdersAPI.markPaymentAsSent(orderId),
    onSuccess: (data, orderId) => {
      // Invalidate order detail
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) })
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() })
    },
  })
}

export function useReleasePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => OrdersAPI.releasePayment(orderId),
    onSuccess: (data, orderId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => OrdersAPI.cancelOrder(orderId),
    onSuccess: (data, orderId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() })
    },
  })
}

export function useDisputeOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      OrdersAPI.disputeOrder(orderId, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.orderId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() })
    },
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: wrapWithP2PEmailMutationGate(({ advertId, exchangeRate, amount, paymentMethodIds }: Parameters<typeof OrdersAPI.createOrder>[0]) =>
      OrdersAPI.createOrder(advertId as any, exchangeRate as any, amount as any, paymentMethodIds as any)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() })
    },
  })
}

export function usePayOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => OrdersAPI.payOrder(orderId),
    onSuccess: (data, orderId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() })
    },
  })
}

export function useReviewOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, reviewData }: { orderId: string; reviewData: any }) =>
      OrdersAPI.reviewOrder(orderId, reviewData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.orderId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() })
    },
  })
}

export function useCompleteOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, otpValue }: { orderId: string; otpValue: string | null }) =>
      OrdersAPI.completeOrder(orderId, otpValue),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.orderId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() })
    },
  })
}

export function useSendChatMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, message, attachment, isPOT }: { orderId: string; message: string; attachment?: string | null; isPOT?: boolean }) =>
      OrdersAPI.sendChatMessage(orderId, message, attachment, isPOT),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.orderId) })
    },
  })
}

export function useRequestOrderCompletionOtp() {
  return useMutation({
    mutationFn: (orderId: string) => OrdersAPI.requestOrderCompletionOtp(orderId),
  })
}

export function useToggleFavouriteAdvertiser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ advertiserId, isFavourite }: { advertiserId: number; isFavourite: boolean }) =>
      BuySellAPI.toggleFavouriteAdvertiser(advertiserId, isFavourite),
    onSuccess: () => {
      // Invalidate advertisements to refresh favorite status
      queryClient.invalidateQueries({ queryKey: queryKeys.buySell.advertisements() })
    },
  })
}

export function useToggleBlockAdvertiser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ advertiserId, isBlocked }: { advertiserId: number; isBlocked: boolean }) =>
      BuySellAPI.toggleBlockAdvertiser(advertiserId, isBlocked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buySell.advertisements() })
    },
  })
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, nps_score, review_text }: { userId: string; nps_score: number; review_text: string }) =>
      AuthAPI.submitFeedback(userId, { nps_score, review_text: review_text.trim() }),
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
      const { updateUserData } = useUserDataStore.getState()
      updateUserData({ feedback_exist: true })
    },
  })
}
