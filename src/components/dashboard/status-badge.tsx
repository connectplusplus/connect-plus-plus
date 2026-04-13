import type { EngagementStatus, MilestoneStatus } from '@/lib/types'
import {
  ENGAGEMENT_STATUS_COLORS,
  ENGAGEMENT_STATUS_LABELS,
  MILESTONE_STATUS_COLORS,
  MILESTONE_STATUS_LABELS,
} from '@/lib/constants'

interface EngagementStatusBadgeProps {
  status: EngagementStatus
}

export function EngagementStatusBadge({ status }: EngagementStatusBadgeProps) {
  const color = ENGAGEMENT_STATUS_COLORS[status]
  const label = ENGAGEMENT_STATUS_LABELS[status]

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border"
      style={{ color, borderColor: `${color}40`, backgroundColor: `${color}10` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

interface MilestoneStatusBadgeProps {
  status: MilestoneStatus
}

export function MilestoneStatusBadge({ status }: MilestoneStatusBadgeProps) {
  const color = MILESTONE_STATUS_COLORS[status]
  const label = MILESTONE_STATUS_LABELS[status]

  return (
    <span
      className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border"
      style={{ color, borderColor: `${color}40`, backgroundColor: `${color}10` }}
    >
      {label}
    </span>
  )
}
