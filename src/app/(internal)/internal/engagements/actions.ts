'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { transitionEngagement } from '@/lib/lifecycle/transitions'
import { recordLifecycleEvent } from '@/lib/lifecycle/events'

// ─── Auth helper ────────────────────────────────────────────────────────────

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

function revalidateAll(slug?: string) {
  revalidatePath('/internal/queue')
  revalidatePath('/internal/engagements')
  if (slug) revalidatePath(`/internal/engagements/${slug}`)
}

// ─── PM action: send SOW for signature ──────────────────────────────────────
//
// Stub: generates a fake SOW URL. Phase 6 sprint or later wires DocuSign /
// HelloSign. The lifecycle event payload carries the URL so the audit trail
// preserves what was sent.

export async function sendSowForSignature(input: {
  engagement_id: string
  scope_notes?: string
  sow_url?: string  // optional override; falls back to a stubbed URL
}): Promise<{ ok?: true; error?: string }> {
  const auth = await assertInternalUser()
  if (!auth.ok) return { error: auth.error }

  const sowUrl =
    input.sow_url ?? `https://example.com/sow/${input.engagement_id}/sign`

  const result = await transitionEngagement({
    engagement_id: input.engagement_id,
    expected_from: 'pending_review',
    to: 'awaiting_signature',
    patch: { sow_sent_at: new Date().toISOString() },
    event_type: 'sow_sent',
    actor_role: 'pm',
    actor_user_id: auth.user.id,
    notes: input.scope_notes,
    event_payload: { sow_url: sowUrl },
  })

  if (!result.ok) return { error: result.error }
  revalidateAll(input.engagement_id)
  return { ok: true }
}

// ─── PM action: return to review (client requested SOW revisions) ───────────
//
// Walks back from awaiting_signature to pending_review. The SOW payload that
// was sent stays on the prior lifecycle event; the new revision will land
// when the PM hits Send for signature again.

export async function returnToReview(input: {
  engagement_id: string
  revision_notes: string
}): Promise<{ ok?: true; error?: string }> {
  const auth = await assertInternalUser()
  if (!auth.ok) return { error: auth.error }

  const result = await transitionEngagement({
    engagement_id: input.engagement_id,
    expected_from: 'awaiting_signature',
    to: 'pending_review',
    patch: { sow_sent_at: null },
    event_type: 'returned_to_review',
    actor_role: 'pm',
    actor_user_id: auth.user.id,
    notes: input.revision_notes,
  })

  if (!result.ok) return { error: result.error }
  revalidateAll(input.engagement_id)
  return { ok: true }
}

// ─── Stubbed e-sign callback: record the signature ──────────────────────────
//
// Real DocuSign / HelloSign integration eventually fires a webhook that calls
// this. For now, exposed as a PM action ("Mark as signed manually").

export async function recordSignature(input: {
  engagement_id: string
  signed_at?: string
}): Promise<{ ok?: true; error?: string }> {
  const auth = await assertInternalUser()
  if (!auth.ok) return { error: auth.error }

  const signedAt = input.signed_at ?? new Date().toISOString()

  const result = await transitionEngagement({
    engagement_id: input.engagement_id,
    expected_from: 'awaiting_signature',
    to: 'awaiting_kickoff',
    patch: { signed_at: signedAt },
    event_type: 'signed',
    actor_role: 'system', // becomes 'client' once real e-sign webhook is wired
    actor_user_id: auth.user.id,
    notes: 'Marked as signed by PM (real e-sign integration pending)',
    event_payload: { signed_at: signedAt },
  })

  if (!result.ok) return { error: result.error }
  revalidateAll(input.engagement_id)
  return { ok: true }
}

// ─── PM action: schedule kickoff (no state change) ──────────────────────────
//
// Engagement stays in awaiting_kickoff. We only record the planned date so
// the workspace can disable "Complete kickoff" until it's in the past.

export async function scheduleKickoff(input: {
  engagement_id: string
  scheduled_at: string  // ISO timestamp
  calendar_link?: string
  attendees?: string[]
}): Promise<{ ok?: true; error?: string }> {
  const auth = await assertInternalUser()
  if (!auth.ok) return { error: auth.error }

  const eventResult = await recordLifecycleEvent({
    engagement_id: input.engagement_id,
    event_type: 'kickoff_scheduled',
    actor_role: 'pm',
    actor_user_id: auth.user.id,
    payload: {
      scheduled_at: input.scheduled_at,
      calendar_link: input.calendar_link ?? null,
      attendees: input.attendees ?? [],
    },
  })

  if (!eventResult.ok) return { error: eventResult.error }
  revalidateAll(input.engagement_id)
  return { ok: true }
}

// ─── Cancellation (PM-initiated) ────────────────────────────────────────────

export async function cancelEngagementAsPM(input: {
  engagement_id: string
  current_status:
    | 'pending_review'
    | 'awaiting_signature'
    | 'awaiting_kickoff'
    | 'active'
    | 'in_review'
  reason: string
}): Promise<{ ok?: true; error?: string }> {
  const auth = await assertInternalUser()
  if (!auth.ok) return { error: auth.error }

  const result = await transitionEngagement({
    engagement_id: input.engagement_id,
    expected_from: input.current_status,
    to: 'cancelled',
    event_type: 'cancelled',
    actor_role: 'pm',
    actor_user_id: auth.user.id,
    notes: input.reason,
  })

  if (!result.ok) return { error: result.error }
  revalidateAll(input.engagement_id)
  return { ok: true }
}

// ─── Latest "kickoff_scheduled" event lookup helper ─────────────────────────
// Exposed as a server action for the workspace to refetch after changes.
// Returns the most recent scheduled date, or null if no kickoff is scheduled.

export async function getLatestKickoffSchedule(
  engagement_id: string
): Promise<{ scheduled_at: string | null; calendar_link: string | null }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('engagement_lifecycle_events')
    .select('payload, created_at')
    .eq('engagement_id', engagement_id)
    .eq('event_type', 'kickoff_scheduled')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return { scheduled_at: null, calendar_link: null }
  const p = (data.payload ?? {}) as Record<string, unknown>
  return {
    scheduled_at: typeof p.scheduled_at === 'string' ? p.scheduled_at : null,
    calendar_link: typeof p.calendar_link === 'string' ? p.calendar_link : null,
  }
}
