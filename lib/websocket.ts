import { API, USER } from "@/lib/local-variables"

export interface WebSocketMessage {
  action: string
  options: {
    channel: string
    [key: string]: any
  }
  payload: any
}

export interface WebSocketOptions {
  onOpen?: (socket: WebSocket) => void
  onMessage?: (data: any, socket: WebSocket) => void
  onError?: (error: Event, socket: WebSocket) => void
  onClose?: (event: CloseEvent, socket: WebSocket) => void
  autoReconnect?: boolean
  maxReconnectAttempts?: number
  reconnectInterval?: number
}

export class WebSocketClient {
  private socket: WebSocket | null = null
  private options: WebSocketOptions
  private reconnectAttempts = 0
  private reconnectTimeout: NodeJS.Timeout | null = null

  constructor(options: WebSocketOptions = {}) {
    this.options = {
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectInterval: 3000,
      ...options,
    }
  }

  public connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        const url = API.socketUrl
        this.socket = new WebSocket(url, [USER.socketToken])

        this.socket.onopen = () => {
          this.reconnectAttempts = 0
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
          if (this.options.onError) {
            this.options.onError(event, this.socket!)
          }
          reject(event)
        }

        this.socket.onclose = (event) => {
          if (this.options.onClose) {
            this.options.onClose(event, this.socket!)
          }

          if (this.options.autoReconnect && this.reconnectAttempts < (this.options.maxReconnectAttempts || 5)) {
            this.reconnectTimeout = setTimeout(() => {
              this.reconnectAttempts++
              this.connect()
            }, this.options.reconnectInterval)
          }
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  public send(message: WebSocketMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    } else {
      console.warn("WebSocket is not connected. Message not sent:", message)
    }
  }

  public joinChannel(channel: string): void {
    const joinMessage: WebSocketMessage = {
      action: "join",
      options: {
        channel,
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
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN
  }
}

// Create a singleton instance for global use
let wsClientInstance: WebSocketClient | null = null

export function getWebSocketClient(options?: WebSocketOptions): WebSocketClient {
  if (!wsClientInstance) {
    wsClientInstance = new WebSocketClient(options)
  } else if (options) {
    // Update options if provided
    wsClientInstance.disconnect()
    wsClientInstance = new WebSocketClient(options)
  }

  return wsClientInstance
}
