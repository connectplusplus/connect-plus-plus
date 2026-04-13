import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Engagement, Milestone, Message, OutcomeTemplate } from '@/lib/types'
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

  return (
    <EngagementDetailClient
      engagement={engagement as Engagement & { outcome_templates: OutcomeTemplate | null }}
      milestones={(milestones ?? []) as Milestone[]}
      messages={(messages ?? []) as Message[]}
      currentUserId={user.id}
      currentUserName={userProfile.full_name}
    />
  )
}
