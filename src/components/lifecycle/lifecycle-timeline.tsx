// Vertical timeline of engagement_lifecycle_events. Used by both the client
// dashboard and the PM workspace; the audience flag controls which event
// types are shown (some are PM-internal, e.g. sow_revised before the SOW
// was sent).

import { CheckCircle2, PenLine, Send, Calendar, Rocket, XCircle, Undo2, FilePlus, FileSignature, ScrollText } from 'lucide-react'
import type { EngagementLifecycleEvent, LifecycleEventType } from '@/lib/types'

const EVENT_META: Record<
  LifecycleEventType,
  { icon: typeof CheckCircle2; label: string; color: string; clientVisible: boolean }
> = {
  intake_submitted: {
    icon: FilePlus,
    label: 'Intake submitted',
    color: '#7C3AED',
    clientVisible: true,
  },
  sow_sent: {
    icon: Send,
    label: 'SOW sent for signature',
    color: '#7C3AED',
    clientVisible: true,
  },
  sow_revised: {
    icon: PenLine,
    label: 'SOW revised',
    color: '#BA7517',
    clientVisible: false,  // internal-only — clients see the resulting sow_sent
  },
  signed: {
    icon: CheckCircle2,
    label: 'SOW signed',
    color: '#10B981',
    clientVisible: true,
  },
  kickoff_scheduled: {
    icon: Calendar,
    label: 'Kickoff scheduled',
    color: '#06B6D4',
    clientVisible: true,
  },
  kickoff_completed: {
    icon: CheckCircle2,
    label: 'Kickoff held',
    color: '#06B6D4',
    clientVisible: true,
  },
  activated: {
    icon: Rocket,
    label: 'Engagement activated',
    color: '#10B981',
    clientVisible: true,
  },
  cancelled: {
    icon: XCircle,
    label: 'Engagement cancelled',
    color: '#94A3B8',
    clientVisible: true,
  },
  returned_to_review: {
    icon: Undo2,
    label: 'Returned to SOW review',
    color: '#BA7517',
    clientVisible: true,
  },
  // ── SOW workflow (sprint 010) ────────────────────────────────────────────
  sow_drafted: {
    icon: PenLine,
    label: 'SOW draft saved',
    color: '#7E8B6A',
    clientVisible: false,
  },
  sow_sent_for_legal: {
    icon: ScrollText,
    label: 'Sent to FullStack Legal',
    color: '#7E8B6A',
    clientVisible: false,
  },
  sow_legal_approved: {
    icon: FileSignature,
    label: 'Legal counter-signed',
    color: '#7E8B6A',
    clientVisible: false,
  },
  sow_legal_rejected: {
    icon: Undo2,
    label: 'Legal requested changes',
    color: '#BA7517',
    clientVisible: false,
  },
  sow_sent_to_client: {
    icon: Send,
    label: 'SOW sent for signature',
    color: '#7C3AED',
    clientVisible: true,
  },
  sow_client_rejected: {
    icon: Undo2,
    label: 'Client requested revisions',
    color: '#BA7517',
    clientVisible: true,
  },
  sow_resubmitted: {
    icon: FilePlus,
    label: 'New SOW version drafted',
    color: '#7E8B6A',
    clientVisible: false,
  },
}

interface Props {
  events: EngagementLifecycleEvent[]
  audience: 'client' | 'internal'
  // Optional map of actor_user_id → display name. The events table doesn't
  // store names; both `users` and `internal_users` need to be joined upstream
  // and passed in here.
  actorNames?: Record<string, string>
}

export function LifecycleTimeline({ events, audience, actorNames }: Props) {
  const visible = events
    .filter((e) => audience === 'internal' || EVENT_META[e.event_type]?.clientVisible !== false)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

  if (visible.length === 0) {
    return (
      <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-12 text-center">
        <p className="text-[#94A3B8] text-sm">No lifecycle events yet.</p>
      </div>
    )
  }

  return (
    <ol className="relative space-y-4">
      <span
        className="absolute left-[15px] top-3 bottom-3 w-px bg-[#E2E8F0]"
        aria-hidden
      />
      {visible.map((event) => {
        const meta = EVENT_META[event.event_type]
        if (!meta) return null
        const Icon = meta.icon
        const date = new Date(event.created_at)
        const actorName = event.actor_user_id ? actorNames?.[event.actor_user_id] : null

        return (
          <li key={event.id} className="relative flex items-start gap-3 pl-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-white"
              style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
            >
              <Icon size={14} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-[#0F172A]">{meta.label}</span>
                <span className="text-xs text-[#94A3B8]">
                  {date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                {actorRoleLabel(event.actor_role, audience)}
                {actorName ? ` · ${actorName}` : ''}
              </p>
              {event.notes && (
                <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">{event.notes}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function actorRoleLabel(role: string, audience: 'client' | 'internal'): string {
  if (role === 'system') return 'System'
  if (role === 'pm') return audience === 'client' ? 'Project manager' : 'PM'
  if (role === 'client') return 'Client'
  return role
}
