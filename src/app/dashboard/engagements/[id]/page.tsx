import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Engagement, Milestone, Message, OutcomeTemplate, DailyReport } from '@/lib/types'
import { EngagementDetailClient } from './engagement-detail-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EngagementDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user's company
  const { data: userProfile } = await supabase
    .from('users')
    .select('company_id, full_name')
    .eq('id', user.id)
    .single()

  if (!userProfile?.company_id) redirect('/dashboard')

  // Fetch engagement
  const { data: engagement, error } = await supabase
    .from('engagements')
    .select('*, outcome_templates(id, title, slug, category)')
    .eq('id', id)
    .eq('company_id', userProfile.company_id)
    .single()

  if (error || !engagement) notFound()

  // Fetch milestones
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .eq('engagement_id', id)
    .order('display_order', { ascending: true })

  // Fetch messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('engagement_id', id)
    .order('created_at', { ascending: true })

  // Fetch daily reports — explicitly select columns, omitting ai_velocity_note (internal only)
  // TODO: Replace with a Postgres view (daily_reports_client_view) before first real client usage
  const { data: dailyReports } = await supabase
    .from('daily_reports')
    .select('id, engagement_id, author_id, report_date, accomplishments, blockers, plan_tomorrow, health_score, pm_notes, created_at, updated_at, internal_users(full_name)')
    .eq('engagement_id', id)
    .order('report_date', { ascending: false })

  return (
    <EngagementDetailClient
      engagement={engagement as Engagement & { outcome_templates: OutcomeTemplate | null }}
      milestones={(milestones ?? []) as Milestone[]}
      messages={(messages ?? []) as Message[]}
      dailyReports={(dailyReports ?? []) as unknown as DailyReport[]}
      currentUserId={user.id}
      currentUserName={userProfile.full_name}
    />
  )
}
