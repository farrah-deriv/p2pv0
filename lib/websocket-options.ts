export interface WebSocketOptions {
  onOpen?: (socket: WebSocket) => void
  onMessage?: (data: any, socket: WebSocket) => void
  onClose?: (event: CloseEvent, socket: WebSocket) => void
  onError?: (error: Event, socket: WebSocket) => void
}
