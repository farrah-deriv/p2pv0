/** Whether order chat moderation (limits, POT gating, WS rejection flow) is enabled. */
export function isP2POrderChatModerationEnabled(): boolean {
  return process.env.NEXT_PUBLIC_P2P_ORDER_CHAT_MODERATION_ENABLED === "1"
}
