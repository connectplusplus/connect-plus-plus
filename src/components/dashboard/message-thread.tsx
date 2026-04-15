'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import type { Message } from '@/lib/types'
import { SENDER_ROLE_COLORS, SENDER_ROLE_LABELS } from '@/lib/constants'
import { getInitials, formatRelativeTime } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'

interface MessageThreadProps {
  messages: Message[]
  engagementId: string
  currentUserId?: string
  currentUserName?: string
}

export function MessageThread({
  messages: initialMessages,
  engagementId,
  currentUserId,
  currentUserName = 'You',
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || sending) return

    const content = input.trim()
    setInput('')

    // Optimistic update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      engagement_id: engagementId,
      user_id: currentUserId ?? null,
      sender_name: currentUserName,
      sender_role: 'client',
      content,
      is_system_message: false,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticMsg])
    setSending(true)

    try {
      const supabase = createClient()
      const { data: newMsg, error } = await supabase
        .from('messages')
        .insert({
          engagement_id: engagementId,
          user_id: currentUserId,
          sender_name: currentUserName,
          sender_role: 'client',
          content,
          is_system_message: false,
        })
        .select()
        .single()

      if (error) throw error

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? (newMsg as Message) : m))
      )
    } catch (err) {
      console.error('Failed to send message:', err)
      // Remove the optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
      setInput(content) // Restore input
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-10 text-[#64748B] text-sm">
            No messages yet. Start the conversation.
          </div>
        )}

        {messages.map((msg) => {
          if (msg.is_system_message) {
            return (
              <div key={msg.id} className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-[#E2E8F0]" />
                <span className="text-[#94A3B8] text-xs whitespace-nowrap">{msg.content}</span>
                <div className="flex-1 h-px bg-[#E2E8F0]" />
              </div>
            )
          }

          const isCurrentUser = msg.user_id === currentUserId
          const roleColor = SENDER_ROLE_COLORS[msg.sender_role]
          const roleLabel = SENDER_ROLE_LABELS[msg.sender_role]
          const initials = getInitials(msg.sender_name)

          return (
            <div key={msg.id} className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono-brand font-semibold shrink-0 mt-0.5"
                style={{ backgroundColor: `${roleColor}15`, color: roleColor }}
              >
                {initials}
              </div>

              {/* Bubble */}
              <div className={`max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`flex items-center gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[#0F172A] text-xs font-medium">{msg.sender_name}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded border"
                    style={{ color: roleColor, borderColor: `${roleColor}30`, backgroundColor: `${roleColor}10` }}
                  >
                    {roleLabel}
                  </span>
                  <span className="text-[#94A3B8] text-xs">{formatRelativeTime(msg.created_at)}</span>
                </div>
                <div
                  className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    isCurrentUser
                      ? 'bg-[#7C3AED]/10 border border-[#7C3AED]/20 text-[#0F172A]'
                      : 'bg-[#F1F5F9] border border-[#E2E8F0] text-[#1E293B]'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {currentUserId && (
        <form onSubmit={handleSend} className="border-t border-[#E2E8F0] pt-4">
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
              rows={2}
              disabled={sending}
              className="flex-1 bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#7C3AED] resize-none text-sm"
            />
            <Button
              type="submit"
              disabled={!input.trim() || sending}
              className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] self-end h-10 w-10 p-0"
            >
              <Send size={15} strokeWidth={2} />
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
