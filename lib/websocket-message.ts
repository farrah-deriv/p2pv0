export interface WebSocketMessage {
  action: string
  options?: {
    channel?: string
    [key: string]: any
  }
  payload?: {
    [key: string]: any
  }
}

export interface BalanceUpdateMessage extends WebSocketMessage {
  action: "balance_updated"
  payload: {
    balances: Array<{ amount: string; currency: string }>
    user_id?: string
  }
}
