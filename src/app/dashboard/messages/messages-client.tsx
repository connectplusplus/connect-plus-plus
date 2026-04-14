'use client'

import { useState, useMemo } from 'react'
import type { Engagement, Message } from '@/lib/types'
import { MessageThread } from '@/components/dashboard/message-thread'
import { SENDER_ROLE_COLORS } from '@/lib/constants'
import { formatRelativeTime, getInitials } from '@/lib/utils'
import { Inbox, ChevronRight, MessageCircle } from 'lucide-react'

interface MessagesClientProps {
  engagements: Engagement[]
  messages: Message[]
  currentUserId: string
  currentUserName: string
}

type FolderKey = 'inbox' | string // 'inbox' or engagement id

export function MessagesClient({
  engagements,
  messages,
  currentUserId,
  currentUserName,
}: MessagesClientProps) {
  const [activeFolder, setActiveFolder] = useState<FolderKey>('inbox')

  // Group messages by engagement
  const messagesByEngagement = useMemo(() => {
    const map: Record<string, Message[]> = {}
    for (const msg of messages) {
      if (!map[msg.engagement_id]) map[msg.engagement_id] = []
      map[msg.engagement_id].push(msg)
    }
    return map
  }, [messages])

  // Count unread (non-system messages not from current user) per engagement
  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    let totalUnread = 0
    for (const eng of engagements) {
      const msgs = messagesByEngagement[eng.id] ?? []
      // For demo: count non-system messages not from current user in last 7 days as "unread"
      const recent = msgs.filter(
        (m) =>
          !m.is_system_message &&
          m.user_id !== currentUserId &&
          Date.now() - new Date(m.created_at).getTime() < 7 * 86400000
      )
      counts[eng.id] = recent.length
      totalUnread += recent.length
    }
    counts['inbox'] = totalUnread
    return counts
  }, [engagements, messagesByEngagement, currentUserId])

  // Get the last non-system message per engagement for preview
  const lastMessages = useMemo(() => {
    const map: Record<string, Message | null> = {}
    for (const eng of engagements) {
      const msgs = (messagesByEngagement[eng.id] ?? []).filter((m) => !m.is_system_message)
      map[eng.id] = msgs.length > 0 ? msgs[msgs.length - 1] : null
    }
    return map
  }, [engagements, messagesByEngagement])

  // Messages for the active view
  const activeMessages = useMemo(() => {
    if (activeFolder === 'inbox') {
      // All non-system messages, sorted by time
      return messages.filter((m) => !m.is_system_message).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }
    return messagesByEngagement[activeFolder] ?? []
  }, [activeFolder, messages, messagesByEngagement])

  const activeEngagement = engagements.find((e) => e.id === activeFolder)

  // Short title helper
  function shortTitle(title: string) {
    if (title.length <= 35) return title
    return title.slice(0, 32) + '...'
  }

  return (
    <div className="max-w-6xl mx-auto flex gap-4 h-[calc(100vh-8rem)]">

      {/* ── Left sidebar: folders ──────────────────────────────────── */}
      <div className="w-64 shrink-0 border border-[#E2E8F0] rounded-xl bg-white flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E2E8F0]">
          <h2 className="font-heading font-semibold text-[#0F172A] text-base">Messages</h2>
        </div>

          <div className="flex-1 overflow-y-auto">
            {/* Global inbox */}
            <button
              onClick={() => setActiveFolder('inbox')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                activeFolder === 'inbox'
                  ? 'bg-[#7C3AED]/10 border-r-2 border-[#7C3AED]'
                  : 'hover:bg-[#F1F5F9]'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center shrink-0">
                <Inbox size={15} className={activeFolder === 'inbox' ? 'text-[#7C3AED]' : 'text-[#64748B]'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${activeFolder === 'inbox' ? 'text-[#7C3AED]' : 'text-[#0F172A]'}`}>
                  All Messages
                </p>
                <p className="text-[#94A3B8] text-xs">{messages.filter((m) => !m.is_system_message).length} messages</p>
              </div>
              {unreadCounts['inbox'] > 0 && (
                <span className="bg-[#7C3AED] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  {unreadCounts['inbox']}
                </span>
              )}
            </button>

            <div className="px-4 py-2">
              <p className="text-[#94A3B8] text-[10px] uppercase tracking-widest font-medium">Engagements</p>
            </div>

            {/* Engagement folders */}
            {engagements.map((eng) => {
              const lastMsg = lastMessages[eng.id]
              const isActive = activeFolder === eng.id
              const count = unreadCounts[eng.id] ?? 0

              return (
                <button
                  key={eng.id}
                  onClick={() => setActiveFolder(eng.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                    isActive
                      ? 'bg-[#7C3AED]/10 border-r-2 border-[#7C3AED]'
                      : 'hover:bg-[#F1F5F9]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center shrink-0 mt-0.5">
                    <MessageCircle size={14} className={isActive ? 'text-[#7C3AED]' : 'text-[#94A3B8]'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-[#7C3AED]' : 'text-[#0F172A]'}`}>
                      {shortTitle(eng.title)}
                    </p>
                    {lastMsg && (
                      <p className="text-[#94A3B8] text-xs truncate mt-0.5">
                        <span className="text-[#64748B]">{lastMsg.sender_name.split(' ')[0]}:</span>{' '}
                        {lastMsg.content.slice(0, 50)}{lastMsg.content.length > 50 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  {count > 0 && (
                    <span className="bg-[#7C3AED] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

      {/* ── Right panel: message content ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 border border-[#E2E8F0] rounded-xl bg-white overflow-hidden">

          {activeFolder === 'inbox' ? (
            /* ── Inbox: list of all recent messages ──────────────── */
            <>
              <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-2">
                <Inbox size={16} className="text-[#7C3AED]" />
                <h3 className="font-heading font-semibold text-[#0F172A] text-sm">All Messages</h3>
                <span className="text-[#94A3B8] text-xs ml-1">
                  {activeMessages.length} messages across {engagements.length} engagements
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {activeMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-14 h-14 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-4">
                      <MessageCircle size={24} className="text-[#94A3B8]" />
                    </div>
                    <p className="text-[#64748B] text-sm">No messages yet.</p>
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const eng = engagements.find((e) => e.id === msg.engagement_id)
                    const roleColor = SENDER_ROLE_COLORS[msg.sender_role]
                    const initials = getInitials(msg.sender_name)

                    return (
                      <button
                        key={msg.id}
                        onClick={() => setActiveFolder(msg.engagement_id)}
                        className="w-full flex items-start gap-3 px-5 py-4 border-b border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors text-left"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono-brand font-semibold shrink-0 mt-0.5"
                          style={{ backgroundColor: `${roleColor}15`, color: roleColor }}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[#0F172A] text-sm font-medium">{msg.sender_name}</span>
                            <span className="text-[#94A3B8] text-xs">{formatRelativeTime(msg.created_at)}</span>
                          </div>
                          {eng && (
                            <p className="text-[#7C3AED] text-[10px] font-medium uppercase tracking-wide mb-1">
                              {shortTitle(eng.title)}
                            </p>
                          )}
                          <p className="text-[#64748B] text-sm line-clamp-2">{msg.content}</p>
                        </div>
                        <ChevronRight size={14} className="text-[#94A3B8] shrink-0 mt-2" />
                      </button>
                    )
                  })
                )}
              </div>
            </>
          ) : (
            /* ── Engagement thread ───────────────────────────────── */
            <>
              <div className="p-4 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveFolder('inbox')}
                    className="text-[#94A3B8] hover:text-[#0F172A] text-xs transition-colors"
                  >
                    Inbox
                  </button>
                  <ChevronRight size={12} className="text-[#94A3B8]" />
                  <h3 className="font-heading font-semibold text-[#0F172A] text-sm truncate">
                    {activeEngagement?.title ?? 'Engagement'}
                  </h3>
                </div>
              </div>
              <div className="flex-1 p-5 overflow-hidden flex flex-col">
                <MessageThread
                  messages={activeMessages}
                  engagementId={activeFolder}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                />
              </div>
            </>
          )}
      </div>
    </div>
  )
}
