"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { WebSocketClient, type WebSocketMessage, type WebSocketOptions } from "@/lib/websocket"

export function useWebSocket(options?: WebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const wsClientRef = useRef<WebSocketClient | null>(null)

  // Initialize the WebSocket client
  useEffect(() => {
    const wsOptions: WebSocketOptions = {
      ...options,
      onOpen: (socket) => {
        setIsConnected(true)
        if (options?.onOpen) options.onOpen(socket)
      },
      onMessage: (data, socket) => {
        setLastMessage(data)
        if (options?.onMessage) options.onMessage(data, socket)
      },
      onClose: (event, socket) => {
        setIsConnected(false)
        if (options?.onClose) options.onClose(event, socket)
      },
      onError: (error, socket) => {
        if (options?.onError) options.onError(error, socket)
      },
    }

    const wsClient = new WebSocketClient(wsOptions)
    wsClientRef.current = wsClient

    wsClient.connect().catch((error) => {
      console.error("Failed to connect to WebSocket:", error)
    })

    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect()
      }
    }
  }, [])

  // Send a message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsClientRef.current) {
      wsClientRef.current.send(message)
    }
  }, [])

  // Join a channel
  const joinChannel = useCallback((channel: string) => {
    if (wsClientRef.current) {
      wsClientRef.current.joinChannel(channel)
    }
  }, [])

  // Leave a channel
  const leaveChannel = useCallback((channel: string) => {
    if (wsClientRef.current) {
      wsClientRef.current.leaveChannel(channel)
    }
  }, [])

  // Get chat history
  const getChatHistory = useCallback((channel: string, orderId: string) => {
    if (wsClientRef.current) {
      wsClientRef.current.getChatHistory(channel, orderId)
    }
  }, [])

  // Reconnect manually
  const reconnect = useCallback(() => {
    if (wsClientRef.current) {
      wsClientRef.current.disconnect()
      wsClientRef.current.connect().catch((error) => {
        console.error("Failed to reconnect to WebSocket:", error)
      })
    }
  }, [])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    joinChannel,
    leaveChannel,
    getChatHistory,
    reconnect,
  }
}
