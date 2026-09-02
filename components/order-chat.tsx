"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { StandaloneArrowLeftFillIcon, StandaloneCheckRegularIcon } from "@deriv/quill-icons/Standalone"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { OrdersAPI } from "@/services/api"
import { OrderChatSendError } from "@/services/api/api-orders"
import { useWebSocketContext } from "@/contexts/websocket-context"
import { getChatErrorMessage, formatTime } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n/use-translations"
import { PresenceLastSeen } from "@/components/presence-last-seen"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAlertDialog } from "@/hooks/use-alert-dialog"
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Order } from "@/services/api/api-orders"
import { shouldDisableChatAttachments } from "@/lib/orders/order-chat-gating"
import { isP2POrderChatModerationEnabled } from "@/lib/orders/order-chat-feature-flags"
import { useUserDataStore } from "@/stores/user-data-store"

type Message = {
  attachment: {
    name: string
    url: string
  } | null
  id: string
  message: string
  sender_is_self: boolean
  isCounterparty: boolean
  is_read: boolean
  time: number
  rejected: boolean
  tags: string[]
}

function buildMessageId(raw: Record<string, unknown>): string {
  if (raw.id != null && String(raw.id) !== "") {
    return String(raw.id)
  }

  if (raw.row_id != null && String(raw.row_id) !== "") {
    return `row:${raw.row_id}`
  }

  const time = raw.time ?? raw.created_at ?? Date.now()
  const sender = raw.sender_is_self ?? ""
  const text = String(raw.message ?? "")
  const attachment =
    typeof raw.attachment === "object" && raw.attachment !== null
      ? String((raw.attachment as { url?: string; name?: string }).url ?? (raw.attachment as { name?: string }).name ?? "")
      : String(raw.attachment ?? "")

  return `msg-${time}-${sender}-${text.slice(0, 32)}-${attachment.slice(-16)}`
}

function normalizeChatMessage(raw: Record<string, unknown>): Message {
  const tags = Array.isArray(raw.tags) ? raw.tags.map(String) : []
  const rawTime = raw.time ?? raw.created_at
  const senderIsSelf = raw.sender_is_self === true

  return {
    id: buildMessageId(raw),
    attachment: (raw.attachment as Message["attachment"]) ?? null,
    message: String(raw.message ?? ""),
    sender_is_self: senderIsSelf,
    // Match mobile: missing sender_is_self defaults to counterparty (not self).
    isCounterparty: !senderIsSelf,
    is_read: Boolean(raw.is_read),
    time: Number(rawTime ?? Date.now()),
    rejected: Boolean(raw.rejected) || tags.length > 0,
    tags,
  }
}

function messageDedupeKey(msg: Message): string {
  if (msg.id && !msg.id.startsWith("local-rejected-")) {
    return `id:${msg.id}`
  }

  const attachmentKey = msg.attachment?.url ?? msg.attachment?.name ?? ""
  return `fallback:${msg.time}:${msg.sender_is_self}:${msg.message}:${attachmentKey}`
}

function stripMatchingLocalRejected(prev: Message[], incoming: Message): Message[] {
  if (!incoming.sender_is_self) {
    return prev
  }

  return prev.filter((msg) => {
    if (!msg.id.startsWith("local-rejected-")) {
      return true
    }

    if (incoming.message && msg.message === incoming.message) {
      return false
    }

    if (incoming.attachment?.name && msg.attachment?.name === incoming.attachment.name) {
      return false
    }

    return true
  })
}

function isDuplicateMessage(prev: Message[], incoming: Message): boolean {
  const key = messageDedupeKey(incoming)
  return prev.some((msg) => messageDedupeKey(msg) === key)
}

function findLatestUnreadCounterpartyMessage(messages: Message[]): Message | undefined {
  return messages.reduce<Message | undefined>(
    (latest, message) => (message.isCounterparty && !message.is_read ? message : latest),
    undefined,
  )
}

function getChatSendErrorInfo(error: unknown): { code: string; tags: string[] } | null {
  if (error instanceof OrderChatSendError) {
    return { code: error.code, tags: error.tags }
  }

  if (error instanceof Error) {
    return { code: error.message, tags: [] }
  }

  return null
}

function rejectionTags(tags: string[], fallback: string): string[] {
  return tags.length > 0 ? tags : [fallback]
}

