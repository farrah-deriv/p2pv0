"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { useUserDataStore } from "@/stores/user-data-store"
import { getSocketUrl } from "@/lib/get-socket-url"
import { isP2PMaintenanceActive } from "@/lib/p2p-maintenance-env"
import { isP2PWebSocketEligible, isP2PWebSocketEligibleFromState } from "@/lib/p2p-websocket-eligibility"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import type { WebSocketMessage } from "@/lib/websocket-message"
import type { WebSocketOptions } from "@/lib/websocket-options"

const EXCHANGE_RATE_POST_JOIN_DELAY_MS = 3_000
const EXCHANGE_RATE_REJOIN_BACKOFF_MS = 2_000
const MAX_EXCHANGE_RATE_REJOIN_ATTEMPTS = 3

type ExchangeRateChannelState = {
  status: "idle" | "joining" | "backing_off" | "ready"
  requestPending: boolean
  rejoinAttempts: number
  lastRequestAt: number
  readinessTimer: ReturnType<typeof setTimeout> | null
  rejoinTimer: ReturnType<typeof setTimeout> | null
}

export class WebSocketClient {
  private socket: WebSocket | null = null
  private options: WebSocketOptions
  private isConnecting = false
  // Bumped on every new connect() attempt and on every disconnect(). Each
  // socket's event handlers capture the generation they were created under
  // and no-op if it's since moved on — this is what stops a superseded
  // socket's late-firing onclose from corrupting the current connection's
  // state (it used to read the mutable `this.socket` field at fire time,
  // which by then could already point at a newer socket).
  private generation = 0
  // Exchange-rate joins are asynchronous on the server. Keep readiness and
  // queued requests scoped to this client/socket lifecycle rather than relying
  // on a fixed component-level delay after sending `join`.
  private exchangeRateChannels = new Map<string, ExchangeRateChannelState>()

  constructor(options: WebSocketOptions = {}) {
    this.options = options
  }

  /** Rebinds the callbacks a currently-open (or future) socket reports to.
   * Needed because `getWebSocketClient` reuses one module-level singleton —
   * without this, a caller that creates a new provider instance (e.g. after
   * the provider unmounts/remounts) would silently keep talking to whichever
   * instance's closures were bound first. */
  public setOptions(options: WebSocketOptions): void {
    this.options = options
  }

