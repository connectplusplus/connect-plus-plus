'use client'

import { useState } from 'react'
import type { EngagementSignals } from '@/lib/types'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface SignalsPanelProps {
  signals: EngagementSignals
}

type SignalStatus = 'green' | 'amber' | 'red'

interface SignalRow {
  label: string
  value: string
  status: SignalStatus
}

function getSignalRows(s: EngagementSignals): SignalRow[] {
  const rows: SignalRow[] = []

  // Timeline
  const timelineStatus: SignalStatus =
    Math.abs(s.milestones.variance) <= 5 ? 'green' :
    s.milestones.variance >= -15 ? 'amber' : 'red'
  rows.push({
    label: 'Timeline',
    value: `${Math.round(s.timeline.percent_through * 100)}% through, ${s.milestones.percent_complete}% complete  ${s.milestones.variance >= 0 ? '✓' : '⚠'} ${Math.abs(s.milestones.variance)}% ${s.milestones.variance >= 0 ? 'ahead' : 'behind'}`,
    status: timelineStatus,
  })

  // Milestones
  const msStatus: SignalStatus = s.milestones.blocked > 0 ? 'red' : s.milestones.in_review > 0 ? 'amber' : 'green'
  const parts = []
  if (s.milestones.completed > 0) parts.push(`${s.milestones.completed} complete`)
  if (s.milestones.in_progress > 0) parts.push(`${s.milestones.in_progress} in progress`)
  if (s.milestones.in_review > 0) parts.push(`${s.milestones.in_review} in review`)
  if (s.milestones.blocked > 0) parts.push(`${s.milestones.blocked} blocked`)
  if (s.milestones.upcoming > 0) parts.push(`${s.milestones.upcoming} upcoming`)
  rows.push({ label: 'Milestones', value: parts.join(', '), status: msStatus })

  // Current milestone
  if (s.milestones.current_milestone) {
    const cm = s.milestones.current_milestone
    const cmStatus: SignalStatus = cm.is_blocked ? 'red' : cm.days_until_due < 3 ? 'amber' : 'green'
    rows.push({
      label: 'Current milestone',
      value: `${cm.title}\nDue in ${cm.days_until_due} days · ${cm.deliverables_completed}/${cm.deliverables_total} deliverables done${cm.is_blocked ? ' · BLOCKED' : ''}`,
      status: cmStatus,
    })
  }

  // Health trend
  const trendStatus: SignalStatus =
    s.recent_activity.health_trend === 'declining' ? 'red' :
    s.recent_activity.health_trend === 'improving' ? 'green' : 'amber'
  const trendLabel = {
    improving: 'Improving ↑',
    stable: 'Stable →',
    declining: 'Declining ↓',
    no_data: 'No data',
  }[s.recent_activity.health_trend]
  rows.push({
    label: 'Health trend',
    value: `${trendLabel}${s.recent_activity.last_report_health ? ` (last: ${s.recent_activity.last_report_health})` : ''}`,
    status: trendStatus,
  })

  // Last report
  const reportStatus: SignalStatus =
    s.recent_activity.days_since_last_report <= 1 ? 'green' :
    s.recent_activity.days_since_last_report <= 3 ? 'amber' : 'red'
  rows.push({
    label: 'Last report',
    value: s.recent_activity.last_report_date
      ? `${s.recent_activity.days_since_last_report === 0 ? 'Today' : s.recent_activity.days_since_last_report === 1 ? 'Yesterday' : `${s.recent_activity.days_since_last_report} days ago`}`
      : 'No reports yet',
    status: reportStatus,
  })

  // Team
  rows.push({
    label: 'Team',
    value: `${s.team.size} engineers · Lead: ${s.team.lead_name}`,
    status: 'green',
  })

  return rows
}

const STATUS_COLORS: Record<SignalStatus, string> = {
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
}

export function SignalsPanel({ signals }: SignalsPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const rows = getSignalRows(signals)
  const signalCount = rows.length

  return (
    <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#F5F3EE] transition-colors"
      >
        <span className="text-xs font-medium text-[#8B8781]">
          Engagement Signals ({signalCount})
        </span>
        {expanded ? <ChevronUp size={14} className="text-[#B0ADA6]" /> : <ChevronDown size={14} className="text-[#B0ADA6]" />}
      </button>

      {expanded && (
        <div className="px-5 pb-4 space-y-2.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start gap-3">
              <div
                className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                style={{ backgroundColor: STATUS_COLORS[row.status] }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-[#B0ADA6] text-xs font-medium">{row.label}</span>
                <p className="text-[#2D2B27] text-xs whitespace-pre-line">{row.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
