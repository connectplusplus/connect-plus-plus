import { createClient } from '@/lib/supabase/server'
import { collectEngagementSignals } from '@/lib/agent/collect-signals'
import { computeIndependentScore } from '@/lib/agent/score-engine'
import { generateAgentAssessment } from '@/lib/agent/generate-assessment'
import type { GlassboxAgentConfig } from '@/lib/types'
import { NextResponse } from 'next/server'

/**
 * Client-triggered on-demand agent assessment.
 * Runs the full pipeline inline and returns the result.
 * POST /api/agent/on-demand
 * Body: { engagement_id: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { engagement_id } = body
    if (!engagement_id) {
      return NextResponse.json({ error: 'engagement_id is required' }, { status: 400 })
    }

    // Verify access
    const { data: engagement } = await supabase
      .from('engagements')
      .select('id')
      .eq('id', engagement_id)
      .single()
    if (!engagement) {
      return NextResponse.json({ error: 'Engagement not found' }, { status: 404 })
    }

    // Load agent config
    const { data: config, error: configError } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('engagement_id', engagement_id)
      .single()
    if (configError || !config) {
      return NextResponse.json({ error: 'No Glassbox Agent configured for this engagement' }, { status: 404 })
    }

    const agentConfig = config as unknown as GlassboxAgentConfig

    // Collect signals
    const signals = await collectEngagementSignals(engagement_id, supabase)

    // Compute scores
    const scoringResult = computeIndependentScore(signals, agentConfig)

    // Get PM's latest score for divergence
    const { data: latestReport } = await supabase
      .from('daily_reports')
      .select('health_score')
      .eq('engagement_id', engagement_id)
      .order('report_date', { ascending: false })
      .limit(1)
      .single()
    const pmScore = latestReport?.health_score ?? null

    // Generate AI assessment
    let draft
    try {
      draft = await generateAgentAssessment(signals, agentConfig, scoringResult)
    } catch (aiError) {
      // Fallback: use deterministic scores only
      draft = {
        health_score: scoringResult.compositeScore,
        headline: `Health score: ${scoringResult.compositeScore}. AI narrative generation failed — raw scores shown.`,
        executive_summary: `Composite score of ${scoringResult.compositeScore} based on ${Object.keys(scoringResult.components).length} component metrics.`,
        critical_requirements_status: [],
        findings: Object.entries(scoringResult.components).map(([key, comp]) => ({
          category: key,
          severity: comp.score >= 80 ? 'positive' : comp.score >= 60 ? 'neutral' : comp.score >= 40 ? 'concern' : 'critical',
          title: `${key}: ${comp.score}/100`,
          detail: comp.finding,
          data_source: `${key}_score`,
          pm_context: null,
        })),
        recommendation: 'Review the component scores above for detailed status.',
        scope_drift_detected: false,
        scope_drift_detail: null,
        model_used: 'fallback',
        generation_duration_ms: 0,
        tokens_used: 0,
      }
    }

    const scoreDivergence = pmScore !== null ? draft.health_score - pmScore : null

    // Insert the complete assessment in one shot
    const { data: assessment, error: insertError } = await supabase
      .from('agent_assessments')
      .insert({
        engagement_id,
        agent_config_id: config.id,
        trigger_type: 'on_demand',
        triggered_by: user.id,
        status: 'on_demand_sent',
        signals_snapshot: signals,
        component_scores: scoringResult.components,
        weighted_score: scoringResult.compositeScore,
        pm_submitted_score: pmScore,
        score_divergence: scoreDivergence,
        critical_requirements_status: draft.critical_requirements_status,
        scope_drift_detected: draft.scope_drift_detected ?? false,
        scope_drift_detail: draft.scope_drift_detail ?? null,
        headline: draft.headline,
        executive_summary: draft.executive_summary,
        findings: draft.findings,
        recommendation: draft.recommendation,
        sent_to_client_at: new Date().toISOString(),
        model_used: draft.model_used,
        generation_duration_ms: draft.generation_duration_ms,
        tokens_used: draft.tokens_used,
      })
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.json({ error: `Failed to save assessment: ${insertError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      assessment_id: assessment?.id,
      status: 'on_demand_sent',
    })

  } catch (error) {
    console.error('[Agent On-Demand] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Agent assessment failed' },
      { status: 500 }
    )
  }
}
