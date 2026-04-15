import type { AgentTriggerType, GlassboxAgentConfig } from '@/lib/types'
import { collectEngagementSignals } from './collect-signals'
import { computeIndependentScore } from './score-engine'
import { generateAgentAssessment } from './generate-assessment'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Full Glassbox Agent pipeline:
 * 1. Load agent config
 * 2. Create assessment record (status: generating)
 * 3. Collect signals
 * 4. Compute deterministic scores
 * 5. Generate AI assessment via Claude
 * 6. Check alert thresholds
 * 7. Determine pipeline (on-demand → direct, critical → bypass PM, else → PM review)
 * 8. Update assessment with results
 * 9. Create alert record if critical
 */
export async function runGlassboxAgent(
  engagementId: string,
  triggerType: AgentTriggerType,
  triggeredBy: string | undefined,
  supabase: SupabaseClient
): Promise<{ assessmentId: string; status: string }> {

  // 1. Load agent config
  const { data: config, error: configError } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('engagement_id', engagementId)
    .single()

  if (configError || !config) {
    throw new Error(`No agent config for engagement ${engagementId}`)
  }

  const agentConfig = config as unknown as GlassboxAgentConfig

  // 2. Create assessment record (status: generating)
  const { data: assessment, error: insertError } = await supabase
    .from('agent_assessments')
    .insert({
      engagement_id: engagementId,
      agent_config_id: config.id,
      trigger_type: triggerType,
      triggered_by: triggeredBy ?? null,
      status: 'generating',
      // Placeholder fields — will be updated
      signals_snapshot: {},
      component_scores: {},
      weighted_score: 0,
      headline: '',
      executive_summary: '',
      findings: [],
      recommendation: '',
    })
    .select('id')
    .single()

  if (insertError || !assessment) {
    throw new Error(`Failed to create assessment record: ${insertError?.message}`)
  }

  try {
    // 3. Collect signals
    const signals = await collectEngagementSignals(engagementId, supabase)

    // 4. Compute deterministic scores
    const scoringResult = computeIndependentScore(signals, agentConfig)

    // 5. Get latest PM-submitted health score for divergence comparison
    const { data: latestReport } = await supabase
      .from('daily_reports')
      .select('health_score')
      .eq('engagement_id', engagementId)
      .order('report_date', { ascending: false })
      .limit(1)
      .single()

    const pmScore = latestReport?.health_score ?? null

    // 6. Generate AI assessment via Claude
    const draft = await generateAgentAssessment(signals, agentConfig, scoringResult)

    // 7. Check alert thresholds
    const isCritical = draft.health_score < agentConfig.alert_critical_threshold
    const hasCriticalBreach = draft.critical_requirements_status?.some(
      (r: { status: string }) => r.status === 'breached'
    )
    const triggerImmediateAlert = isCritical || hasCriticalBreach

    // 8. Determine pipeline
    const isOnDemand = triggerType === 'on_demand'
    const reviewDeadline = isOnDemand || triggerImmediateAlert
      ? null
      : new Date(Date.now() + agentConfig.pm_review_window_hours * 3600000).toISOString()

    const initialStatus = isOnDemand
      ? 'on_demand_sent'
      : triggerImmediateAlert
        ? 'sent_to_client'
        : 'pending_pm_review'

    const scoreDivergence = pmScore !== null ? draft.health_score - pmScore : null

    // 9. Update assessment with results
    await supabase
      .from('agent_assessments')
      .update({
        signals_snapshot: signals,
        component_scores: scoringResult.components,
        weighted_score: scoringResult.compositeScore,
        pm_submitted_score: pmScore,
        score_divergence: scoreDivergence,
        critical_requirements_status: draft.critical_requirements_status,
        scope_drift_detected: draft.scope_drift_detected,
        scope_drift_detail: draft.scope_drift_detail,
        headline: draft.headline,
        executive_summary: draft.executive_summary,
        findings: draft.findings,
        recommendation: draft.recommendation,
        status: initialStatus,
        pm_review_deadline: reviewDeadline,
        model_used: draft.model_used,
        generation_duration_ms: draft.generation_duration_ms,
        tokens_used: draft.tokens_used,
        ...(initialStatus === 'sent_to_client' || initialStatus === 'on_demand_sent'
          ? { sent_to_client_at: new Date().toISOString() }
          : {}),
      })
      .eq('id', assessment.id)

    // 10. Create alert record if critical
    if (triggerImmediateAlert) {
      await supabase.from('agent_alerts').insert({
        engagement_id: engagementId,
        assessment_id: assessment.id,
        alert_type: hasCriticalBreach ? 'critical_requirement_breach' : 'health_threshold',
        severity: 'critical',
        title: hasCriticalBreach
          ? 'Critical requirement breached'
          : `Health score dropped to ${draft.health_score}`,
        detail: draft.headline,
        notified_client: true,
        notified_pm: true,
      })
    }

    return { assessmentId: assessment.id, status: initialStatus }

  } catch (error) {
    // Mark assessment as failed for manual retry
    await supabase
      .from('agent_assessments')
      .update({
        status: 'generating',
        headline: 'Assessment generation failed — pending retry',
        executive_summary: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', assessment.id)

    throw error
  }
}
