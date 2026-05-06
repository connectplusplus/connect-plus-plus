'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { transitionEngagement } from '@/lib/lifecycle/transitions'
import { recordLifecycleEvent } from '@/lib/lifecycle/events'
import type { AuditConfigDefaults, ReportCadence, ReportTone } from '@/lib/types'

export interface ActivationChecklistItem {
  key: string
  label: string
  done: boolean
  notes?: string
}

export interface CompleteKickoffInput {
  engagement_id: string
  kickoff_notes: string
  kickoff_attendees_internal: string[]
  kickoff_attendees_client: string[]
  // Agent config the PM finalized in the call (overlay over template defaults).
  agent_config: {
    success_definition: string
    critical_requirements: string[]
    risk_areas: string[]
    weights: {
      timeline: number
      quality: number
      scope: number
      communication: number
      velocity: number
    }
    alert_thresholds: { critical: number; warning: number }
    report_cadence: ReportCadence
    report_tone: ReportTone
    pm_review_window_hours: number
  }
  activation_checklist: ActivationChecklistItem[]
}

export type CompleteKickoffResult = { ok?: true; error?: string }

// Compute the next-morning 9am after the given timestamp, in the server's
// local timezone. We don't have client/PM timezones reliably; this is a
// pragmatic default that the cron sprint can refine.
function nextMorningNineAm(after: Date): Date {
  const out = new Date(after)
  const isBefore9 = out.getHours() < 9
  out.setHours(9, 0, 0, 0)
  if (!isBefore9) {
    out.setDate(out.getDate() + 1)
  }
  // Skip Saturday/Sunday so the first agent run lands on a weekday.
  while (out.getDay() === 0 || out.getDay() === 6) {
    out.setDate(out.getDate() + 1)
  }
  return out
}

type AuthResult =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; user: { id: string }; internalUser: { id: string; role: string; full_name: string | null } }
  | { ok: false; error: string }

async function assertInternalUser(): Promise<AuthResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  const { data: internalUser } = await supabase
    .from('internal_users')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!internalUser) return { ok: false, error: 'Forbidden' }
  return { ok: true, supabase, user, internalUser: internalUser as { id: string; role: string; full_name: string | null } }
}

