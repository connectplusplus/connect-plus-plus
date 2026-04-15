'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Engagement, DailyReport, GeneratedReport } from '@/lib/types'
import { generateEngagementReport } from '@/lib/agent/generate-report'

/**
 * Get engagements assigned to the current PM with today's report status.
 */
export async function getPMEngagements(): Promise<{
  data: Array<{
    engagement: Engagement & { companies?: { name: string } }
    has_todays_report: boolean
    last_report_date: string | null
    last_report_health: number | null
  }>
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Not authenticated' }

  const { data: engagements, error } = await supabase
    .from('engagements')
    .select('*, companies(name)')
    .eq('pm_user_id', user.id)
    .in('status', ['active', 'in_review', 'scoping'])
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  if (!engagements || engagements.length === 0) return { data: [] }

  const today = new Date().toISOString().split('T')[0]

  // Get latest report for each engagement
  const engIds = engagements.map((e) => e.id)
  const { data: latestReports } = await supabase
    .from('daily_reports')
    .select('engagement_id, report_date, health_score')
    .in('engagement_id', engIds)
    .order('report_date', { ascending: false })

  const reportMap = new Map<string, { date: string; health: number }>()
  for (const r of latestReports ?? []) {
    if (!reportMap.has(r.engagement_id)) {
      reportMap.set(r.engagement_id, { date: r.report_date, health: r.health_score })
    }
  }

  return {
    data: engagements.map((eng) => {
      const latest = reportMap.get(eng.id)
      return {
        engagement: eng as Engagement & { companies?: { name: string } },
        has_todays_report: latest?.date === today,
        last_report_date: latest?.date ?? null,
        last_report_health: latest?.health ?? null,
      }
    }),
  }
}

/**
 * Generate an AI report draft for an engagement.
 * Calls signal collector → baseline score → Claude API.
 */
export async function generateReport(engagementId: string): Promise<{
  data?: GeneratedReport
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    const report = await generateEngagementReport(engagementId, supabase)
    return { data: report }
  } catch (err) {
    console.error('[generateReport] Error:', err)
    return { error: err instanceof Error ? err.message : 'Failed to generate report' }
  }
}

/**
 * Publish a reviewed daily report (write to DB, update engagement health).
 */
export async function publishDailyReport(input: {
  engagement_id: string
  report_date: string
  accomplishments: string
  blockers: string | null
  plan_tomorrow: string
  health_score: number
  ai_velocity_note: string | null
  ai_reasoning: string | null
  baseline_score_computed: number
  ai_score_suggested: number
  pm_override_reason?: string
  pm_notes?: string | null  // human-in-the-loop: PM's added context, visible to client
}): Promise<{ success: boolean; report_id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Verify internal user
  const { data: internalUser } = await supabase
    .from('internal_users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!internalUser) return { success: false, error: 'Not authorized' }

  // Insert the daily report
  const { data: report, error: reportError } = await supabase
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
      ai_reasoning: input.ai_reasoning || null,
      baseline_score_computed: input.baseline_score_computed,
      ai_score_suggested: input.ai_score_suggested,
      ai_generated_at: new Date().toISOString(),
      pm_override_reason: input.pm_override_reason || null,
      pm_notes: input.pm_notes || null,
    })
    .select('id')
    .single()

  if (reportError) {
    if (reportError.message.includes('unique') || reportError.message.includes('duplicate')) {
      return { success: false, error: 'A report already exists for this engagement on this date.' }
    }
    return { success: false, error: reportError.message }
  }

  // Update engagement health score
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

  revalidatePath('/internal')
  revalidatePath('/internal/daily-reports')
  revalidatePath('/dashboard')
  return { success: true, report_id: report?.id }
}

/**
 * Get published reports for this PM (history view).
 */
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
