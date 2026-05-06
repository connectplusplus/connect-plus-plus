'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  AuditConfigDefaults,
  OutcomeTemplate,
  ReportCadence,
  ReportTone,
} from '@/lib/types'

export interface AgentConfigInput {
  successDefinition: string
  criticalRequirements: string[]
  riskAreas: string[]
  weights: {
    timeline: number
    quality: number
    scope: number
    communication: number
    velocity: number
  }
  alerts: {
    criticalThreshold: number
    milestoneSlipDays: number
    pmSilenceHours: number
  }
  cadence: ReportCadence
  tone: ReportTone
}

export interface CreateEngagementInput {
  templateId: string
  intakeResponses: Record<string, unknown>
  contactEmail: string
  agent: AgentConfigInput
}

export interface CreateEngagementResult {
  engagementId?: string
  error?: string
}

// Snapshot fields that the engagement should be pinned against. Anything not
// in this list (id, author_id, created_at, etc.) stays on the template row.
type SnapshotPayload = {
  slug: string
  title: string
  subtitle: string | null
  description: string
  icon: string | null
  category: string
  pricing: OutcomeTemplate['pricing']
  timeline: OutcomeTemplate['timeline']
  price_range_low: number | null
  price_range_high: number | null
  timeline_range_low: number | null
  timeline_range_high: number | null
  deliverables: OutcomeTemplate['deliverables']
  milestone_templates: OutcomeTemplate['milestone_templates']
  intake_schema: OutcomeTemplate['intake_schema']
  delivery_config: OutcomeTemplate['delivery_config']
  audit_config_defaults: OutcomeTemplate['audit_config_defaults']
  guarantees: OutcomeTemplate['guarantees']
}

function snapshotOf(t: OutcomeTemplate): SnapshotPayload {
  return {
    slug: t.slug,
    title: t.title,
    subtitle: t.subtitle,
    description: t.description,
    icon: t.icon,
    category: t.category,
    pricing: t.pricing,
    timeline: t.timeline,
    price_range_low: t.price_range_low,
    price_range_high: t.price_range_high,
    timeline_range_low: t.timeline_range_low,
    timeline_range_high: t.timeline_range_high,
    deliverables: t.deliverables,
    milestone_templates: t.milestone_templates,
    intake_schema: t.intake_schema,
    delivery_config: t.delivery_config,
    audit_config_defaults: t.audit_config_defaults,
    guarantees: t.guarantees,
  }
}

export async function createEngagementFromTemplate(
  input: CreateEngagementInput
): Promise<CreateEngagementResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Please sign in to start an engagement.' }
  }

  // Resolve the buyer's company. The signup flow creates a `users` row with a
  // company_id; if that didn't run yet, surface a clear error so we don't
  // create orphaned records.
  const { data: userRecord } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const companyId = userRecord?.company_id
  if (!companyId) {
    return { error: 'Complete your account setup (company name) before purchasing.' }
  }

  // Load and validate the template.
  const { data: templateRow, error: tplErr } = await supabase
    .from('outcome_templates')
    .select('*')
    .eq('id', input.templateId)
    .single()
  if (tplErr || !templateRow) {
    return { error: tplErr?.message ?? 'Template not found.' }
  }
  const template = templateRow as OutcomeTemplate
  if (template.status !== 'published') {
    return { error: 'This template is not currently available for purchase.' }
  }

  const intakeWithMeta = {
    ...input.intakeResponses,
    contact_email: input.contactEmail || user.email || '',
    contract_signed: true,
    contract_signed_at: new Date().toISOString(),
  }

  // 1. Engagement
  const priceCents = template.pricing?.max ?? template.price_range_high ?? null

  const { data: eng, error: engErr } = await supabase
    .from('engagements')
    .insert({
      company_id: companyId,
      template_id: template.id,
      mode: 'predefined_outcome',
      title: template.title,
      status: 'intake',
      intake_responses: intakeWithMeta,
      price_cents: priceCents,
    })
    .select('id')
    .single()

  if (engErr || !eng) {
    return { error: engErr?.message ?? 'Failed to create engagement.' }
  }

  // 2. engagement_configurations snapshot — the artifact L1.5 reads.
  const { error: cfgErr } = await supabase
    .from('engagement_configurations')
    .insert({
      engagement_id: eng.id,
      source_template_id: template.id,
      source_template_version: template.version ?? '1.0.0',
      payload: snapshotOf(template),
      intake_responses: input.intakeResponses,
    })
  if (cfgErr) {
    // Don't roll back the engagement — log and continue. The snapshot is
    // recoverable from the template + intake_responses if we ever need to.
    console.error('engagement_configurations insert failed:', cfgErr)
  }

  // 3. agent_configs — populated from the template's audit defaults, with
  //    the client's intake-form overrides applied on top.
  const acd: AuditConfigDefaults | undefined = template.audit_config_defaults
  const { error: agentErr } = await supabase.from('agent_configs').insert({
    engagement_id: eng.id,
    success_definition:
      input.agent.successDefinition ||
      'Successful delivery of all contracted scope on time and to quality standards.',
    critical_requirements: input.agent.criticalRequirements.filter(Boolean),
    risk_areas: input.agent.riskAreas.filter(Boolean),
    weight_timeline: input.agent.weights.timeline ?? acd?.priority_weights?.timeline ?? 8,
    weight_quality: input.agent.weights.quality ?? acd?.priority_weights?.quality ?? 7,
    weight_scope: input.agent.weights.scope ?? acd?.priority_weights?.scope ?? 9,
    weight_communication:
      input.agent.weights.communication ?? acd?.priority_weights?.communication ?? 5,
    weight_velocity: input.agent.weights.velocity ?? acd?.priority_weights?.velocity ?? 4,
    alert_critical_threshold:
      input.agent.alerts.criticalThreshold ?? acd?.alert_thresholds?.critical ?? 60,
    alert_milestone_slip_days: input.agent.alerts.milestoneSlipDays ?? 3,
    alert_pm_silence_hours: input.agent.alerts.pmSilenceHours ?? 48,
    report_cadence: input.agent.cadence ?? acd?.report_cadence ?? 'every_2_days',
    report_tone: input.agent.tone ?? acd?.report_tone ?? 'technical',
    pm_review_window_hours: acd?.pm_review_window_hours ?? 4,
    on_demand_enabled: true,
    configured_by: user.id,
  })
  if (agentErr) {
    console.error('agent_configs insert failed:', agentErr)
  }

  // 4. System message
  await supabase.from('messages').insert({
    engagement_id: eng.id,
    sender_name: 'System',
    sender_role: 'system',
    content: `Engagement created. Contract signed for ${template.title}. Your AI-native PM will review your scope within 24 hours.`,
    is_system_message: true,
  })

  return { engagementId: eng.id }
}
