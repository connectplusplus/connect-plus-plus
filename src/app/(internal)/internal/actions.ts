'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Engagement, DailyReport } from '@/lib/types'

export async function getPMEngagements(): Promise<{ data: Engagement[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('engagements')
    .select('*, companies(name)')
    .eq('pm_user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as Engagement[] }
}

export async function submitDailyReport(input: {
  engagement_id: string
  report_date: string
  accomplishments: string
  blockers: string | null
  plan_tomorrow: string
  health_score: number
  ai_velocity_note: string | null
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Verify this user is an internal user
  const { data: internalUser } = await supabase
    .from('internal_users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!internalUser) return { success: false, error: 'Not authorized' }

  // Insert the daily report
  const { error: reportError } = await supabase
    .from('daily_reports')
    .insert({
      engagement_id: input.engagement_id,
      author_id: user.id,
      report_date: input.report_date,
      accomplishments: input.accomplishments,
      blockers: input.blockers || null,
      plan_tomorrow: input.plan_tomorrow,
      health_score: input.health_score,
      ai_velocity_note: input.ai_velocity_note || null,
    })

  if (reportError) {
    if (reportError.message.includes('unique') || reportError.message.includes('duplicate')) {
      return { success: false, error: 'A report already exists for this engagement on this date.' }
    }
    return { success: false, error: reportError.message }
  }

  // Update the engagement's health score
  // Health score is stored in intake_responses.health_score (JSONB)
  const { data: engagement } = await supabase
    .from('engagements')
    .select('intake_responses')
    .eq('id', input.engagement_id)
    .single()

  if (engagement) {
    const currentResponses = (engagement.intake_responses as Record<string, unknown>) ?? {}
    await supabase
      .from('engagements')
      .update({
        intake_responses: { ...currentResponses, health_score: input.health_score },
      })
      .eq('id', input.engagement_id)
  }

  revalidatePath('/internal/daily-reports')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getMyReports(limit = 20): Promise<{ data: DailyReport[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('daily_reports')
    .select('*, engagements(title, company_id, companies(name))')
    .eq('author_id', user.id)
    .order('report_date', { ascending: false })
    .limit(limit)

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as unknown as DailyReport[] }
}
