"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { useUserDataStore } from "@/stores/user-data-store"
import { getSocketUrl } from "@/lib/get-socket-url"
import { isP2PMaintenanceActive } from "@/lib/p2p-maintenance-env"
import { isP2PWebSocketEligible, isP2PWebSocketEligibleFromState } from "@/lib/p2p-websocket-eligibility"
import { useP2PSystemMaintenance } from "@/hooks/use-p2p-system-maintenance"
import type { WebSocketMessage } from "@/lib/websocket-message"
import type { WebSocketOptions } from "@/lib/websocket-options"

export class WebSocketClient {
  private socket: WebSocket | null = null
  private options: WebSocketOptions
  private isConnecting = false
  private currentToken: string | null = null

  constructor(options: WebSocketOptions = {}) {
    this.options = options
  }

  private getSocketToken(): string | null {
    if (typeof window === "undefined") return null
    return useUserDataStore.getState().socketToken
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

    const socketToken = this.getSocketToken()

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

    return new Promise((resolve, reject) => {
      try {
        const url = `${getSocketUrl()}/p2p/v1/events`
        const protocols = socketToken && socketToken.trim() ? [socketToken] : undefined
        this.socket = new WebSocket(url, protocols)
        this.currentToken = socketToken

        this.socket.onopen = () => {
          this.isConnecting = false
          if (this.options.onOpen) {
            this.options.onOpen(this.socket!)
          }
          resolve(this.socket!)
        }

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (this.options.onMessage) {
              this.options.onMessage(data, this.socket!)
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err)
          }
        }

        this.socket.onerror = (event) => {
          this.isConnecting = false
          if (this.options.onError) {
            this.options.onError(event, this.socket!)
          }
          reject(event)
        }

        this.socket.onclose = (event) => {
          this.isConnecting = false
          this.currentToken = null
          if (this.options.onClose) {
            this.options.onClose(event, this.socket!)
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

  public joinExchangeRatesChannel(buyCurrency: string, forCurrency: string): void {
    const channel = forCurrency ? `exchange_rates/${buyCurrency}/${forCurrency}` : `exchange_rates/${buyCurrency}`
    const joinMessage: WebSocketMessage = {
      action: "join",
      options: {
        channel,
      },
      payload: {},
    }
    this.send(joinMessage)
  }

  public leaveExchangeRatesChannel(buyCurrency: string, forCurrency: string): void {
    const channel = forCurrency ? `exchange_rates/${buyCurrency}/${forCurrency}` : `exchange_rates/${buyCurrency}`
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

  public disconnect(): void {
    if (this.socket) {
      if (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN) {
        this.socket.close()
      }
      this.socket = null
      this.isConnecting = false
      this.currentToken = null
    }
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN
  }

  public isConnectingNow(): boolean {
    return this.isConnecting
  }

  public hasValidToken(): boolean {
    const token = this.getSocketToken()
    return token !== null && token.trim() !== ""
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
  }

  public requestExchangeRate(buyCurrency: string, forCurrency: string): void {
    const channel = forCurrency ? `exchange_rates/${buyCurrency}/${forCurrency}` : `exchange_rates/${buyCurrency}`
    const requestMessage: WebSocketMessage = {
      action: "message",
      options: {
        channel,
      },
      payload: {},
    }
    this.send(requestMessage)
  }
}

const MAX_RETRIES = 5

let wsClientInstance: WebSocketClient | null = null

export function getWebSocketClient(options?: WebSocketOptions): WebSocketClient {
  if (!wsClientInstance) {
    wsClientInstance = new WebSocketClient(options)
  }
  return wsClientInstance
}

interface WebSocketContextType {
  isConnected: boolean
  joinChannel: (channel: string, id: number) => boolean
  leaveChannel: (channel: string) => void
  getChatHistory: (channel: string, orderId: string) => void
  subscribe: (callback: (data: any) => void) => () => void
  reconnect: () => void
  subscribeToUserUpdates: () => void
  unsubscribeFromUserUpdates: () => void
  joinExchangeRatesChannel: (buyCurrency: string, forCurrency: string) => void
  leaveExchangeRatesChannel: (buyCurrency: string, forCurrency: string) => void
  requestExchangeRate: (buyCurrency: string, forCurrency: string) => void
  joinAdvertsChannel: (accountCurrency: string, localCurrency: string, advertType: string) => void
  leaveAdvertsChannel: (accountCurrency: string, localCurrency: string, advertType: string) => void
  joinUsersOnlineChannel: () => void
  leaveUsersOnlineChannel: () => void
}

const NOOP_WS_CONTEXT: WebSocketContextType = {
  isConnected: false,
  joinChannel: () => false,
  leaveChannel: () => {},
  getChatHistory: () => {},
  subscribe: () => () => {},
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

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const wsClientRef = useRef<WebSocketClient | null>(null)
  const subscribersRef = useRef<Set<(data: any) => void>>(new Set())
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shouldReconnectRef = useRef(true)
  const retryCountRef = useRef(0)
  const { isActive: isMaintenanceActive } = useP2PSystemMaintenance()
  const userId = useUserDataStore((state) => state.userId)
  const userData = useUserDataStore((state) => state.userData)
  const onboardingStatus = useUserDataStore((state) => state.onboardingStatus)
  const isWebSocketEligible = isP2PWebSocketEligibleFromState({ userId, userData, onboardingStatus })

  useEffect(() => {
    if (isMaintenanceActive || !isWebSocketEligible) {
      shouldReconnectRef.current = false
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      wsClientRef.current?.disconnect()
      setIsConnected(false)
      return
    }

    shouldReconnectRef.current = true
    retryCountRef.current = 0
    const wsClient = getWebSocketClient({
      onOpen: () => {
        retryCountRef.current = 0
        setIsConnected(true)
        const userData = useUserDataStore.getState().userData
        if (userData?.signup === "v1") {
          wsClient.subscribeToUserUpdates()
        }
      },
      onMessage: (data) => {
        subscribersRef.current.forEach((callback) => callback(data))
      },
      onClose: (event) => {
        setIsConnected(false)
        const isCleanClose = event.code === 1000 || event.code === 1001
        if (!isCleanClose) {
          console.warn(`WebSocket closed unexpectedly: code=${event.code} reason=${event.reason || "(none)"}`)
        }
        if (shouldReconnectRef.current && !isCleanClose && retryCountRef.current < MAX_RETRIES) {
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
          const delay = Math.min(3000 * Math.pow(1.5, retryCountRef.current), 30000)
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
        }
      },
      onError: () => {
        // WebSocket onerror intentionally carries no detail (browser security constraint).
        // onClose fires next with a code/reason — log there instead.
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
        const userData = useUserDataStore.getState().userData
        if (userData?.signup === "v1") {
          wsClientRef.current.unsubscribeFromUserUpdates()
        }
        wsClientRef.current.disconnect()
      }
    }
  }, [isMaintenanceActive, isWebSocketEligible])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isMaintenanceActive || !isWebSocketEligible) return
      const client = wsClientRef.current
      if (document.visibilityState === "visible" && client && !client.isConnected() && !client.isConnectingNow()) {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
        retryCountRef.current = 0
        client.connect().catch((err) => console.warn("WebSocket reconnect failed:", err))
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
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

  const getChatHistory = useCallback((channel: string, orderId: string) => {
    if (isMaintenanceActive || !isWebSocketEligible) return
    wsClientRef.current?.getChatHistory(channel, orderId)
  }, [isMaintenanceActive, isWebSocketEligible])

  const subscribe = useCallback((callback: (data: any) => void) => {
    subscribersRef.current.add(callback)
    return () => {
      subscribersRef.current.delete(callback)
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

  const joinExchangeRatesChannel = useCallback((buyCurrency: string, forCurrency: string) => {
    if (isMaintenanceActive || !isWebSocketEligible) return
    wsClientRef.current?.joinExchangeRatesChannel(buyCurrency, forCurrency)
  }, [isMaintenanceActive, isWebSocketEligible])

  const leaveExchangeRatesChannel = useCallback((buyCurrency: string, forCurrency: string) => {
    wsClientRef.current?.leaveExchangeRatesChannel(buyCurrency, forCurrency)
  }, [])

  const requestExchangeRate = useCallback((buyCurrency: string, forCurrency: string) => {
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
    joinChannel,
    leaveChannel,
    getChatHistory,
    subscribe,
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