function normalizeChatMessages(rawMessages: unknown[]): Message[] {
  return rawMessages
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map(normalizeChatMessage)
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

function groupMessagesByDate(messages: Message[]): Record<string, Message[]> {
  const groups: Record<string, Message[]> = {}

  messages.forEach((msg) => {
    const dateKey = new Date(msg.time).toDateString()
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(msg)
  })

  return groups
}

type OrderChatProps = {
  orderId: string
  counterpartyName: string
  counterpartyInitial: string
  isClosed: boolean
  order?: Order | null
  isAttachmentUploadDisabled?: boolean
  onNavigateToOrderDetails?: () => void
  onOpenProofOfTransfer?: () => void
  counterpartyOnlineStatus?: boolean
  counterpartyLastOnlineAt?: number
}

// Module-level (not per-instance) guard, keyed by orderId: this component is
// mounted twice at once for the same order (mobile full-screen chat view vs.
// the desktop panel that stays mounted, CSS-hidden, below the lg breakpoint),
// so more than one instance can request chat history for the same order at
// nearly the same moment. Dedupe here rather than chase the exact mount trigger.
const chatHistoryRequestedAt: Record<string, number> = {}

export default function OrderChat({
  orderId,
  counterpartyName,
  counterpartyInitial,
  isClosed,
  order = null,
  isAttachmentUploadDisabled = false,
  onNavigateToOrderDetails,
  onOpenProofOfTransfer,
  counterpartyOnlineStatus,
  counterpartyLastOnlineAt,
}: OrderChatProps) {
  const { t, locale } = useTranslations()
  const { showAlert } = useAlertDialog()
  const userId = useUserDataStore((state) => state.userId)
  const isAttachmentBlocked =
    order != null ? shouldDisableChatAttachments(order, userId) : isAttachmentUploadDisabled
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [attachmentsRemaining, setAttachmentsRemaining] = useState<number | null>(null)
  const [attachTooltipOpen, setAttachTooltipOpen] = useState(false)
  const messagesRef = useRef<Message[]>([])
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)
  const maxLength = 300
  const maxFileSizeBytes = 5 * 1024 * 1024 // 5 MB
  const isChatModerationEnabled = isP2POrderChatModerationEnabled()

  const { isConnected, getChatHistory, markChatMessagesRead, subscribe } = useWebSocketContext()
  const latestUnreadMessageId = findLatestUnreadCounterpartyMessage(messages)?.id

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const markUnreadMessagesRead = useCallback(() => {
    if (!isConnected) return

    const latestUnreadMessage = findLatestUnreadCounterpartyMessage(messagesRef.current)
    if (!latestUnreadMessage) return

    const updatedMessages = messagesRef.current.map((message) =>
      message.isCounterparty && !message.is_read ? { ...message, is_read: true } : message,
    )
    messagesRef.current = updatedMessages
    setMessages(updatedMessages)

    markChatMessagesRead("orders", orderId, latestUnreadMessage.id)
  }, [isConnected, markChatMessagesRead, orderId])

  useEffect(() => {
    if (latestUnreadMessageId) markUnreadMessagesRead()
  }, [latestUnreadMessageId, markUnreadMessagesRead])

  useEffect(() => {
    if (isConnected) markUnreadMessagesRead()
  }, [isConnected, markUnreadMessagesRead])

  useEffect(() => {
    if (!isAttachmentBlocked) {
      setAttachTooltipOpen(false)
    }
  }, [isAttachmentBlocked])

  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      const channel = data?.options?.channel
      if (channel && channel !== "orders") {
        return
      }

      if (data && data.payload && data.payload.data) {
        const payload = data.payload.data

        if (typeof payload.chat_attachments_limit === "number" && isChatModerationEnabled) {
          setAttachmentsRemaining(payload.chat_attachments_limit)
        }

        let shouldAckRead = false

        setMessages((prev) => {
          if (payload.chat_messages_read === true && String(payload.order_id) === String(orderId)) {
            return prev.map((message) =>
              message.sender_is_self ? { ...message, is_read: true } : message,
            )
          }

          if (payload.chat_history && Array.isArray(payload.chat_history)) {
            const history = normalizeChatMessages(payload.chat_history)
            if (history.some((message) => message.isCounterparty && !message.is_read)) {
              shouldAckRead = true
            }
            const historySelfTexts = new Set(
              history.filter((msg) => msg.sender_is_self && msg.message).map((msg) => msg.message),
            )
            const localRejected = prev.filter(
              (msg) =>
                msg.id.startsWith("local-rejected-") &&
                !(msg.message && historySelfTexts.has(msg.message)),
            )
            return [...history, ...localRejected]
          }

          if (payload.message || payload.attachment) {
            if (String(payload.order_id) === orderId) {
              const incoming = normalizeChatMessage(payload as Record<string, unknown>)
              const withoutStaleLocal = stripMatchingLocalRejected(prev, incoming)

              if (isDuplicateMessage(withoutStaleLocal, incoming)) {
                return withoutStaleLocal
              }

              if (incoming.isCounterparty && !incoming.is_read) {
                shouldAckRead = true
              }

              return [...withoutStaleLocal, incoming]
            }
          }

          return prev
        })

        if (shouldAckRead) {
          queueMicrotask(() => markUnreadMessagesRead())
        }

        setIsLoading(false)
      } else {
        setIsLoading(false)
      }
    })

    return unsubscribe
  }, [subscribe, orderId, isChatModerationEnabled, markUnreadMessagesRead])

  useEffect(() => {
    if (!isConnected) return
    const timeoutId = setTimeout(() => {
      const now = Date.now()
      const last = chatHistoryRequestedAt[orderId] ?? 0
      if (now - last < 2000) return
      chatHistoryRequestedAt[orderId] = now
      getChatHistory("orders", orderId)
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [isConnected, getChatHistory, orderId])

  useEffect(() => {
    const markReadOnFocus = () => {
      markUnreadMessagesRead()
    }

    window.addEventListener("focus", markReadOnFocus)
    return () => window.removeEventListener("focus", markReadOnFocus)
  }, [markUnreadMessagesRead])

  useEffect(() => {
    const c = messagesContainerRef.current
    if (c) c.scrollTop = c.scrollHeight
  }, [messages])

  const focusMessageInput = () => {
    requestAnimationFrame(() => {
      messageInputRef.current?.focus()
    })
  }

  const showOrderTempLockedAlert = () => {
    showAlert({
      title: t("order.tempLockedTitle"),
      description: t("order.tempLockedDescription"),
      confirmText: t("order.tryAgain"),
      cancelText: t("order.goBack"),
      type: "warning",
    })
  }

  const showPendingPotSubmissionAlert = () => {
    showAlert({
      title: t("chat.pendingPotSubmissionTitle"),
      description: t("chat.pendingPotSubmissionDescription"),
      confirmText: t("chat.submitDocument"),
      cancelText: t("chat.later"),
      type: "warning",
      onConfirm: () => onOpenProofOfTransfer?.(),
    })
  }

  const handleSendMessage = async () => {
    if (message.trim() === "" || isSending) return

    setIsSending(true)

    const messageToSend = message
    setMessage("")

    try {
      await OrdersAPI.sendChatMessage(orderId, messageToSend, null)
    } catch (error) {
      const chatError = getChatSendErrorInfo(error)
      const errorCode = chatError?.code ?? "UnknownError"

      if (errorCode === "OrderTempLocked") {
        showOrderTempLockedAlert()
      } else if (errorCode === "PendingPotSubmission") {
        showPendingPotSubmissionAlert()
      } else if (errorCode === "OrderChatMessageRejected") {
        // Server pushes the rejected message over WebSocket with moderation tags.
      } else if (errorCode === "BothChatMessageAndAttachmentPresent") {
        showAlert({
          title: t("chat.oneItemAtATimeTitle"),
          description: t("chat.oneItemAtATimeDescription"),
          confirmText: t("common.gotIt"),
          type: "warning",
        })
      }
    } finally {
      setIsSending(false)
      focusMessageInput()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const showFileTooLargeDialog = () => {
    showAlert({
      title: t("chat.fileTooLargeTitle"),
      description: t("chat.fileTooLargeDescription"),
      confirmText: t("chat.chooseAnotherFile"),
      cancelText: t("common.cancel"),
      type: "warning",
      onConfirm: () => {
        fileInputRef.current?.click()
      },
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      if (isAttachmentBlocked) {
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }

      const file = files[0]

      if (isChatModerationEnabled && attachmentsRemaining !== null && attachmentsRemaining <= 0) {
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }

      if (file.size > maxFileSizeBytes) {
        if (fileInputRef.current) fileInputRef.current.value = ""
        showFileTooLargeDialog()
        return
      }

      setIsSending(true)

      try {
        const base64 = await fileToBase64(file)
        await OrdersAPI.sendChatMessage(orderId, "", base64)
      } catch (error) {
        const chatError = getChatSendErrorInfo(error)
        const errorCode = chatError?.code ?? "UnknownError"

        if (errorCode === "OrderChatFileSizeExceeded") {
          showFileTooLargeDialog()
        } else if (errorCode === "ChatAttachmentCorrupted") {
          showAlert({
            title: t("chat.attachmentCorruptedTitle"),
            description: t("chat.attachmentCorruptedDescription"),
            confirmText: t("common.gotIt"),
            type: "warning",
          })
        } else if (errorCode === "OrderTempLocked") {
          showOrderTempLockedAlert()
        } else if (errorCode === "PendingPotSubmission") {
          showPendingPotSubmissionAlert()
        } else if (errorCode === "OrderChatAttachmentRejected") {
          setMessages((prev) => [
            ...prev,
            {
              id: `local-rejected-${Date.now()}`,
              attachment: { name: file.name, url: "" },
              message: "",
              sender_is_self: true,
              isCounterparty: false,
              is_read: false,
              time: Date.now(),
              rejected: true,
              tags: rejectionTags(chatError?.tags ?? [], "attachment_rejected"),
            },
          ])
        } else if (errorCode === "ChatAttachmentLimitReached") {
          setMessages((prev) => [
            ...prev,
            {
              id: `local-rejected-${Date.now()}`,
              attachment: { name: file.name, url: "" },
              message: "",
              sender_is_self: true,
              isCounterparty: false,
              is_read: false,
              time: Date.now(),
              rejected: true,
              tags: rejectionTags(chatError?.tags ?? [], "attachment_limit_reached"),
            },
          ])
        } else if (errorCode === "BothChatMessageAndAttachmentPresent") {
          showAlert({
            title: t("chat.oneItemAtATimeTitle"),
            description: t("chat.oneItemAtATimeDescription"),
            confirmText: t("common.gotIt"),
            type: "warning",
          })
        }
      } finally {
        setIsSending(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        focusMessageInput()
      }
    }
  }

  const formatDateHeader = (dateString: string): string => {
    const date = new Date(dateString)

    return date.toLocaleDateString(locale, {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full w-full" data-testid="order-chat-container">
      <div className="flex items-center p-4 border-b flex-shrink-0">
        {onNavigateToOrderDetails && (
          <Button
            variant="icon-muted"
            onClick={onNavigateToOrderDetails}
            className="me-[16px] !bg-black/[0.04] hover:!bg-black/[0.08]"
            aria-label={t("common.back")}
            data-testid="order-chat-btn-back"
          >
            <StandaloneArrowLeftFillIcon width={24} height={24} className="rtl:rotate-180" aria-hidden />
          </Button>
        )}
        <div className="relative w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold me-3">
          {counterpartyInitial}
          <div
            className={`absolute bottom-0 end-0 h-3 w-3 rounded-full border-2 border-white ${
              counterpartyOnlineStatus ? "bg-buy" : "bg-slate-400"
            }`}
          />
        </div>
        <div>
          <div className="font-medium">{counterpartyName}</div>
          {counterpartyOnlineStatus ? (
            <div className="text-xs text-slate-500">{t("chat.online")}</div>
          ) : (
            <PresenceLastSeen
              isOnline={counterpartyOnlineStatus}
              lastOnlineAt={counterpartyLastOnlineAt}
              className="text-xs text-slate-500"
            />
          )}
        </div>
      </div>
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto">
        <Alert variant="warning" className="m-4">
          <AlertDescription>
            <p><span className="font-bold">{t("chat.disclaimerImportant")}</span>{" "}{t("chat.disclaimerText")}</p>
            <div className="mt-4">
              <p className="font-bold">{t("chat.disclaimerNote")}</p>
              <ol className="mt-2 list-decimal space-y-2 ps-5">
                <li>{t("chat.disclaimerNoteText")}</li>
                <li>{t("chat.disclaimerNoteItem2")}</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {Object.entries(groupMessagesByDate(messages)).map(([dateKey, dateMessages]) => (
                <div key={dateKey}>
                  <div className="flex justify-center my-4">
                    <div className="text-grayscale-text-muted text-xs px-3 py-1 rounded-full">
                      {formatDateHeader(dateKey)}
                    </div>
                  </div>
                  {dateMessages.map((msg) => (
                    <div key={msg.id} dir="ltr" className={`flex ${msg.sender_is_self ? "justify-end" : "justify-start"}`} data-testid={`order-chat-msg-${msg.id}`}>
                      <div className="max-w-[80%] rounded-lg pb-[16px]">
                        {msg.attachment && (
                          <div className={`flex items-center gap-2 ${msg.sender_is_self ? "justify-end" : ""}`}>
                            <div
                              className={`relative ${msg.sender_is_self ? "bg-slate-200" : "bg-slate-1700"} p-[16px] rounded-[8px]`}
                            >
                              {!msg.sender_is_self && (
                                <div className="absolute left-0 top-[16px] w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-slate-1700 -translate-x-full" />
                              )}
                              {msg.sender_is_self && (
                                <div className="absolute right-0 top-[16px] w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[8px] border-l-slate-200 translate-x-full" />
                              )}
                              {msg.rejected ? (
                                <div className="bg-white border border-grayscale-200 rounded-[4px] flex flex-col items-center justify-center w-[160px] h-[120px] gap-[4px] p-[8px]">
                                  <Image src="/icons/image-unavailable.svg" alt="" aria-hidden="true" width={32} height={32} />
                                  <p className="text-xs text-slate-1200 text-center">{t("chat.imageBlocked")}</p>
                                </div>
                              ) : (
                                <div className="bg-slate-75 p-[8px] rounded-[4px] text-xs">
                                  <a
                                    href={msg.attachment.url}
                                    target="_blank"
                                    download
                                    rel="noreferrer"
                                    data-testid={`order-chat-link-download-${msg.id}`}
                                  >
                                    {msg.attachment.name}
                                  </a>
                                </div>
                              )}
                            </div>
                            {msg.rejected && (
                              <Image src="/icons/warning-circle.png" alt={t("common.error")} width={24} height={24} className="shrink-0" />
                            )}
                          </div>
                        )}
                        {msg.message && (
                          <div className={`flex items-center gap-2 ${msg.sender_is_self ? "justify-end" : ""}`}>
                            <div
                              className={`relative break-words ${msg.sender_is_self ? (msg.rejected ? "bg-slate-200 opacity-50" : "bg-slate-200") : "bg-slate-1700"} p-[16px] rounded-[8px]`}
                            >
                              {!msg.sender_is_self && (
                                <div className="absolute left-0 top-[16px] w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-slate-1700 -translate-x-full" />
                              )}
                              {msg.sender_is_self && (
                                <div className="absolute right-0 top-[16px] w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[8px] border-l-slate-200 translate-x-full" />
                              )}
                              {msg.message}
                            </div>
                            {msg.rejected && (
                              <Image
                                src="/icons/warning-circle.png"
                                alt={t("common.error")}
                                width={24}
                                height={24}
                                className="shrink-0"
                              />
                            )}
                          </div>
                        )}
                        {msg.rejected && msg.tags ? (
                          <div className="text-xs text-error-text mt-[4px]">
                            {msg.tags.includes("attachment_rejected")
                              ? t("chat.errorAttachmentRejected")
                              : msg.tags.includes("attachment_limit_reached")
                                ? t("chat.errorAttachmentLimitReached")
                                : t("chat.messageNotSent", { error: getChatErrorMessage(msg.tags, t) })}
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "flex items-center gap-1 text-xs mt-1 text-grayscale-text-muted justify-start",
                              msg.sender_is_self && "justify-end",
                            )}
                          >
                            {msg.time && formatTime(msg.time)}
                            {msg.sender_is_self && (
                              <span
                                className={cn(
                                  "relative block h-5 w-[28px] shrink-0",
                                  msg.is_read ? "text-blue-800" : "text-grayscale-text-muted",
                                )}
                                aria-label={msg.is_read ? t("chat.messageStatusRead") : t("chat.messageStatusSent")}
                                data-testid={`order-chat-receipt-${msg.id}`}
                              >
                                <StandaloneCheckRegularIcon
                                  iconSize="xs"
                                  width={20}
                                  height={20}
                                  fill="currentColor"
                                  aria-hidden="true"
                                  className="absolute left-0 top-0"
                                />
                                {msg.is_read && (
                                  <StandaloneCheckRegularIcon
                                    iconSize="xs"
                                    width={20}
                                    height={20}
                                    fill="currentColor"
                                    aria-hidden="true"
                                    className="absolute left-[9px] top-0"
                                  />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {isClosed ? (
        <div className="p-4 border-t text-center text-sm text-neutral-7 bg-slate-75 flex-shrink-0">
          {t("chat.conversationClosed")}
        </div>
      ) : (
        <div className="p-4 border-t bg-slate-75 flex-shrink-0">
          <div className="space-y-2">
            <div className="relative">
              <Input
                ref={messageInputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
                onKeyDown={handleKeyDown}
                placeholder={t("chat.enterMessage")}
                className="w-full rounded-[8px] pe-12 resize-none min-h-[56px] placeholder:text-grayscale-text-placeholder"
                data-testid="order-chat-input-message"
              />
              {message.trim() || isSending ? (
                <Button
                  className="absolute end-3 top-1/2 transform -translate-y-1/2 !rounded-full !p-1 !min-w-0 !h-auto !bg-transparent text-grayscale-text-muted hover:!bg-black/10 hover:text-slate-700"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSendMessage}
                  variant="ghost"
                  size="sm"
                  disabled={isSending}
                  data-testid="order-chat-btn-send"
                >
                  {isSending ? (
                    <Spinner size="sm" />
                  ) : (
                    <Image src="/icons/send-message.png" alt={t("common.sendMessage")} width={20} height={20} className="h-5 w-5" />
                  )}
                </Button>
              ) : isAttachmentBlocked ? (
                <TooltipProvider>
                  <Tooltip open={attachTooltipOpen} onOpenChange={setAttachTooltipOpen}>
                    <TooltipTrigger asChild>
                      <Button
                        className="absolute end-3 top-1/2 transform -translate-y-1/2 !rounded-full !p-1 !min-w-0 !h-auto !bg-transparent text-grayscale-text-muted opacity-40 cursor-not-allowed"
                        variant="ghost"
                        size="sm"
                        type="button"
                        aria-label={t("chat.attachFile")}
                        onClick={(e) => {
                          e.preventDefault()
                          setAttachTooltipOpen((open) => !open)
                        }}
                        data-testid="order-chat-btn-attach"
                      >
                        <Image src="/icons/paperclip-icon.png" alt="" aria-hidden="true" width={20} height={20} className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      className="!p-3 w-max max-w-[220px] text-start leading-snug"
                      side="top"
                      sideOffset={8}
                    >
                      <p className="m-0 text-white text-xs">{t("chat.attachmentUploadRequiresPot")}</p>
                      <TooltipArrow className="fill-black" />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  className="absolute end-3 top-1/2 transform -translate-y-1/2 !rounded-full !p-1 !min-w-0 !h-auto !bg-transparent text-grayscale-text-muted hover:!bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => fileInputRef.current?.click()}
                  variant="ghost"
                  size="sm"
                  aria-label={t("chat.attachFile")}
                  disabled={isChatModerationEnabled && attachmentsRemaining !== null && attachmentsRemaining <= 0}
                  data-testid="order-chat-btn-attach"
                >
                  <Image src="/icons/paperclip-icon.png" alt="" aria-hidden="true" width={20} height={20} className="h-5 w-5" />
                </Button>
              )}
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,application/pdf"
                data-testid="order-chat-input-file"
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="text-xs ms-1">
                {isChatModerationEnabled && attachmentsRemaining !== null && (
                  <span className={attachmentsRemaining <= 0 ? "text-error-text" : "text-grayscale-text-muted"}>
                    {t("chat.attachmentsRemaining", { count: attachmentsRemaining })}
                  </span>
                )}
              </div>
              <div className="text-xs text-grayscale-text-muted me-4">
                {message.length}/{maxLength}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
