'use server'

import { createClient } from '@/lib/supabase/server'
import { recordLifecycleEvent } from '@/lib/lifecycle/events'
import type {
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
  // Agent preferences captured at intake. We DO NOT create agent_configs here
  // anymore (that lands at kickoff completion). The intake values are stored
  // on the lifecycle event payload so the PM can see what the client picked
  // when they walk through the agent setup at kickoff.
  agent: AgentConfigInput
}

export interface CreateEngagementResult {
  engagementId?: string
  pmName?: string | null
  pmAvatarUrl?: string | null
  engagementRef?: string  // GBX-XXXXXXXX, the human-quotable reference
  error?: string
}

function engagementRef(uuid: string): string {
  return `GBX-${uuid.replace(/-/g, '').slice(0, 8).toUpperCase()}`
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

  // ── Pick a PM. Random over internal_users with role='pm'. We DO NOT fall
  //    back to a random non-PM internal user — that hides a setup bug. If
  //    no PM exists, fail loudly so ops provisions one before any new
  //    engagement can be taken.
  const { data: pms, error: pmsErr } = await supabase
    .from('internal_users')
    .select('id, full_name, avatar_url')
    .eq('role', 'pm')

  if (pmsErr) {
    return { error: `Could not load PM roster: ${pmsErr.message}` }
  }
  if (!pms || pms.length === 0) {
    return {
      error:
        'No project managers are configured. Please contact support — we cannot start an engagement without a PM assigned.',
    }
  }

  const pm = pms[Math.floor(Math.random() * pms.length)]

  const intakeWithMeta = {
    ...input.intakeResponses,
    contact_email: input.contactEmail || user.email || '',
    contract_signed: true,
    contract_signed_at: new Date().toISOString(),
  }

  const priceCents = template.pricing?.max ?? template.price_range_high ?? null
  const nowIso = new Date().toISOString()

  // ── 1. Engagement (status=pending_review, PM assigned, intake stamped) ──
  const { data: eng, error: engErr } = await supabase
    .from('engagements')
    .insert({
      company_id: companyId,
      template_id: template.id,
      mode: 'predefined_outcome',
      title: template.title,
      status: 'pending_review',
      intake_responses: intakeWithMeta,
      price_cents: priceCents,
      pm_user_id: pm.id,
      intake_submitted_at: nowIso,
    })
    .select('id')
    .single()

  if (engErr || !eng) {
    return { error: engErr?.message ?? 'Failed to create engagement.' }
  }

  // ── 2. engagement_configurations snapshot — the immutable promise ───────
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
    console.error('[lifecycle] engagement_configurations insert failed:', cfgErr)
  }

  // ── 3. Lifecycle event — single audit row for this whole submission ─────
  // The agent preferences captured at intake go on the event payload so the
  // PM can see what the client picked when walking through agent setup at
  // kickoff. They are NOT written to agent_configs here; that lands at
  // kickoff completion (the load-bearing trust moment).
  await recordLifecycleEvent({
    engagement_id: eng.id,
    event_type: 'intake_submitted',
    actor_role: 'client',
    actor_user_id: user.id,
    payload: {
      template_slug: template.slug,
      template_version: template.version ?? '1.0.0',
      contact_email: intakeWithMeta.contact_email,
      assigned_pm_id: pm.id,
      assigned_pm_name: pm.full_name,
      // Snapshot of the client's intake-form agent preferences for the PM
      // to review during kickoff prep.
      intake_agent_preferences: {
        success_definition: input.agent.successDefinition,
        critical_requirements: input.agent.criticalRequirements.filter(Boolean),
        risk_areas: input.agent.riskAreas.filter(Boolean),
        weights: input.agent.weights,
        alerts: input.agent.alerts,
        cadence: input.agent.cadence,
        tone: input.agent.tone,
      },
    },
  })

  // ── 4. PM-facing system message — appears in the engagement's thread ────
  // Email/Slack notifications come later; the message + lifecycle event are
  // the audit-grade signal that this engagement needs PM attention.
  await supabase.from('messages').insert({
    engagement_id: eng.id,
    sender_name: 'System',
    sender_role: 'system',
    content: `Intake submitted for ${template.title}. SOW preparation needed within 1 business day.`,
    is_system_message: true,
  })

  return {
    engagementId: eng.id,
    pmName: pm.full_name,
    pmAvatarUrl: pm.avatar_url ?? null,
    engagementRef: engagementRef(eng.id),
  }
}
