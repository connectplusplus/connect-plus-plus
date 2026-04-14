import Link from 'next/link'
import { ChevronRight, MessageSquare } from 'lucide-react'
import { EngagementStatusBadge } from './status-badge'
import { MilestoneTimeline } from './milestone-timeline'
import type { Engagement, Milestone, Message } from '@/lib/types'
import { MODE_COLORS, MODE_LABELS } from '@/lib/constants'
import { formatRelativeTime } from '@/lib/utils'

interface EngagementCardProps {
  engagement: Engagement
  milestones?: Milestone[]
  lastMessage?: Message | null
}

export function EngagementCard({ engagement, milestones = [], lastMessage }: EngagementCardProps) {
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length
  const totalMilestones = milestones.length
  const progressPct = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

  const modeColor = MODE_COLORS[engagement.mode]
  const modeLabel = MODE_LABELS[engagement.mode]

  return (
    <Link href={`/dashboard/engagements/${engagement.id}`} className="block group">
      <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-5 hover:border-[#A6F84C]/30 hover:-translate-y-0.5 transition-all duration-150 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 mr-3">
            <h3 className="text-white font-medium text-sm leading-tight mb-1.5 group-hover:text-[#A6F84C] transition-colors duration-150 min-h-[2.5rem] line-clamp-2">
              {engagement.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full border"
                style={{
                  color: modeColor,
                  borderColor: `${modeColor}40`,
                  backgroundColor: `${modeColor}10`,
                }}
              >
                {modeLabel}
              </span>
              <EngagementStatusBadge status={engagement.status} />
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-[#6B7280] group-hover:text-[#A6F84C] shrink-0 mt-0.5 transition-colors duration-150"
          />
        </div>

        {/* Milestone timeline */}
        {totalMilestones > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#9CA3AF] text-xs">
                {completedMilestones}/{totalMilestones} milestones
              </span>
              <span className="text-[#9CA3AF] text-xs font-mono-brand">
                {Math.round(progressPct)}%
              </span>
            </div>
            <MilestoneTimeline milestones={milestones} compact />
          </div>
        )}

        {/* Last message */}
        {lastMessage && (
          <div className="flex items-start gap-2 pt-3 border-t border-[#2A2A30] mt-auto">
            <MessageSquare size={13} className="text-[#6B7280] shrink-0 mt-0.5" strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[#9CA3AF] text-xs font-medium">{lastMessage.sender_name}</span>
                <span className="text-[#6B7280] text-xs">
                  {formatRelativeTime(lastMessage.created_at)}
                </span>
              </div>
              <p className="text-[#6B7280] text-xs line-clamp-1">{lastMessage.content}</p>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
