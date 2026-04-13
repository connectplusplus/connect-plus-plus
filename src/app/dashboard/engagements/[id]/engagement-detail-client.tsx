'use client'

import { useState } from 'react'
import type { Engagement, Milestone, Message, OutcomeTemplate } from '@/lib/types'
import { MilestoneTracker } from '@/components/dashboard/milestone-tracker'
import { MessageThread } from '@/components/dashboard/message-thread'
import { EngagementStatusBadge } from '@/components/dashboard/status-badge'
import { MODE_COLORS, MODE_LABELS, ENGAGEMENT_STATUS_LABELS } from '@/lib/constants'
import { formatCents } from '@/lib/utils'
import {
  Calendar,
  DollarSign,
  Layers,
  MessageCircle,
  BarChart2,
} from 'lucide-react'

type Tab = 'overview' | 'milestones' | 'messages'

interface EngagementDetailClientProps {
  engagement: Engagement & { outcome_templates?: OutcomeTemplate | null }
  milestones: Milestone[]
  messages: Message[]
  currentUserId?: string
  currentUserName?: string
}

export function EngagementDetailClient({
  engagement,
  milestones,
  messages,
  currentUserId,
  currentUserName,
}: EngagementDetailClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const completedMilestones = milestones.filter((m) => m.status === 'completed').length
  const totalMilestones = milestones.length
  const progressPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

  const modeColor = MODE_COLORS[engagement.mode]
  const modeLabel = MODE_LABELS[engagement.mode]

  const startDate = engagement.start_date
    ? new Date(engagement.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null
  const targetEndDate = engagement.target_end_date
    ? new Date(engagement.target_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const daysElapsed = engagement.start_date
    ? Math.floor((Date.now() - new Date(engagement.start_date).getTime()) / 86400000)
    : null

  const currentMilestone = milestones.find(
    (m) => m.status === 'in_progress' || m.status === 'in_review'
  )

  const tabs: Array<{ id: Tab; label: string; icon: typeof Layers }> = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'milestones', label: `Milestones (${totalMilestones})`, icon: Layers },
    { id: 'messages', label: `Messages (${messages.filter((m) => !m.is_system_message).length})`, icon: MessageCircle },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full border"
            style={{ color: modeColor, borderColor: `${modeColor}40`, backgroundColor: `${modeColor}10` }}
          >
            {modeLabel}
          </span>
          <EngagementStatusBadge status={engagement.status} />
          {engagement.outcome_templates && (
            <span className="text-[#6B7280] text-xs">
              Template: {engagement.outcome_templates.title}
            </span>
          )}
        </div>
        <h1 className="font-heading font-bold text-2xl text-white">{engagement.title}</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#2A2A30]">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150 -mb-px ${
                activeTab === tab.id
                  ? 'border-[#A6F84C] text-[#A6F84C]'
                  : 'border-transparent text-[#9CA3AF] hover:text-white'
              }`}
            >
              <tab.icon size={14} strokeWidth={1.5} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Progress',
                value: `${progressPct}%`,
                sub: `${completedMilestones}/${totalMilestones} milestones`,
                color: '#A6F84C',
              },
              {
                label: 'Days Elapsed',
                value: daysElapsed !== null ? `${daysElapsed}d` : '—',
                sub: startDate ? `Since ${startDate}` : 'Not started',
                color: '#60A5FA',
              },
              {
                label: 'Current Phase',
                value: currentMilestone?.title ?? (engagement.status === 'active' ? 'In Progress' : ENGAGEMENT_STATUS_LABELS[engagement.status]),
                sub: 'Active milestone',
                color: '#FBBF24',
                small: true,
              },
              {
                label: 'Budget',
                value: engagement.price_cents ? formatCents(engagement.price_cents) : 'TBD',
                sub: 'Fixed price',
                color: '#34D399',
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-4">
                <p className="text-[#9CA3AF] text-xs mb-2">{stat.label}</p>
                <p
                  className={`font-mono-brand font-semibold text-white mb-0.5 ${stat.small ? 'text-sm' : 'text-xl'}`}
                >
                  {stat.value}
                </p>
                <p className="text-[#6B7280] text-xs">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Dates */}
          <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-5">
            <h3 className="font-heading font-semibold text-white text-sm mb-4">Timeline</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Start Date', value: startDate, icon: Calendar },
                { label: 'Target End', value: targetEndDate, icon: Calendar },
                { label: 'Price', value: engagement.price_cents ? formatCents(engagement.price_cents) : 'TBD', icon: DollarSign },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1E1E24] rounded-lg flex items-center justify-center shrink-0">
                    <item.icon size={14} className="text-[#9CA3AF]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[#6B7280] text-xs">{item.label}</p>
                    <p className="text-white text-sm font-medium">{item.value ?? '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scope summary */}
          {engagement.scope_summary && (
            <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-5">
              <h3 className="font-heading font-semibold text-white text-sm mb-3">Scope Summary</h3>
              <p className="text-[#9CA3AF] text-sm leading-relaxed">{engagement.scope_summary}</p>
            </div>
          )}

          {/* Progress bar */}
          {totalMilestones > 0 && (
            <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-white text-sm">Overall Progress</h3>
                <span className="font-mono-brand text-[#A6F84C] font-semibold text-sm">{progressPct}%</span>
              </div>
              <div className="h-2 bg-[#1E1E24] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-[#A6F84C] rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-[#6B7280] text-xs">
                {completedMilestones} of {totalMilestones} milestones completed
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'milestones' && (
        <MilestoneTracker milestones={milestones} />
      )}

      {activeTab === 'messages' && (
        <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-5" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
          <MessageThread
            messages={messages}
            engagementId={engagement.id}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </div>
      )}
    </div>
  )
}
