import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Engagement, Message } from '@/lib/types'
import { MessagesClient } from './messages-client'

export default async function MessagesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('company_id, full_name')
    .eq('id', user.id)
    .single()

  const companyId = userProfile?.company_id
  if (!companyId) redirect('/dashboard')

  // Fetch all engagements for this company
  const { data: engagements } = await supabase
    .from('engagements')
    .select('id, title, status')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  const engagementIds = (engagements ?? []).map((e) => e.id)

  // Fetch all messages across all engagements
  const { data: allMessages } = engagementIds.length > 0
    ? await supabase
        .from('messages')
        .select('*')
        .in('engagement_id', engagementIds)
        .order('created_at', { ascending: true })
    : { data: [] }

  return (
    <MessagesClient
      engagements={(engagements ?? []) as Engagement[]}
      messages={(allMessages ?? []) as Message[]}
      currentUserId={user.id}
      currentUserName={userProfile?.full_name ?? 'You'}
    />
  )
}
