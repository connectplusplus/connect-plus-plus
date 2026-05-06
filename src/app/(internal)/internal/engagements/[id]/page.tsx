import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Engagement, EngagementLifecycleEvent } from '@/lib/types'
import { PMWorkspace } from './workspace'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PMEngagementPage({ params }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/internal-login')

  const { data: internalUser } = await supabase
    .from('internal_users')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  if (!internalUser) redirect('/internal-login')

  const { id } = await params

  const { data: engagement } = await supabase
    .from('engagements')
    .select('*, companies(name), outcome_templates(slug, title)')
    .eq('id', id)
    .single()

  if (!engagement) notFound()

  const { data: lifecycleEvents } = await supabase
    .from('engagement_lifecycle_events')
    .select('*')
    .eq('engagement_id', id)
    .order('created_at', { ascending: true })

  // Resolve actor names across both client and internal user tables.
  const actorIds = Array.from(
    new Set(
      ((lifecycleEvents ?? []) as { actor_user_id: string | null }[])
        .map((e) => e.actor_user_id)
        .filter((v): v is string => !!v)
    )
  )

  const actorNames: Record<string, string> = {}
  if (actorIds.length > 0) {
    const [{ data: clientUsers }, { data: internalUsers }] = await Promise.all([
      supabase.from('users').select('id, full_name').in('id', actorIds),
      supabase.from('internal_users').select('id, full_name').in('id', actorIds),
    ])
    for (const u of clientUsers ?? []) {
      if (u.full_name) actorNames[u.id as string] = u.full_name as string
    }
    for (const u of internalUsers ?? []) {
      if (u.full_name) actorNames[u.id as string] = u.full_name as string
    }
  }

  // Latest scheduled kickoff (used by the awaiting_kickoff panel)
  let scheduledKickoffAt: string | null = null
  for (let i = (lifecycleEvents ?? []).length - 1; i >= 0; i--) {
    const e = (lifecycleEvents ?? [])[i] as EngagementLifecycleEvent
    if (e.event_type === 'kickoff_scheduled') {
      const sched = (e.payload as Record<string, unknown> | null)?.scheduled_at
      if (typeof sched === 'string') scheduledKickoffAt = sched
      break
    }
  }

  const eng = engagement as unknown as Engagement & {
    companies?: { name: string } | { name: string }[] | null
    outcome_templates?: { slug: string; title: string } | { slug: string; title: string }[] | null
  }
  const companyName = Array.isArray(eng.companies)
    ? eng.companies[0]?.name ?? null
    : eng.companies?.name ?? null

  return (
    <PMWorkspace
      engagement={eng}
      companyName={companyName}
      lifecycleEvents={(lifecycleEvents ?? []) as EngagementLifecycleEvent[]}
      lifecycleActorNames={actorNames}
      scheduledKickoffAt={scheduledKickoffAt}
      currentUserId={user.id}
    />
  )
}