export async function completeKickoff(
  input: CompleteKickoffInput
): Promise<CompleteKickoffResult> {
  const auth = await assertInternalUser()
  if (!auth.ok) return { error: auth.error }

  const { supabase, user } = auth
  const nowIso = new Date().toISOString()

  // ── 1. Pull the engagement to compute end date + sanity-check status ──
  const { data: engagementRow, error: engErr } = await supabase
    .from('engagements')
    .select('*, engagement_configurations(payload, audit_config_overrides)')
    .eq('id', input.engagement_id)
    .single()

  if (engErr || !engagementRow) {
    return { error: engErr?.message ?? 'Engagement not found.' }
  }

  if (engagementRow.status !== 'awaiting_kickoff') {
    return {
      error: `Engagement is in ${engagementRow.status} state; expected awaiting_kickoff.`,
    }
  }

  // Pull max_days from the snapshot for the target end date.
  const cfg = Array.isArray(engagementRow.engagement_configurations)
    ? engagementRow.engagement_configurations[0]
    : engagementRow.engagement_configurations
  const payload = (cfg?.payload ?? {}) as { timeline?: { max_days?: number } }
  const maxDays =
    payload?.timeline?.max_days ??
    (engagementRow.timeline_range_high as number | null) ??
    30

  const startDate = nowIso.slice(0, 10) // YYYY-MM-DD
  const endTs = new Date(nowIso)
  endTs.setDate(endTs.getDate() + maxDays)
  const targetEndDate = endTs.toISOString().slice(0, 10)

  const firstAgentRunAt = nextMorningNineAm(new Date(nowIso)).toISOString()

  // ── 2. Insert agent_configs ──────────────────────────────────────────
  const ac = input.agent_config
  const { error: agentErr } = await supabase.from('agent_configs').insert({
    engagement_id: input.engagement_id,
    success_definition:
      ac.success_definition ||
      'Successful delivery of all contracted scope on time and to quality standards.',
    critical_requirements: ac.critical_requirements.filter(Boolean),
    risk_areas: ac.risk_areas.filter(Boolean),
    weight_timeline: ac.weights.timeline,
    weight_quality: ac.weights.quality,
    weight_scope: ac.weights.scope,
    weight_communication: ac.weights.communication,
    weight_velocity: ac.weights.velocity,
    alert_critical_threshold: ac.alert_thresholds.critical,
    alert_milestone_slip_days: 3,
    alert_pm_silence_hours: 48,
    report_cadence: ac.report_cadence,
    report_tone: ac.report_tone,
    pm_review_window_hours: ac.pm_review_window_hours,
    on_demand_enabled: true,
    configured_by: user.id,
  })

  if (agentErr) {
    // Don't transition the engagement if we couldn't create the audit config.
    return { error: `Failed to create agent_configs: ${agentErr.message}` }
  }

  // ── 3. Transition awaiting_kickoff → active ──────────────────────────
  const transitionResult = await transitionEngagement({
    engagement_id: input.engagement_id,
    expected_from: 'awaiting_kickoff',
    to: 'active',
    patch: {
      kickoff_completed_at: nowIso,
      start_date: startDate,
      target_end_date: targetEndDate,
      first_agent_run_at: firstAgentRunAt,
    },
    event_type: 'kickoff_completed',
    actor_role: 'pm',
    actor_user_id: user.id,
    notes: input.kickoff_notes,
    event_payload: {
      attendees_internal: input.kickoff_attendees_internal,
      attendees_client: input.kickoff_attendees_client,
      agent_config_summary: {
        weights: ac.weights,
        alert_thresholds: ac.alert_thresholds,
        report_cadence: ac.report_cadence,
        report_tone: ac.report_tone,
      },
    },
  })

  if (!transitionResult.ok) {
    return { error: transitionResult.error }
  }

  // ── 4. Activated event with the checklist payload ────────────────────
  const checklistComplete = input.activation_checklist.every((c) => c.done)
  await recordLifecycleEvent({
    engagement_id: input.engagement_id,
    event_type: 'activated',
    actor_role: 'pm',
    actor_user_id: user.id,
    notes: checklistComplete
      ? 'Activation checklist complete.'
      : `Activation checklist: ${input.activation_checklist.filter((c) => c.done).length}/${input.activation_checklist.length} items complete.`,
    payload: {
      checklist: input.activation_checklist,
      first_agent_run_at: firstAgentRunAt,
      start_date: startDate,
      target_end_date: targetEndDate,
    },
  })

  // ── 5. System message to the engagement thread ──────────────────────
  await supabase.from('messages').insert({
    engagement_id: input.engagement_id,
    sender_name: 'System',
    sender_role: 'system',
    content: `Engagement activated. First Glassbox Agent assessment scheduled for ${new Date(firstAgentRunAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.`,
    is_system_message: true,
  })

  revalidatePath('/internal/queue')
  revalidatePath(`/internal/engagements/${input.engagement_id}`)
  revalidatePath(`/dashboard/engagements/${input.engagement_id}`)
  return { ok: true }
}

// ─── Pre-fill: read template defaults + client intake prefs from events ────

export interface KickoffPrefill {
  // From the engagement_configurations.payload.audit_config_defaults
  template_defaults: AuditConfigDefaults | null
  // From the lifecycle event written at intake
  client_intake_preferences: {
    success_definition: string
    critical_requirements: string[]
    risk_areas: string[]
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
  } | null
}

export async function getKickoffPrefill(engagement_id: string): Promise<KickoffPrefill> {
  const supabase = await createClient()

  const [{ data: cfg }, { data: events }] = await Promise.all([
    supabase
      .from('engagement_configurations')
      .select('payload')
      .eq('engagement_id', engagement_id)
      .maybeSingle(),
    supabase
      .from('engagement_lifecycle_events')
      .select('payload')
      .eq('engagement_id', engagement_id)
      .eq('event_type', 'intake_submitted')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  const templateDefaults =
    ((cfg?.payload ?? {}) as { audit_config_defaults?: AuditConfigDefaults })
      .audit_config_defaults ?? null

  const intakePrefs =
    ((events?.payload ?? {}) as {
      intake_agent_preferences?: KickoffPrefill['client_intake_preferences']
    }).intake_agent_preferences ?? null

  return {
    template_defaults: templateDefaults,
    client_intake_preferences: intakePrefs,
  }
}
