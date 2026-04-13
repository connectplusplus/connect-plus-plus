import { EngagementCard } from './engagement-card'
import type { Engagement, Milestone, Message } from '@/lib/types'

interface EngagementWithData extends Engagement {
  milestones?: Milestone[]
  last_message?: Message | null
}

interface EngagementListProps {
  engagements: EngagementWithData[]
}

export function EngagementList({ engagements }: EngagementListProps) {
  if (engagements.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {engagements.map((eng) => (
        <EngagementCard
          key={eng.id}
          engagement={eng}
          milestones={eng.milestones}
          lastMessage={eng.last_message}
        />
      ))}
    </div>
  )
}
