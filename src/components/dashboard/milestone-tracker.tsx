import type { Milestone } from '@/lib/types'
import { MilestoneStatusBadge } from './status-badge'
import { MILESTONE_STATUS_COLORS } from '@/lib/constants'
import { CheckSquare, Square, Calendar } from 'lucide-react'

interface MilestoneTrackerProps {
  milestones: Milestone[]
}

export function MilestoneTracker({ milestones }: MilestoneTrackerProps) {
  if (milestones.length === 0) {
    return (
      <div className="text-center py-10 text-[#9CA3AF]">
        No milestones have been created yet.
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-6 bottom-6 w-px bg-[#2A2A30]" />

      <div className="space-y-4">
        {milestones.map((milestone, i) => {
          const statusColor = MILESTONE_STATUS_COLORS[milestone.status]
          const isActive =
            milestone.status === 'in_progress' || milestone.status === 'in_review'
          const isCompleted = milestone.status === 'completed'

          return (
            <div key={milestone.id} className="flex gap-5 relative">
              {/* Circle indicator */}
              <div className="shrink-0 z-10 mt-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-mono-brand font-bold border-2"
                  style={{
                    borderColor: statusColor,
                    backgroundColor: isCompleted
                      ? statusColor
                      : isActive
                        ? `${statusColor}20`
                        : '#1E1E24',
                    color: isCompleted ? '#0B0B0F' : statusColor,
                  }}
                >
                  {isCompleted ? '✓' : i + 1}
                </div>
              </div>

              {/* Content */}
              <div
                className={`flex-1 rounded-xl border p-5 transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#16161C] border-opacity-40'
                    : 'bg-[#16161C] border-[#2A2A30]'
                }`}
                style={
                  isActive
                    ? { borderColor: `${statusColor}40` }
                    : {}
                }
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4
                      className={`font-heading font-semibold text-base mb-1 ${
                        isCompleted ? 'text-[#9CA3AF] line-through' : 'text-white'
                      }`}
                    >
                      {milestone.title}
                    </h4>
                    {milestone.description && (
                      <p className="text-[#9CA3AF] text-sm">{milestone.description}</p>
                    )}
                  </div>
                  <div className="ml-4 shrink-0 flex flex-col items-end gap-2">
                    <MilestoneStatusBadge status={milestone.status} />
                    {milestone.due_date && (
                      <div className="flex items-center gap-1 text-[#6B7280] text-xs">
                        <Calendar size={11} strokeWidth={1.5} />
                        {new Date(milestone.due_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Deliverables */}
                {milestone.deliverables && milestone.deliverables.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#2A2A30]">
                    <p className="text-[#9CA3AF] text-xs font-medium mb-2 uppercase tracking-wide">
                      Deliverables
                    </p>
                    <div className="space-y-2">
                      {milestone.deliverables.map((d, di) => (
                        <div key={di} className="flex items-start gap-2.5">
                          {d.status === 'done' ? (
                            <CheckSquare
                              size={14}
                              className="text-[#34D399] shrink-0 mt-0.5"
                              strokeWidth={1.5}
                            />
                          ) : (
                            <Square
                              size={14}
                              className="text-[#6B7280] shrink-0 mt-0.5"
                              strokeWidth={1.5}
                            />
                          )}
                          <div>
                            <span
                              className={`text-sm ${
                                d.status === 'done'
                                  ? 'text-[#9CA3AF] line-through'
                                  : 'text-white'
                              }`}
                            >
                              {d.name}
                            </span>
                            {d.description && (
                              <p className="text-[#6B7280] text-xs mt-0.5">{d.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed at */}
                {milestone.completed_at && (
                  <p className="text-[#6B7280] text-xs mt-3">
                    Completed{' '}
                    {new Date(milestone.completed_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
