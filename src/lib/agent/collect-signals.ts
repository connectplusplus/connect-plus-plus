import type { EngagementSignals } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Collects all available signals for an engagement from the database.
 * This is the foundation for both AI-driven PM reports and the Glassbox Agent.
 * Every field comes from real database state — nothing is mocked or hardcoded.
 */
export async function collectEngagementSignals(
  engagementId: string,
  supabase: SupabaseClient
): Promise<EngagementSignals> {
  // Parallel queries for performance
  const [engagementResult, milestonesResult, reportsResult, messagesResult] = await Promise.all([
    supabase
      .from('engagements')
      .select('*, companies(name)')
      .eq('id', engagementId)
      .single(),
    supabase
      .from('milestones')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('display_order', { ascending: true }),
    supabase
      .from('daily_reports')
      .select('report_date, health_score')
      .eq('engagement_id', engagementId)
      .order('report_date', { ascending: false })
      .limit(5),
    supabase
      .from('messages')
      .select('created_at')
      .eq('engagement_id', engagementId)
      .eq('is_system_message', false)
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
      .order('created_at', { ascending: false }),
  ])

  const eng = engagementResult.data
  if (!eng) throw new Error(`Engagement ${engagementId} not found`)

  const milestones = milestonesResult.data ?? []
  const recentReports = reportsResult.data ?? []
  const recentMessages = messagesResult.data ?? []

  // Parse intake_responses for team and health data
  const intake = (eng.intake_responses ?? {}) as Record<string, unknown>
  const currentHealth = (intake.health_score as number) ?? 75
  const team = (intake.team as Array<{ name: string; role: string }>) ?? []
  const projectLead = intake.project_lead as { name: string } | undefined

  // ── Timeline calculations ──────────────────────────────────────────────
  const now = new Date()
  const startDate = eng.start_date ? new Date(eng.start_date) : now
  const endDate = eng.target_end_date ? new Date(eng.target_end_date) : new Date(now.getTime() + 30 * 86400000)

  const daysTotal = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000))
  const daysElapsed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / 86400000))
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000))
  const percentThrough = Math.min(1, daysElapsed / daysTotal)
  const isOverdue = now > endDate
  const daysOverdue = isOverdue ? Math.ceil((now.getTime() - endDate.getTime()) / 86400000) : undefined

  // ── Milestone calculations ─────────────────────────────────────────────
  const total = milestones.length
  const completed = milestones.filter((m) => m.status === 'completed').length
  const inReview = milestones.filter((m) => m.status === 'in_review').length
  const inProgress = milestones.filter((m) => m.status === 'in_progress').length
  const upcoming = milestones.filter((m) => m.status === 'upcoming').length

  // Detect blocked milestones (description starts with BLOCKED:)
  const blockedMilestones = milestones.filter(
    (m) => m.description?.toUpperCase().startsWith('BLOCKED')
  )
  const blocked = blockedMilestones.length

  const percentComplete = total > 0 ? (completed / total) * 100 : 0
  const expectedPercentComplete = percentThrough * 100
  const variance = percentComplete - expectedPercentComplete

  // Current active milestone
  const currentMilestone = milestones.find(
    (m) => m.status === 'in_progress' || m.status === 'in_review'
  )

  let currentMilestoneData: EngagementSignals['milestones']['current_milestone'] = undefined
  if (currentMilestone) {
    const deliverables = (currentMilestone.deliverables ?? []) as Array<{ name: string; status: string }>
    const dueDate = currentMilestone.due_date ? new Date(currentMilestone.due_date) : null
    const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / 86400000) : 0
    const isBlocked = currentMilestone.description?.toUpperCase().startsWith('BLOCKED') ?? false

    currentMilestoneData = {
      title: currentMilestone.title,
      status: currentMilestone.status,
      due_date: currentMilestone.due_date,
      days_until_due: daysUntilDue,
      deliverables_total: deliverables.length,
      deliverables_completed: deliverables.filter((d) => d.status === 'done').length,
      is_blocked: isBlocked,
      blocked_reason: isBlocked ? currentMilestone.description?.replace(/^BLOCKED:\s*/i, '').split('.')[0] : undefined,
    }
  }

  // ── Recent activity ────────────────────────────────────────────────────
  const lastReport = recentReports[0] ?? null
  const lastReportDate = lastReport?.report_date ?? null
  const lastReportHealth = lastReport?.health_score ?? null

  const daysSinceLastReport = lastReportDate
    ? Math.ceil((now.getTime() - new Date(lastReportDate + 'T00:00:00').getTime()) / 86400000)
    : 999

  // Health trend: compare last 3 reports
  let healthTrend: 'improving' | 'stable' | 'declining' | 'no_data' = 'no_data'
  if (recentReports.length >= 2) {
    const scores = recentReports.slice(0, 3).map((r) => r.health_score)
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length
    const latest = scores[0]
    if (latest > avg + 3) healthTrend = 'improving'
    else if (latest < avg - 3) healthTrend = 'declining'
    else healthTrend = 'stable'
  }

  const lastMessageDate = recentMessages[0]?.created_at ?? null

  return {
    engagement: {
      title: eng.title,
      status: eng.status,
      budget: eng.price_cents,
      start_date: eng.start_date,
      end_date: eng.target_end_date,
      current_health_score: currentHealth,
      mode: eng.mode,
    },
    timeline: {
      days_total: daysTotal,
      days_elapsed: daysElapsed,
      days_remaining: daysRemaining,
      percent_through: Math.round(percentThrough * 100) / 100,
      is_overdue: isOverdue,
      ...(daysOverdue !== undefined ? { days_overdue: daysOverdue } : {}),
    },
    milestones: {
      total,
      completed,
      in_review: inReview,
      in_progress: inProgress,
      blocked,
      upcoming,
      percent_complete: Math.round(percentComplete),
      expected_percent_complete: Math.round(expectedPercentComplete),
      variance: Math.round(variance),
      current_milestone: currentMilestoneData,
    },
    recent_activity: {
      last_report_date: lastReportDate,
      last_report_health: lastReportHealth,
      health_trend: healthTrend,
      days_since_last_report: daysSinceLastReport,
      last_message_date: lastMessageDate,
      recent_messages_count: recentMessages.length,
    },
    team: {
      size: team.length,
      lead_name: projectLead?.name ?? 'Unknown',
      members: team.map((t) => t.name),
    },
  }
}
