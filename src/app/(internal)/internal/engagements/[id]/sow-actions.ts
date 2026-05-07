'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { recordLifecycleEvent } from '@/lib/lifecycle/events'
import type { Sow, SowContent } from '@/lib/types'

// ─── Auth helper (mirrors the kickoff/engagements actions pattern) ──────────

type AuthResult =
  | {
      ok: true
      supabase: Awaited<ReturnType<typeof createClient>>
      user: { id: string }
      internalUser: { id: string; role: string; full_name: string | null }
    }
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
  return {
    ok: true,
    supabase,
    user,
    internalUser: internalUser as { id: string; role: string; full_name: string | null },
  }
}

function revalidateAll(engagementId: string) {
  revalidatePath('/internal/queue')
  revalidatePath('/internal/engagements')
  revalidatePath(`/internal/engagements/${engagementId}`)
  revalidatePath(`/dashboard/engagements/${engagementId}`)
}

// ─── Active SOW lookup ──────────────────────────────────────────────────────

async function findActiveSow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  engagementId: string
): Promise<Sow | null> {
  const { data } = await supabase
    .from('sows')
    .select('*')
    .eq('engagement_id', engagementId)
    .not('status', 'in', '(superseded,cancelled)')
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data ?? null) as Sow | null
}

// ─── getOrCreateSowDraft ────────────────────────────────────────────────────
// Returns the active SOW for the engagement, creating an empty v1 row in
// 'draft' status if none exists. Used by the workspace on initial render
// and after every save.

export async function getOrCreateSowDraft(
  engagementId: string
): Promise<{ sow?: Sow; error?: string }> {
  const auth = await assertInternalUser()
  if (!auth.ok) return { error: auth.error }

  // Sanity-check that the engagement exists and is in a SOW-authoring state.
  const { data: eng, error: engErr } = await auth.supabase
    .from('engagements')
    .select('id, status, pm_user_id')
    .eq('id', engagementId)
    .single()

  if (engErr || !eng) return { error: 'Engagement not found.' }

  const existing = await findActiveSow(auth.supabase, engagementId)
  if (existing) return { sow: existing }

  // No active SOW → create v1 in draft.
  const { data: created, error: createErr } = await auth.supabase
    .from('sows')
    .insert({
      engagement_id: engagementId,
      version_number: 1,
      status: 'draft',
      drafted_by: auth.user.id,
    })
    .select('*')
    .single()

  if (createErr || !created) {
    return { error: createErr?.message ?? 'Failed to create SOW row.' }
  }

  revalidateAll(engagementId)
  return { sow: created as Sow }
}

// ─── saveSowDraft ──────────────────────────────────────────────────────────
// Carlos-side persistence. The form column collects edits; "Save draft"
// fires this. AI-pill dismissals share the path through the
// `ai_drafted_fields` patch — passing the new array (not a delta) keeps the
// server side dumb. Concurrent dismissals are rare but the read-modify-
// write happens client-side from a single source of truth so this is fine.

export interface SaveSowDraftInput {
  sow_id: string
  content: SowContent
  // The full new ai_drafted_fields array. Pass the existing list minus any
  // dismissed paths; we don't compute deltas here.
  ai_drafted_fields: string[]
}

export async function saveSowDraft(
  input: SaveSowDraftInput
): Promise<{ ok?: true; error?: string }> {
  const auth = await assertInternalUser()
  if (!auth.ok) return { error: auth.error }

  // Look up the SOW so we can sanity-check status and capture engagement_id.
  const { data: existing, error: existingErr } = await auth.supabase
    .from('sows')
    .select('id, engagement_id, status')
    .eq('id', input.sow_id)
    .single()

  if (existingErr || !existing) return { error: 'SOW not found.' }

  const editableStatuses = ['draft', 'rejected_by_legal', 'rejected_by_client']
  if (!editableStatuses.includes(existing.status as string)) {
    return {
      error: `SOW is in status ${existing.status}; saves are only allowed in draft / rejected_by_legal / rejected_by_client.`,
    }
  }

  const { error: updateErr } = await auth.supabase
    .from('sows')
    .update({
      scope_summary: input.content.scope_summary,
      deliverables: input.content.deliverables,
      milestones: input.content.milestones,
      pricing: input.content.pricing,
      timeline_business_days: input.content.timeline_business_days,
      terms_md: input.content.terms_md,
      ai_drafted_fields: input.ai_drafted_fields,
    })
    .eq('id', input.sow_id)

  if (updateErr) return { error: updateErr.message }

  // Audit: every save writes one sow_drafted lifecycle event. Carlos can
  // see the cadence of edits in the timeline.
  await recordLifecycleEvent({
    engagement_id: existing.engagement_id as string,
    event_type: 'sow_drafted',
    actor_role: 'pm',
    actor_user_id: auth.user.id,
    notes: 'SOW draft saved',
    payload: { sow_id: input.sow_id },
  })

  revalidateAll(existing.engagement_id as string)
  return { ok: true }
}

// ─── getSowHistory ─────────────────────────────────────────────────────────
// All versions for the engagement, newest first. Powers the version history
// flyout. PDF download links are resolved at click time (signed URLs expire).

export async function getSowHistory(
  engagementId: string
): Promise<{ versions?: Sow[]; error?: string }> {
  const auth = await assertInternalUser()
  if (!auth.ok) return { error: auth.error }

  const { data, error } = await auth.supabase
    .from('sows')
    .select('*')
    .eq('engagement_id', engagementId)
    .order('version_number', { ascending: false })

  if (error) return { error: error.message }
  return { versions: (data ?? []) as Sow[] }
}
