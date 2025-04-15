"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Paperclip, Send, AlertCircle } from "lucide-react"
import { OrdersAPI } from "@/services/api"
import { useWebSocket } from "@/hooks/use-websocket"

type Message = {
  id: string
  message: string
  sender_is_self: boolean
  time: number
}

type OrderChatProps = {
  orderId: string
  counterpartyName: string
  counterpartyInitial: string
}

export default function OrderChat({ orderId, counterpartyName, counterpartyInitial }: OrderChatProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [lastSeen, setLastSeen] = useState<Date>(new Date())
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const maxLength = 300

  // Use our custom WebSocket hook
  const { isConnected, joinChannel, getChatHistory, sendMessage } = useWebSocket({
    onMessage: (data) => {
      // Handle incoming messages
      if (data && data.payload && data.payload.data) {
        // Handle chat history
        if (data.payload.data.chat_history && Array.isArray(data.payload.data.chat_history)) {
          setMessages(data.payload.data.chat_history)
          setIsLoading(false)
        }

        // Handle new message
        if (data.payload.data.message) {
          const newMessage = data.payload.data.message
          setMessages((prev) => [
            ...prev,
            {
              id: newMessage.id,
              message: newMessage.message,
              sender_is_self: newMessage.sender_is_self,
              time: newMessage.time,
            },
          ])
        }
      }
    },
    onOpen: () => {
      // Join the orders channel when connection is established
      joinChannel("orders")

      // Get chat history after joining the channel
      setTimeout(() => {
        getChatHistory("orders", orderId)
      }, 1000)
    },
  })

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (message.trim() === "" || isSending) return

    setIsSending(true)

    try {
      // Clear the input
      const messageToSend = message
      setMessage("")

      // Send the message to the API
      const result = await OrdersAPI.sendChatMessage(orderId, messageToSend)

      if (result.success) {
        // Request updated chat history
        if (isConnected) {
          getChatHistory("orders", orderId)
        }
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Counterparty info */}
      <div className="flex items-center p-4 border-b">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold mr-3">
          {counterpartyInitial}
        </div>
        <div>
          <div className="font-medium">{counterpartyName}</div>
          <div className="text-sm text-slate-500">Seen {formatLastSeen(lastSeen)}</div>
        </div>
      </div>

      {/* Important notice */}
      <div className="p-4 bg-white">
        <div className="flex mb-4">
          <div className="mr-2 text-yellow-500">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <div>
              <span className="font-bold">Important:</span> Deriv will never contact you via WhatsApp to ask for your
              personal information. Always ignore any messages from numbers claiming to be from Deriv.
            </div>
            <div className="mb-2">
              <span className="font-bold">Note:</span> In case of a dispute, we'll use this chat as a reference.
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">No messages yet</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_is_self ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg p-3 ${msg.sender_is_self ? "bg-blue-50" : "bg-slate-100"}`}>
                <div>{msg.message}</div>
                <div className={`text-xs mt-1 ${msg.sender_is_self ? "text-blue-500" : "text-slate-500"}`}>
                  {formatMessageTime(msg.time)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-4 border-t">
        <div className="flex items-center">
          <button className="p-2 text-slate-500 hover:text-slate-700">
            <Paperclip className="h-5 w-5" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
              onKeyDown={handleKeyDown}
              placeholder="Enter message"
              className="w-full border rounded-lg p-2 pr-10 resize-none focus:outline-none focus:ring-1"
              rows={1}
              disabled={isSending}
            />
            <button
              onClick={handleSendMessage}
              disabled={message.trim() === "" || isSending}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 disabled:text-slate-300"
            >
              <Send className={`h-5 w-5 ${isSending ? "animate-pulse" : ""}`} />
            </button>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500 mt-1">
          {message.length}/{maxLength}
        </div>
      </div>
    </div>
  )
}

// Helper functions
function formatLastSeen(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`

  return date.toLocaleDateString()
}

function formatMessageTime(time: number): string {
  const date = new Date(time)
  return date.toLocaleString()
}
