import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ENGAGEMENT_STATUS_COLORS, ENGAGEMENT_STATUS_LABELS } from '@/lib/constants'
import { computeSla, formatSlaLabel } from '@/lib/lifecycle/sla'
import { ArrowRight, Clock } from 'lucide-react'
import type { Engagement } from '@/lib/types'

// What time-into-state does each new-lifecycle status care about?
// pending_review: time since intake_submitted_at
// awaiting_signature: time since sow_sent_at (no SLA, just for display)
// awaiting_kickoff: time since signed_at
function stateEnteredAt(eng: Engagement): string | null {
  switch (eng.status) {
    case 'pending_review':
      return eng.intake_submitted_at ?? eng.created_at
    case 'awaiting_signature':
      return eng.sow_sent_at ?? eng.created_at
    case 'awaiting_kickoff':
      return eng.signed_at ?? eng.created_at
    default:
      return eng.created_at
  }
}

export default async function QueuePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/internal-login')

  const { data: internalUser } = await supabase
    .from('internal_users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!internalUser) redirect('/internal-login')

  // Pull every engagement assigned to this PM in any of the four lifecycle
  // states. We split into "needs action" vs "waiting on client" client-side
  // because the join + sort is identical.
  const { data: engagements } = await supabase
    .from('engagements')
    .select('*, companies(name)')
    .eq('pm_user_id', user.id)
    .in('status', ['pending_review', 'awaiting_signature', 'awaiting_kickoff'])
    .order('created_at', { ascending: false })

  const all = ((engagements ?? []) as Array<Engagement & { companies?: { name: string } | { name: string }[] | null }>).map(
    (e) => ({
      ...e,
      company_name: Array.isArray(e.companies)
        ? e.companies[0]?.name ?? null
        : e.companies?.name ?? null,
    })
  )

  const needsAction = all.filter(
    (e) => e.status === 'pending_review' || e.status === 'awaiting_kickoff'
  )
  const waitingOnClient = all.filter((e) => e.status === 'awaiting_signature')

  const firstName = internalUser.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="font-heading font-bold text-2xl text-[#0F172A] mb-1">
          Action queue
        </h2>
        <p className="text-[#64748B] text-sm">
          {firstName}, here are the engagements assigned to you across the lifecycle.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Column
          title="Needs your action"
          subtitle={`${needsAction.length} item${needsAction.length === 1 ? '' : 's'}`}
          items={needsAction}
          emptyText="Nothing waiting on you. Inbox zero."
          actionable
        />
        <Column
          title="Waiting on client"
          subtitle={`${waitingOnClient.length} item${waitingOnClient.length === 1 ? '' : 's'}`}
          items={waitingOnClient}
          emptyText="No engagements out for signature."
          actionable={false}
        />
      </div>
    </div>
  )
}

interface ColumnItem extends Engagement {
  company_name: string | null
}

function Column({
  title,
  subtitle,
  items,
  emptyText,
  actionable,
}: {
  title: string
  subtitle: string
  items: ColumnItem[]
  emptyText: string
  actionable: boolean
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-heading font-semibold text-[#0F172A] text-sm">{title}</h3>
        <p className="text-[#94A3B8] text-xs">{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-8 text-center">
          <p className="text-[#94A3B8] text-sm">{emptyText}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((eng) => (
            <QueueRow key={eng.id} engagement={eng} actionable={actionable} />
          ))}
        </ul>
      )}
    </section>
  )
}

function QueueRow({ engagement, actionable }: { engagement: ColumnItem; actionable: boolean }) {
  const color = ENGAGEMENT_STATUS_COLORS[engagement.status]
  const label = ENGAGEMENT_STATUS_LABELS[engagement.status]
  const enteredAt = stateEnteredAt(engagement)
  const sla = computeSla(engagement.status, enteredAt)

  return (
    <li>
      <Link
        href={`/internal/engagements/${engagement.id}`}
        className="block bg-white border border-[#E2E8F0] rounded-xl p-4 hover:border-[#7C3AED]/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[#0F172A] text-sm font-semibold truncate">
              {engagement.title}
            </p>
            {engagement.company_name && (
              <p className="text-[#64748B] text-xs truncate mt-0.5">{engagement.company_name}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border"
                style={{ color, borderColor: `${color}40`, backgroundColor: `${color}10` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                {label}
              </span>
              {sla && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-mono-brand px-1.5 py-0.5 rounded-full ${
                    sla.status === 'overdue'
                      ? 'text-[#B91C1C] bg-[#F87171]/10'
                      : sla.status === 'due_soon'
                        ? 'text-[#92400E] bg-[#F59E0B]/10'
                        : 'text-[#64748B] bg-[#F1F5F9]'
                  }`}
                >
                  <Clock size={9} />
                  {formatSlaLabel(sla)}
                </span>
              )}
            </div>
          </div>
          {actionable && (
            <div className="text-[#7C3AED] text-xs font-semibold shrink-0 self-center inline-flex items-center gap-1">
              Open
              <ArrowRight size={12} />
            </div>
          )}
        </div>
      </Link>
    </li>
  )
}
