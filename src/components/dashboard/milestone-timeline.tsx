import type { Milestone } from '@/lib/types'

interface MilestoneTimelineProps {
  milestones: Milestone[]
  compact?: boolean
}

const STATUS_COLORS: Record<string, string> = {
  completed: '#7C3AED',
  in_progress: '#FBBF24',
  in_review: '#60A5FA',
  upcoming: '#2A2A30',
}

function parseFlagLabel(description: string | null): string | null {
  if (!description) return null
  const match = description.match(/^(?:BLOCKED|FLAG):\s*(.+?)(?:\.|—|$)/i)
  return match ? match[1].trim() : null
}

function formatShortDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function MilestoneTimeline({ milestones, compact = false }: MilestoneTimelineProps) {
  if (milestones.length === 0) return null

  return (
    <div className="flex items-start w-full">
      {milestones.map((m, i) => {
        const isLast = i === milestones.length - 1
        const flagLabel = parseFlagLabel(m.description)
        const isFlagged = !!flagLabel
        const color = isFlagged ? '#F87171' : (STATUS_COLORS[m.status] ?? '#2A2A30')
        const isCurrent = m.status === 'in_progress' || m.status === 'in_review'
        const lineColor = m.status === 'completed' ? '#7C3AED' : '#2A2A30'

        return (
          <div key={m.id} className={`flex items-start ${isLast ? '' : 'flex-1'}`}>
            {/* Step */}
            <div className="flex flex-col items-center">
              {/* Dot */}
              <div
                className="shrink-0 rounded-full flex items-center justify-center"
                style={{
                  width: compact ? 10 : 14,
                  height: compact ? 10 : 14,
                  backgroundColor: m.status === 'upcoming' ? 'transparent' : color,
                  border: m.status === 'upcoming' ? `2px solid ${color}` : 'none',
                  boxShadow: isCurrent || isFlagged ? `0 0 8px ${color}50` : 'none',
                }}
              >
                {!compact && m.status === 'completed' && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              {/* Label + date */}
              {!compact && (
                <div className="mt-2 text-center max-w-[110px]">
                  <p
                    className="text-[10px] font-medium leading-tight"
                    style={{ color: isFlagged ? '#F87171' : isCurrent ? color : m.status === 'completed' ? '#9CA3AF' : '#6B7280' }}
                  >
                    {m.title}
                  </p>
                  {m.due_date && (
                    <p className="text-[9px] text-[#94A3B8] mt-0.5">
                      {m.completed_at ? formatShortDate(m.completed_at) : formatShortDate(m.due_date)}
                    </p>
                  )}
                  {isFlagged && (
                    <p className="text-[9px] font-semibold mt-1 leading-tight text-[#F87171]">
                      {flagLabel}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Connecting line */}
            {!isLast && (
              <div
                className="flex-1"
                style={{
                  height: compact ? 2 : 4,
                  marginTop: compact ? 4 : 5,
                  backgroundColor: lineColor,
                  borderRadius: 2,
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
