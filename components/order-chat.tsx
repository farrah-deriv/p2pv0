"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Paperclip, Send, AlertCircle } from "lucide-react"

type Message = {
  id: string
  text: string
  sender: "user" | "counterparty"
  timestamp: Date
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const maxLength = 300

  // Simulate fetching messages
  useEffect(() => {
    // This would be replaced with an actual API call
    const mockMessages: Message[] = []
    setMessages(mockMessages)
    setLastSeen(new Date(Date.now() - 60 * 60 * 1000)) // 1 hour ago
  }, [orderId])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (message.trim() === "") return

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setMessage("")
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
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${msg.sender === "user" ? "" : "bg-slate-100"}`}>
              <div>{msg.text}</div>
              <div className={`text-xs mt-1 ${msg.sender === "user" ? "" : "text-slate-500"}`}>
                {formatMessageTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}
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
            />
            <button
              onClick={handleSendMessage}
              disabled={message.trim() === ""}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 disabled:text-slate-300"
            >
              <Send className="h-5 w-5" />
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

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

