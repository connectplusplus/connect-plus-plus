import { createClient } from '@/lib/supabase/server'
import { runGlassboxAgent } from '@/lib/agent/run-agent'
import { NextResponse } from 'next/server'

/**
 * Scheduled agent cron endpoint.
 * Called by Vercel Cron, Supabase Edge Functions, or external cron.
 * POST /api/agent/run-scheduled
 * Auth: Bearer token via CRON_SECRET env var
 */
export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    // Find active engagements with agent configs that are due for assessment
    const { data: configs } = await supabase
      .from('agent_configs')
      .select('engagement_id, report_cadence, engagements(status)')
      .in('engagements.status', ['active', 'in_review', 'scoping'])

    if (!configs || configs.length === 0) {
      return NextResponse.json({ processed: 0, succeeded: 0, message: 'No engagements due for assessment' })
    }

    // Check which are due based on cadence and last assessment
    const dueEngagements: string[] = []

    for (const config of configs) {
      const engagementId = config.engagement_id

      // Get last assessment for this engagement
      const { data: lastAssessment } = await supabase
        .from('agent_assessments')
        .select('created_at')
        .eq('engagement_id', engagementId)
        .eq('trigger_type', 'scheduled')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const hoursSinceLastAssessment = lastAssessment
        ? (Date.now() - new Date(lastAssessment.created_at).getTime()) / 3600000
        : 999

      const cadenceHours = {
        daily: 20,       // ~20 hours to account for timing drift
        every_2_days: 44,
        weekly: 160,
      }[config.report_cadence as string] ?? 20

      if (hoursSinceLastAssessment >= cadenceHours) {
        dueEngagements.push(engagementId)
      }
    }

    // Run agent for each due engagement (sequential to avoid rate limits)
    const results: Array<{ engagementId: string; status: string; error?: string }> = []

    for (const engagementId of dueEngagements) {
      try {
        const result = await runGlassboxAgent(engagementId, 'scheduled', undefined, supabase)
        results.push({ engagementId, status: result.status })
      } catch (error) {
        results.push({
          engagementId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      processed: dueEngagements.length,
      succeeded: results.filter((r) => r.status !== 'failed').length,
      results,
    })

  } catch (error) {
    console.error('[Agent Scheduled] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scheduled run failed' },
      { status: 500 }
    )
  }
}