  public connect(): Promise<WebSocket> {
    if (isP2PMaintenanceActive()) {
      this.disconnect()
      return Promise.reject(new Error("P2P system maintenance is active"))
    }
    if (!isP2PWebSocketEligible()) {
      this.disconnect()
      return Promise.reject(new Error("P2P user is not eligible for WebSocket"))
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return Promise.resolve(this.socket)
    }

    if (this.socket) {
      this.disconnect()
    }

    if (this.isConnecting) {
      return Promise.reject(new Error("Connection already in progress"))
    }

    this.isConnecting = true
    this.clearExchangeRateChannels()
    this.generation += 1
    const myGeneration = this.generation

    return new Promise((resolve, reject) => {
      try {
        const url = `${getSocketUrl()}/p2p/v1/events`
        // Close over this specific socket instance in every handler below —
        // never read the mutable `this.socket` field at fire time. That's
        // the other half of the race fix: even without the generation check,
        // a handler bound to `socket` can't be confused about which
        // connection it belongs to.
        // The events endpoint authenticates through the session cookie and
        // does not negotiate a WebSocket subprotocol.
        const socket = new WebSocket(url)
        this.socket = socket

        socket.onopen = () => {
          const isCurrent = myGeneration === this.generation
          if (isCurrent) this.isConnecting = false
          if (isCurrent && this.options.onOpen) {
            this.options.onOpen(socket)
          }
          resolve(socket)
        }

        socket.onmessage = (event) => {
          if (myGeneration !== this.generation) return
          try {
            const data = JSON.parse(event.data)
            this.handleExchangeRateChannelFrame(data)
            if (this.options.onMessage) {
              this.options.onMessage(data, socket)
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err)
          }
        }

        socket.onerror = (event) => {
          const isCurrent = myGeneration === this.generation
          if (isCurrent) this.isConnecting = false
          if (isCurrent && this.options.onError) {
            this.options.onError(event, socket)
          }
          reject(event)
        }

        socket.onclose = (event) => {
          const isCurrent = myGeneration === this.generation
          if (isCurrent) {
            this.isConnecting = false
          }
          if (isCurrent && this.options.onClose) {
            this.options.onClose(event, socket)
          }
        }
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  public send(message: WebSocketMessage): boolean {
    if (isP2PMaintenanceActive() || !isP2PWebSocketEligible()) {
      console.warn("WebSocket send blocked:", {
        maintenance: isP2PMaintenanceActive(),
        eligible: isP2PWebSocketEligible(),
      })
      return false
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
      return true
    }

    console.warn("WebSocket is not connected. Message not sent:", message)
    return false
  }

  public joinChannel(channel: string, id: number): boolean {
    const joinMessage: WebSocketMessage = {
      action: "join",
      options: {
        channel,
      },
      payload: {
        order_id: id,
      },
    }
    return this.send(joinMessage)
  }

  // "orders" is a single shared channel (not per-order) — join registers interest
  // in a specific order_id, but leave tears down the whole channel. Ref-count so
  // the channel is only left once nothing wants any order via it anymore.
  private ordersChannelRefCount = 0

  public acquireOrdersChannel(orderId: number): void {
    this.ordersChannelRefCount += 1
    this.joinChannel("orders", orderId)
  }

  public releaseOrdersChannel(): void {
    this.ordersChannelRefCount = Math.max(0, this.ordersChannelRefCount - 1)
    if (this.ordersChannelRefCount === 0) {
      this.leaveChannel("orders")
    }
  }

  public joinExchangeRatesChannel(buyCurrency: string, forCurrency?: string): void {
    const channel = forCurrency ? `exchange_rates/${buyCurrency}/${forCurrency}` : `exchange_rates/${buyCurrency}`
    this.ensureExchangeRateChannel(channel)
  }

  public leaveExchangeRatesChannel(buyCurrency: string, forCurrency?: string): void {
    const channel = forCurrency ? `exchange_rates/${buyCurrency}/${forCurrency}` : `exchange_rates/${buyCurrency}`
    this.clearExchangeRateChannel(channel)
    this.leaveChannel(channel)
  }

  public joinUsersOnlineChannel(): void {
    const joinMessage: WebSocketMessage = {
      action: "join",
      options: {
        channel: "users_online",
      },
      payload: {},
    }
    this.send(joinMessage)
  }

  public leaveUsersOnlineChannel(): void {
    this.leaveChannel("users_online")
  }

  public joinAdvertsChannel(accountCurrency: string, localCurrency: string, advertType: string): void {
    const channel = `adverts/currency/${accountCurrency}/${localCurrency}/${advertType}`
    const joinMessage: WebSocketMessage = {
      action: "join",
      options: {
        channel,
      },
      payload: {},
    }
    this.send(joinMessage)
  }

  public leaveAdvertsChannel(accountCurrency: string, localCurrency: string, advertType: string): void {
    const channel = `adverts/currency/${accountCurrency}/${localCurrency}/${advertType}`
    this.leaveChannel(channel)
  }

  public joinUserChannel(): void {
    const joinMessage: WebSocketMessage = {
      action: "join",
      options: {
        channel: "users/me",
      },
      payload: {},
    }
    this.send(joinMessage)
  }

  public leaveChannel(channel: string): void {
    const leaveMessage: WebSocketMessage = {
      action: "leave",
      options: {
        channel,
      },
      payload: {},
    }
    this.send(leaveMessage)
  }

  public getChatHistory(channel: string, orderId: string): void {
    const getChatHistoryMessage: WebSocketMessage = {
      action: "message",
      options: {
        channel,
      },
      payload: {
        chat_history: true,
        order_id: orderId,
      },
    }
    this.send(getChatHistoryMessage)
  }

  public sendPing(channel: string): boolean {
    // Heartbeats share the generic `message` action. Exchange-rate channels
    // require the same join barrier as a rate request, otherwise a reconnect
    // can send `{ ping: 1 }` before the server has registered membership.
    if (channel.startsWith("exchange_rates/")) {
      const state = this.ensureExchangeRateChannel(channel)
      if (!state || state.status !== "ready") return false
    }

    return this.send({
      action: "message",
      options: { channel },
      payload: { ping: 1 },
    })
  }

  public markChatMessagesRead(channel: string, orderId: string): boolean {
    return this.send({
      action: "message",
      options: { channel },
      payload: { order_id: orderId, chat_messages_read: true },
    })
  }

  public disconnect(): void {
    this.clearExchangeRateChannels()
    if (this.socket) {
      if (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN) {
        this.socket.close()
      }
      this.socket = null
      this.isConnecting = false
      // Invalidate this generation so the socket we just told to close can't
      // have its (possibly delayed) onclose mistaken for a still-current
      // connection later — matters even without a follow-up connect() (e.g.
      // unmount, logout, going offline), not just the reconnect path.
      this.generation += 1
    }
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN
  }

  public isConnectingNow(): boolean {
    return this.isConnecting
  }

  public subscribeToUserUpdates(): void {
    this.joinUserChannel()
    const subscribeMessage: WebSocketMessage = {
      action: "subscribe",
      options: {
        channel: "users/me",
      },
      payload: {},
    }
    this.send(subscribeMessage)
  }

  public unsubscribeFromUserUpdates(): void {
    const unsubscribeMessage: WebSocketMessage = {
      action: "unsubscribe",
      options: {
        channel: "users/me",
      },
      payload: {},
    }
    this.send(unsubscribeMessage)
    this.leaveChannel("users/me")
  }

  public requestExchangeRate(buyCurrency: string, forCurrency?: string): void {
    const channel = forCurrency ? `exchange_rates/${buyCurrency}/${forCurrency}` : `exchange_rates/${buyCurrency}`
    const state = this.ensureExchangeRateChannel(channel)
    if (!state) return

    if (state.status !== "ready") {
      // Coalesce every request while the server is still processing the join.
      state.requestPending = true
      return
    }

    this.sendExchangeRateRequest(channel, state)
  }

  private ensureExchangeRateChannel(channel: string): ExchangeRateChannelState | null {
    let state = this.exchangeRateChannels.get(channel)
    if (!state) {
      state = {
        status: "idle",
        requestPending: false,
        rejoinAttempts: 0,
        lastRequestAt: 0,
        readinessTimer: null,
        rejoinTimer: null,
      }
      this.exchangeRateChannels.set(channel, state)
    }

    if (state.status === "ready" || state.status === "joining" || state.status === "backing_off") {
      return state
    }

    this.startExchangeRateJoin(channel, state)
    return state
  }

  private startExchangeRateJoin(channel: string, state: ExchangeRateChannelState): void {
    state.status = "joining"
    const sent = this.send({
      action: "join",
      options: { channel },
      payload: {},
    })
    if (!sent) {
      state.status = "idle"
      return
    }

    // Some channels do not send a dedicated join acknowledgement. A real
    // channel frame marks readiness immediately; otherwise use the same
    // conservative fallback as mobile before flushing a queued request.
    state.readinessTimer = setTimeout(() => {
      if (this.exchangeRateChannels.get(channel) !== state || state.status !== "joining") return
      this.markExchangeRateChannelReady(channel, state)
    }, EXCHANGE_RATE_POST_JOIN_DELAY_MS)
  }

  private markExchangeRateChannelReady(
    channel: string,
    state: ExchangeRateChannelState,
    confirmedByServer = false,
  ): void {
    if (state.readinessTimer) clearTimeout(state.readinessTimer)
    state.readinessTimer = null
    if (state.rejoinTimer) clearTimeout(state.rejoinTimer)
    state.rejoinTimer = null
    state.status = "ready"
    if (confirmedByServer) state.rejoinAttempts = 0

    if (state.requestPending) {
      state.requestPending = false
      this.sendExchangeRateRequest(channel, state)
    }
  }

  private sendExchangeRateRequest(channel: string, state: ExchangeRateChannelState): void {
    // Multiple consumers can request the same all-currencies rate channel in
    // one render. Keep dedupe per channel and per socket lifecycle so a prior
    // connection can never suppress a required request after reconnecting.
    const now = Date.now()
    if (now - state.lastRequestAt < 800) return

    if (this.send({ action: "message", options: { channel }, payload: {} })) {
      state.lastRequestAt = now
    }
  }

  private handleExchangeRateChannelFrame(data: unknown): void {
    if (!data || typeof data !== "object") return
    const message = data as WebSocketMessage
    const channel = message.options?.channel
    if (!channel?.startsWith("exchange_rates/")) return

    const state = this.exchangeRateChannels.get(channel)
    if (!state) return

    if (message.action === "event" || message.action === "message" || message.action === "join") {
      this.markExchangeRateChannelReady(channel, state, true)
      return
    }

    const errorMessage = typeof message.payload?.message === "string" ? message.payload.message : ""
    if (message.action !== "error" || !errorMessage.includes("must be in the channel")) return

    // The request that elicited this error was rejected, so queue one fresh
    // request behind a re-join. This is a safety net for servers that need
    // longer than the fallback window to register membership.
    state.requestPending = true
    if (state.readinessTimer) clearTimeout(state.readinessTimer)
    state.readinessTimer = null
    if (state.rejoinAttempts >= MAX_EXCHANGE_RATE_REJOIN_ATTEMPTS) {
      state.status = "idle"
      return
    }

    state.rejoinAttempts += 1
    state.status = "backing_off"
    if (state.rejoinTimer) clearTimeout(state.rejoinTimer)
    state.rejoinTimer = setTimeout(() => {
      if (this.exchangeRateChannels.get(channel) !== state) return
      state.rejoinTimer = null
      state.status = "idle"
      this.startExchangeRateJoin(channel, state)
    }, EXCHANGE_RATE_REJOIN_BACKOFF_MS * state.rejoinAttempts)
  }

  private clearExchangeRateChannel(channel: string): void {
    const state = this.exchangeRateChannels.get(channel)
    if (!state) return
    if (state.readinessTimer) clearTimeout(state.readinessTimer)
    if (state.rejoinTimer) clearTimeout(state.rejoinTimer)
    this.exchangeRateChannels.delete(channel)
  }

  private clearExchangeRateChannels(): void {
    for (const channel of [...this.exchangeRateChannels.keys()]) {
      this.clearExchangeRateChannel(channel)
    }
  }
}

const MAX_RETRIES = 5

let wsClientInstance: WebSocketClient | null = null

type InboundWebSocketMessage = WebSocketMessage & {
  options: NonNullable<WebSocketMessage["options"]>
}

export function getWebSocketClient(options?: WebSocketOptions): WebSocketClient {
  if (!wsClientInstance) {
    wsClientInstance = new WebSocketClient(options)
  } else if (options) {
    // Rebind to the caller's current callbacks. Without this, a second
    // WebSocketProvider instance (e.g. after unmount/remount via the
    // /login or disabled-account branches in app/main.tsx) would silently
    // keep talking to the first instance's now-orphaned closures/refs.
    wsClientInstance.setOptions(options)
  }
  return wsClientInstance
}

/** Disconnects and drops the module singleton so the next getWebSocketClient
 * call builds a fresh instance. Call on logout — defensive: today logout()
 * ends in a hard page navigation that already wipes this via full reload,
 * but this covers the window before that reload happens and guards against
 * the navigation strategy ever changing to client-side routing. */
export function resetWebSocketClient(): void {
  wsClientInstance?.disconnect()
  wsClientInstance = null
}

interface WebSocketContextType {
  isConnected: boolean
  hasExhaustedRetries: boolean
  joinChannel: (channel: string, id: number) => boolean
  leaveChannel: (channel: string) => void
  acquireOrdersChannel: (orderId: number) => void
  releaseOrdersChannel: () => void
  getChatHistory: (channel: string, orderId: string) => void
  sendPing: (channel: string) => boolean
  onReconnect: (callback: () => void) => () => void
  markChatMessagesRead: (channel: string, orderId: string, messageId: string) => boolean
  subscribe: (callback: (data: InboundWebSocketMessage) => void) => () => void
  reconnect: () => void
  subscribeToUserUpdates: () => void
  unsubscribeFromUserUpdates: () => void
  joinExchangeRatesChannel: (buyCurrency: string, forCurrency?: string) => void
  leaveExchangeRatesChannel: (buyCurrency: string, forCurrency?: string) => void
  requestExchangeRate: (buyCurrency: string, forCurrency?: string) => void
  joinAdvertsChannel: (accountCurrency: string, localCurrency: string, advertType: string) => void
  leaveAdvertsChannel: (accountCurrency: string, localCurrency: string, advertType: string) => void
  joinUsersOnlineChannel: () => void
  leaveUsersOnlineChannel: () => void
}

const NOOP_WS_CONTEXT: WebSocketContextType = {
  isConnected: false,
  hasExhaustedRetries: false,
  joinChannel: () => false,
  leaveChannel: () => {},
  acquireOrdersChannel: () => {},
  releaseOrdersChannel: () => {},
  getChatHistory: () => {},
  sendPing: () => false,
  markChatMessagesRead: () => false,
  subscribe: () => () => {},
  onReconnect: () => () => {},
  reconnect: () => {},
  subscribeToUserUpdates: () => {},
  unsubscribeFromUserUpdates: () => {},
  joinExchangeRatesChannel: () => {},
  leaveExchangeRatesChannel: () => {},
  requestExchangeRate: () => {},
  joinAdvertsChannel: () => {},
  leaveAdvertsChannel: () => {},
  joinUsersOnlineChannel: () => {},
  leaveUsersOnlineChannel: () => {},
}

const WebSocketContext = createContext<WebSocketContextType>(NOOP_WS_CONTEXT)

export function useWebSocketContext() {
  return useContext(WebSocketContext)
}

const HEARTBEAT_INTERVAL_MS = 60_000
const PONG_TIMEOUT_MS = 30_000

// Keyed by channel (not module-level-per-channel-consumer) so two components
// heartbeating the same channel (e.g. two mounted instances) still dedupe
// against each other, same guard rationale as B2's orders-only version.
const lastPingSentAtByChannel = new Map<string, number>()

/** Generic per-channel heartbeat (extends B2's orders-only heartbeat to any
 * channel). Detects a socket that still reports OPEN but the server has
 * stopped responding, and forces a reconnect — supplementary to the
 * provider's onclose/offline/focus/pageshow triggers, not a replacement. */
export function useChannelHeartbeat(channel: string, enabled = true) {
  const { isConnected, subscribe, sendPing, reconnect } = useWebSocketContext()

  useEffect(() => {
    if (!enabled || !isConnected) return

    let awaitingPong = false
    let pongTimeoutId: ReturnType<typeof setTimeout> | null = null

    const unsubscribe = subscribe((data) => {
      if (data?.options?.channel === channel && data?.payload?.data === "pong") {
        awaitingPong = false
        if (pongTimeoutId) clearTimeout(pongTimeoutId)
      }
    })

    const intervalId = setInterval(() => {
      if (awaitingPong) return
      const now = Date.now()
      const lastSent = lastPingSentAtByChannel.get(channel) ?? 0
      if (now - lastSent < HEARTBEAT_INTERVAL_MS - 1000) return
      const wasSent = sendPing(channel)
      if (!wasSent) return

      lastPingSentAtByChannel.set(channel, now)
      awaitingPong = true
      pongTimeoutId = setTimeout(() => {
        console.warn(`[${channel}-heartbeat] no pong received, forcing reconnect`)
        clearInterval(intervalId)
        reconnect()
      }, PONG_TIMEOUT_MS)
    }, HEARTBEAT_INTERVAL_MS)

    return () => {
      clearInterval(intervalId)
      if (pongTimeoutId) clearTimeout(pongTimeoutId)
      unsubscribe()
    }
  }, [enabled, isConnected, channel, subscribe, sendPing, reconnect])
}

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const wsClientRef = useRef<WebSocketClient | null>(null)
  const subscribersRef = useRef<Set<(data: InboundWebSocketMessage) => void>>(new Set())
  const sentChatReadReceiptsRef = useRef(new Set<string>())
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shouldReconnectRef = useRef(true)
  const retryCountRef = useRef(0)
  const hasExhaustedRetriesRef = useRef(false)
  const [hasExhaustedRetries, setHasExhaustedRetries] = useState(false)
  const hasConnectedOnceRef = useRef(false)
  // Mirrors isConnected but always current (no stale-closure risk from effects
  // that only re-run on isMaintenanceActive/isWebSocketEligible changes) — used
  // to tell a genuine reconnect (was down, came back) apart from a redundant
  // re-open of an already-live connection (e.g. a consumer calling reconnect()
  // while the provider's own connect is still in flight).
  const isConnectedRef = useRef(false)
  const reconnectSubscribersRef = useRef<Set<() => void>>(new Set())
  const { isActive: isMaintenanceActive } = useP2PSystemMaintenance()
  const userId = useUserDataStore((state) => state.userId)
  const isWebSocketEligible = isP2PWebSocketEligibleFromState(userId)

  const markRetriesExhausted = () => {
    hasExhaustedRetriesRef.current = true
    setHasExhaustedRetries(true)
  }
  const clearRetriesExhausted = () => {
    hasExhaustedRetriesRef.current = false
    setHasExhaustedRetries(false)
  }

  useEffect(() => {
    if (isMaintenanceActive || !isWebSocketEligible) {
      shouldReconnectRef.current = false
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      wsClientRef.current?.disconnect()
      isConnectedRef.current = false
      setIsConnected(false)
      clearRetriesExhausted()
      return
    }

    shouldReconnectRef.current = true
    retryCountRef.current = 0
    const wsClient = getWebSocketClient({
      onOpen: () => {
        retryCountRef.current = 0
        const wasConnected = isConnectedRef.current
        isConnectedRef.current = true
        sentChatReadReceiptsRef.current.clear()
        setIsConnected(true)
        clearRetriesExhausted()
        const isReconnect = hasConnectedOnceRef.current && !wasConnected
        hasConnectedOnceRef.current = true
        if (isReconnect) {
          reconnectSubscribersRef.current.forEach((callback) => callback())
        }
      },
      onMessage: (data) => {
        subscribersRef.current.forEach((callback) => callback(data))
      },
      onClose: (event) => {
        isConnectedRef.current = false
        setIsConnected(false)
        const isCleanClose = event.code === 1000 || event.code === 1001
        if (!isCleanClose) {
          console.warn(`WebSocket closed unexpectedly: code=${event.code} reason=${event.reason || "(none)"}`)
        }
        if (shouldReconnectRef.current && !isCleanClose && retryCountRef.current < MAX_RETRIES) {
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
          const base = Math.min(3000 * Math.pow(1.5, retryCountRef.current), 30000)
          // Equal jitter: keeps a sane floor (half the base delay always
          // applies) while de-synchronizing simultaneous clients better than
          // a small additive jitter window would.
          const delay = base / 2 + Math.random() * (base / 2)
          reconnectTimeoutRef.current = setTimeout(() => {
            // Re-check eligibility — user may have logged out while this timer was queued.
            if (!isP2PWebSocketEligible()) return
            retryCountRef.current++
            wsClientRef.current?.connect().catch(() => {
              if (retryCountRef.current >= MAX_RETRIES) {
                console.error(`WebSocket failed after ${MAX_RETRIES} reconnection attempts (last code=${event.code})`)
              }
            })
          }, delay)
        } else if (shouldReconnectRef.current && !isCleanClose) {
          markRetriesExhausted()
        }
      },
      onError: () => {
        // WebSocket onerror intentionally carries no detail (browser security constraint).
        // onClose fires next with a code/reason — log there instead.
        isConnectedRef.current = false
        setIsConnected(false)
      },
    })

    wsClientRef.current = wsClient

    wsClient.connect().catch(() => {
      // Connection errors are handled by onError/onClose callbacks above.
    })

    return () => {
      shouldReconnectRef.current = false
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (wsClientRef.current) {
        wsClientRef.current.disconnect()
      }
    }
  }, [isMaintenanceActive, isWebSocketEligible])

  useEffect(() => {
    // Single reconnect-attempt helper shared by every trigger below. Safe to
    // call redundantly — the isConnected()/isConnectingNow() guards make it
    // a no-op when there's nothing to do.
    const attemptReconnect = () => {
      if (isMaintenanceActive || !isWebSocketEligible || hasExhaustedRetriesRef.current) return
      const client = wsClientRef.current
      if (client && !client.isConnected() && !client.isConnectingNow()) {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
        retryCountRef.current = 0
        client.connect().catch((err) => console.warn("WebSocket reconnect failed:", err))
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") attemptReconnect()
    }

    // bfcache restore (back/forward navigation) — only worth attempting on
    // the persisted case; a fresh (non-bfcache) pageshow already runs the
    // mount-time connect effect.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) attemptReconnect()
    }

    // Browsers don't reliably fire onclose promptly when the network drops —
    // a socket can sit in OPEN readyState well after the OS reports offline,
    // so isConnected() would lie and send() would fire into a void. Tear the
    // connection down proactively instead of just cancelling the pending
    // reconnect timer; disconnect() bumps the generation, so whatever the
    // browser eventually reports for that socket becomes a no-op.
    const handleOffline = () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      wsClientRef.current?.disconnect()
      isConnectedRef.current = false
      setIsConnected(false)
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("online", attemptReconnect)
    window.addEventListener("focus", attemptReconnect)
    window.addEventListener("pageshow", handlePageShow)
    window.addEventListener("offline", handleOffline)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("online", attemptReconnect)
      window.removeEventListener("focus", attemptReconnect)
      window.removeEventListener("pageshow", handlePageShow)
      window.removeEventListener("offline", handleOffline)
    }
  }, [isMaintenanceActive, isWebSocketEligible])

  const joinChannel = useCallback((channel: string, id: number): boolean => {
    if (isMaintenanceActive || !isWebSocketEligible) {
      console.warn("WebSocket join blocked:", {
        maintenance: isMaintenanceActive,
        eligible: isWebSocketEligible,
      })
      return false
    }
    return wsClientRef.current?.joinChannel(channel, id) ?? false
  }, [isMaintenanceActive, isWebSocketEligible])

  const leaveChannel = useCallback((channel: string) => {
    wsClientRef.current?.leaveChannel(channel)
  }, [])

  const acquireOrdersChannel = useCallback((orderId: number) => {
    if (isMaintenanceActive || !isWebSocketEligible) return
    wsClientRef.current?.acquireOrdersChannel(orderId)
  }, [isMaintenanceActive, isWebSocketEligible])

  const releaseOrdersChannel = useCallback(() => {
    wsClientRef.current?.releaseOrdersChannel()
  }, [])

  const getChatHistory = useCallback((channel: string, orderId: string) => {
    if (isMaintenanceActive || !isWebSocketEligible) return
    wsClientRef.current?.getChatHistory(channel, orderId)
  }, [isMaintenanceActive, isWebSocketEligible])

  const sendPing = useCallback((channel: string): boolean => {
    if (isMaintenanceActive || !isWebSocketEligible) return false
    return wsClientRef.current?.sendPing(channel) ?? false
  }, [isMaintenanceActive, isWebSocketEligible])

  const markChatMessagesRead = useCallback((channel: string, orderId: string, messageId: string): boolean => {
    if (isMaintenanceActive || !isWebSocketEligible) return false

    // OrderChat is mounted for both responsive layouts. Keep the receipt at
    // the shared socket boundary so the same unread message is acknowledged once.
    const receiptKey = `${channel}:${orderId}:${messageId}`
    if (sentChatReadReceiptsRef.current.has(receiptKey)) return false

    const wasSent = wsClientRef.current?.markChatMessagesRead(channel, orderId) ?? false
    if (wasSent) sentChatReadReceiptsRef.current.add(receiptKey)

    return wasSent
  }, [isMaintenanceActive, isWebSocketEligible])

  const subscribe = useCallback((callback: (data: InboundWebSocketMessage) => void) => {
    subscribersRef.current.add(callback)
    return () => {
      subscribersRef.current.delete(callback)
    }
  }, [])

  const onReconnect = useCallback((callback: () => void) => {
    reconnectSubscribersRef.current.add(callback)
    return () => {
      reconnectSubscribersRef.current.delete(callback)
    }
  }, [])

  const reconnect = useCallback(() => {
    if (isMaintenanceActive || !isWebSocketEligible) return
    if (wsClientRef.current) {
      wsClientRef.current.disconnect()
      wsClientRef.current.connect().catch((error) => {
        console.error("Failed to reconnect WebSocket:", error)
      })
    }
  }, [isMaintenanceActive, isWebSocketEligible])

  const subscribeToUserUpdates = useCallback(() => {
    if (isMaintenanceActive || !isWebSocketEligible) return
    wsClientRef.current?.subscribeToUserUpdates()
  }, [isMaintenanceActive, isWebSocketEligible])

  const unsubscribeFromUserUpdates = useCallback(() => {
    wsClientRef.current?.unsubscribeFromUserUpdates()
  }, [])

  const joinExchangeRatesChannel = useCallback((buyCurrency: string, forCurrency?: string) => {
    if (isMaintenanceActive || !isWebSocketEligible) return
    wsClientRef.current?.joinExchangeRatesChannel(buyCurrency, forCurrency)
  }, [isMaintenanceActive, isWebSocketEligible])

  const leaveExchangeRatesChannel = useCallback((buyCurrency: string, forCurrency?: string) => {
    wsClientRef.current?.leaveExchangeRatesChannel(buyCurrency, forCurrency)
  }, [])

  const requestExchangeRate = useCallback((buyCurrency: string, forCurrency?: string) => {
    if (isMaintenanceActive || !isWebSocketEligible) return
    wsClientRef.current?.requestExchangeRate(buyCurrency, forCurrency)
  }, [isMaintenanceActive, isWebSocketEligible])

  const joinAdvertsChannel = useCallback((accountCurrency: string, localCurrency: string, advertType: string) => {
    if (isMaintenanceActive || !isWebSocketEligible) return
    wsClientRef.current?.joinAdvertsChannel(accountCurrency, localCurrency, advertType)
  }, [isMaintenanceActive, isWebSocketEligible])

  const leaveAdvertsChannel = useCallback((accountCurrency: string, localCurrency: string, advertType: string) => {
    wsClientRef.current?.leaveAdvertsChannel(accountCurrency, localCurrency, advertType)
  }, [])

  const joinUsersOnlineChannel = useCallback(() => {
    if (isMaintenanceActive || !isWebSocketEligible) return
    wsClientRef.current?.joinUsersOnlineChannel()
  }, [isMaintenanceActive, isWebSocketEligible])

  const leaveUsersOnlineChannel = useCallback(() => {
    wsClientRef.current?.leaveUsersOnlineChannel()
  }, [])

  const value: WebSocketContextType = {
    isConnected,
    hasExhaustedRetries,
    joinChannel,
    leaveChannel,
    acquireOrdersChannel,
    releaseOrdersChannel,
    getChatHistory,
    sendPing,
    markChatMessagesRead,
    subscribe,
    onReconnect,
    reconnect,
    subscribeToUserUpdates,
    unsubscribeFromUserUpdates,
    joinExchangeRatesChannel,
    leaveExchangeRatesChannel,
    requestExchangeRate,
    joinAdvertsChannel,
    leaveAdvertsChannel,
    joinUsersOnlineChannel,
    leaveUsersOnlineChannel,
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}
