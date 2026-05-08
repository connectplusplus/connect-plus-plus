'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { transitionEngagement } from '@/lib/lifecycle/transitions'
import { recordLifecycleEvent } from '@/lib/lifecycle/events'
import { renderSowPdf, type SowRenderStage } from '@/lib/sow/render-pdf'
import { uploadSowPdf, getSowPdfSignedUrl } from '@/lib/sow/storage'
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

// Structured one-line logger used by every signature action. Format is
// "[sow] event=NAME engagement=UUID sow=UUID v=N status=STATUS k=v...".
// Greppable and easy to ship to a structured log sink later.
function logSowEvent(
  event: string,
  fields: Record<string, string | number | boolean | null | undefined>
) {
  const parts = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${typeof v === 'string' && v.includes(' ') ? JSON.stringify(v) : v}`)
  console.log(`[sow] event=${event} ${parts.join(' ')}`)
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

// ─── getSignedSowPdfUrl ────────────────────────────────────────────────────
// Returns a fresh signed URL for the requested SOW + stage. 15-minute
// expiry; callers should refetch on each click rather than caching.

export async function getSignedSowPdfUrl(input: {
  sow_id: string
  stage: SowRenderStage
}): Promise<{ url?: string; error?: string }> {
  const auth = await assertInternalUser()
  if (!auth.ok) return { error: auth.error }

  const { data: sow, error: sowErr } = await auth.supabase
    .from('sows')
    .select('id, engagement_id, legal_pdf_storage_path, client_pdf_storage_path')
    .eq('id', input.sow_id)
    .single()

  if (sowErr || !sow) return { error: 'SOW not found.' }

  const path =
    input.stage === 'legal_review'
      ? (sow.legal_pdf_storage_path as string | null)
      : (sow.client_pdf_storage_path as string | null)

  if (!path) return { error: `No ${input.stage} PDF has been rendered for this SOW.` }

  const result = await getSowPdfSignedUrl(path)
  if (!result.url) return { error: result.error ?? 'Could not create signed URL.' }
  return { url: result.url }
}

// ─── Helpers shared by signature actions ───────────────────────────────────

async function loadEngagementSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  engagementId: string
): Promise<
  | { ok: true; engagementTitle: string; companyName: string | null; status: string }
  | { ok: false; error: string }
> {
  const { data, error } = await supabase
    .from('engagements')
    .select('title, status, companies(name)')
    .eq('id', engagementId)
    .single()
  if (error || !data) return { ok: false, error: error?.message ?? 'Engagement not found.' }
  const companies = Array.isArray(data.companies) ? data.companies[0] : data.companies
  return {
    ok: true,
    engagementTitle: data.title as string,
    companyName: (companies?.name as string) ?? null,
    status: data.status as string,
  }
}

async function postSystemMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  engagementId: string,
  content: string
) {
  const { error } = await supabase.from('messages').insert({
    engagement_id: engagementId,
    sender_name: 'System',
    sender_role: 'system',
    content,
    is_system_message: true,
  })
  if (error) console.error('[sow] system message failed:', error.message)
}

function sowToContent(sow: Sow): SowContent {
  return {
    scope_summary: sow.scope_summary ?? '',
    deliverables: sow.deliverables ?? [],
    milestones: sow.milestones ?? [],
    pricing: sow.pricing ?? { total_cents: 0, currency: 'USD', payment_terms_md: '' },
    timeline_business_days: sow.timeline_business_days ?? 0,
    terms_md: sow.terms_md ?? '',
  }
}

// Lightweight content sanity check — server-side gate for the
// send-for-legal-review action. The PM has the editor for fixes; this
// is a last-mile guard.
function validateContentForSend(sow: Sow): string | null {
  const c = sowToContent(sow)
  if (!c.scope_summary.trim()) return 'Scope summary is empty.'
  if (c.deliverables.length === 0) return 'At least one deliverable is required.'
  for (let i = 0; i < c.deliverables.length; i++) {
    const d = c.deliverables[i]
    if (!d.name.trim()) return `Deliverable ${i + 1}: name is required.`
    if (d.acceptance_criteria.length < 2)
      return `Deliverable "${d.name}": at least 2 acceptance criteria are required.`
    if (d.acceptance_criteria.some((ac) => !ac.trim()))
      return `Deliverable "${d.name}": every acceptance criterion must be non-empty.`
  }
  if (c.milestones.length === 0) return 'At least one milestone is required.'
  const sumPct = c.milestones.reduce((s, m) => s + (Number(m.payment_pct) || 0), 0)
  if (sumPct !== 100) return `Milestone payment percentages must sum to 100 (currently ${sumPct}).`
  if (!Number.isFinite(c.pricing.total_cents) || c.pricing.total_cents <= 0)
    return 'Pricing total must be a positive amount.'
  if (!c.pricing.payment_terms_md.trim()) return 'Payment terms are required.'
  if (!Number.isFinite(c.timeline_business_days) || c.timeline_business_days <= 0)
    return 'Timeline (business days) must be a positive integer.'
  if (!c.terms_md.trim()) return 'Terms section cannot be empty.'
  return null
}

// ─── sendSowForLegalReview ─────────────────────────────────────────────────
// pending_review → awaiting_legal_review.
// Renders the PDF, uploads to storage, marks SOW awaiting_legal, transitions
// the engagement, writes sow_sent_for_legal lifecycle event, posts system
// message.

export async function sendSowForLegalReview(input: {
  sow_id: string
}): Promise<{ ok?: true; error?: string }> {
  const auth = await assertInternalUser()
  if (!auth.ok) return { error: auth.error }

  // Load the SOW (full row) so we have content + engagement_id.
  const { data: sowRow, error: sowErr } = await auth.supabase
    .from('sows')
    .select('*')
    .eq('id', input.sow_id)
    .single()

  if (sowErr || !sowRow) return { error: 'SOW not found.' }
  const sow = sowRow as Sow

  // Status check: must be in an editable state.
  const editable = ['draft', 'rejected_by_legal', 'rejected_by_client']
  if (!editable.includes(sow.status)) {
    return { error: `SOW is in status ${sow.status}; cannot send for legal review.` }
  }

  // Content validation — last-mile guard.
  const validationError = validateContentForSend(sow)
  if (validationError) return { error: validationError }

  const eng = await loadEngagementSnapshot(auth.supabase, sow.engagement_id)
  if (!eng.ok) return { error: eng.error }

  // Render PDF and upload.
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await renderSowPdf({
      sow: { version_number: sow.version_number, status: 'awaiting_legal', ...sowToContent(sow) },
      stage: 'legal_review',
      companyName: eng.companyName,
      engagementTitle: eng.engagementTitle,
    })
  } catch (err) {
    return { error: `PDF rendering failed: ${err instanceof Error ? err.message : String(err)}` }
  }

  const upload = await uploadSowPdf({
    engagement_id: sow.engagement_id,
    sow_id: sow.id,
    stage: 'legal_review',
    buffer: pdfBuffer,
  })
  if (!upload.ok) return { error: `PDF upload failed: ${upload.error}` }

  const sentAt = new Date().toISOString()

  // Update SOW row: awaiting_legal + path + timestamp; clear stale rejection.
  const { error: updateErr } = await auth.supabase
    .from('sows')
    .update({
      status: 'awaiting_legal',
      sent_to_legal_at: sentAt,
      legal_pdf_storage_path: upload.path,
      legal_rejection_notes: null,
    })
    .eq('id', sow.id)

  if (updateErr) return { error: updateErr.message }

  // Transition the engagement. The legacy stub would have used
  // pending_review → awaiting_signature; we route through awaiting_legal_review.
  // For SOWs that came back from a client rejection, the engagement is
  // already in pending_review when the PM hits send.
  const fromStatus = eng.status === 'pending_review' ? 'pending_review' : eng.status
  if (fromStatus !== 'pending_review') {
    return {
      error: `Engagement is in status ${fromStatus}; expected pending_review when sending for legal review.`,
    }
  }

  const transition = await transitionEngagement({
    engagement_id: sow.engagement_id,
    expected_from: 'pending_review',
    to: 'awaiting_legal_review',
    patch: { sow_sent_at: sentAt },
    event_type: 'sow_sent_for_legal',
    actor_role: 'pm',
    actor_user_id: auth.user.id,
    notes: `SOW v${sow.version_number} sent to FullStack Legal for counter-signature.`,
    event_payload: {
      sow_id: sow.id,
      version_number: sow.version_number,
      legal_pdf_storage_path: upload.path,
    },
  })

  if (!transition.ok) {
    // Best effort: rollback the SOW row since the engagement didn't move.
    await auth.supabase
      .from('sows')
      .update({
        status: sow.status,
        sent_to_legal_at: null,
      })
      .eq('id', sow.id)
    return { error: transition.error }
  }

  await postSystemMessage(
    auth.supabase,
    sow.engagement_id,
    `SOW v${sow.version_number} sent to FullStack Legal for counter-signature.`
  )

  logSowEvent('sent_for_legal', {
    engagement: sow.engagement_id,
    sow: sow.id,
    v: sow.version_number,
    pdf_bytes: pdfBuffer.length,
  })

  revalidateAll(sow.engagement_id)
  return { ok: true }
}

// ─── recordLegalSignature ─────────────────────────────────────────────────
// awaiting_legal_review → awaiting_signature. Renders a counter-signed PDF
// (legal signature stamped at the bottom) and uploads to client_signature.pdf.
// The SOW row's status moves draft → awaiting_legal → awaiting_client.

export async function recordLegalSignature(input: {
  sow_id: string
}): Promise<{ ok?: true; error?: string }> {
  const auth = await assertInternalUser()
  if (!auth.ok) return { error: auth.error }

  const { data: sowRow, error: sowErr } = await auth.supabase
    .from('sows')
    .select('*')
    .eq('id', input.sow_id)
    .single()
  if (sowErr || !sowRow) return { error: 'SOW not found.' }
  const sow = sowRow as Sow

  if (sow.status !== 'awaiting_legal') {
    return { error: `SOW is in status ${sow.status}; expected awaiting_legal.` }
  }

  const eng = await loadEngagementSnapshot(auth.supabase, sow.engagement_id)
  if (!eng.ok) return { error: eng.error }

  const signedAt = new Date().toISOString()
  const legalSignerName = auth.internalUser.full_name ?? 'FullStack Legal'

  // Render the legal-counter-signed PDF for the client.
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await renderSowPdf({
      sow: { version_number: sow.version_number, status: 'awaiting_client', ...sowToContent(sow) },
      stage: 'client_signature',
      companyName: eng.companyName,
      engagementTitle: eng.engagementTitle,
      legalSignerName,
      legalSignedAt: signedAt,
    })
  } catch (err) {
    return { error: `PDF rendering failed: ${err instanceof Error ? err.message : String(err)}` }
  }

  const upload = await uploadSowPdf({
    engagement_id: sow.engagement_id,
    sow_id: sow.id,
    stage: 'client_signature',
    buffer: pdfBuffer,
  })
  if (!upload.ok) return { error: `PDF upload failed: ${upload.error}` }

  // Update SOW row.
  const { error: updateErr } = await auth.supabase
    .from('sows')
    .update({
      status: 'awaiting_client',
      legal_signed_at: signedAt,
      legal_signed_by: auth.user.id,
      client_pdf_storage_path: upload.path,
      sent_to_client_at: signedAt,
    })
    .eq('id', sow.id)

  if (updateErr) return { error: updateErr.message }

  // Transition engagement: awaiting_legal_review → awaiting_signature.
  const transition = await transitionEngagement({
    engagement_id: sow.engagement_id,
    expected_from: 'awaiting_legal_review',
    to: 'awaiting_signature',
    patch: { sow_sent_at: signedAt },
    event_type: 'sow_legal_approved',
    actor_role: 'pm',
    actor_user_id: auth.user.id,
    notes: `Legal counter-signed SOW v${sow.version_number}. Counter-signed copy sent for client signature.`,
    event_payload: { sow_id: sow.id, version_number: sow.version_number, legal_signer_name: legalSignerName },
  })

  if (!transition.ok) return { error: transition.error }

  // Companion lifecycle event: PDF in client's hands.
  await recordLifecycleEvent({
    engagement_id: sow.engagement_id,
    event_type: 'sow_sent_to_client',
    actor_role: 'pm',
    actor_user_id: auth.user.id,
    notes: `Counter-signed SOW v${sow.version_number} ready for client signature.`,
    payload: { sow_id: sow.id, client_pdf_storage_path: upload.path },
  })

  await postSystemMessage(
    auth.supabase,
    sow.engagement_id,
    `SOW v${sow.version_number} counter-signed by FullStack Legal and sent for client signature.`
  )

  logSowEvent('legal_signed', {
    engagement: sow.engagement_id,
    sow: sow.id,
    v: sow.version_number,
    legal_signer: legalSignerName,
    pdf_bytes: pdfBuffer.length,
  })

  revalidateAll(sow.engagement_id)
  return { ok: true }
}

// ─── recordLegalRejection ─────────────────────────────────────────────────
// Legal asked for changes. SAME SOW row stays editable (Carlos didn't fail
// the client; he failed an internal review). Engagement reverts to
// pending_review; SOW status → rejected_by_legal.

export async function recordLegalRejection(input: {
  sow_id: string
  notes: string
}): Promise<{ ok?: true; error?: string }> {
  const auth = await assertInternalUser()
  if (!auth.ok) return { error: auth.error }

  if (!input.notes.trim()) return { error: 'Rejection notes are required.' }

  const { data: sowRow, error: sowErr } = await auth.supabase
    .from('sows')
    .select('id, engagement_id, version_number, status')
    .eq('id', input.sow_id)
    .single()
  if (sowErr || !sowRow) return { error: 'SOW not found.' }

  if ((sowRow.status as string) !== 'awaiting_legal') {
    return { error: `SOW is in status ${sowRow.status}; expected awaiting_legal.` }
  }

  const { error: updateErr } = await auth.supabase
    .from('sows')
    .update({
      status: 'rejected_by_legal',
      legal_rejection_notes: input.notes,
    })
    .eq('id', sowRow.id)

  if (updateErr) return { error: updateErr.message }

  const transition = await transitionEngagement({
    engagement_id: sowRow.engagement_id as string,
    expected_from: 'awaiting_legal_review',
    to: 'pending_review',
    patch: { sow_sent_at: null },
    event_type: 'sow_legal_rejected',
    actor_role: 'pm',
    actor_user_id: auth.user.id,
    notes: input.notes,
    event_payload: { sow_id: sowRow.id, version_number: sowRow.version_number },
  })

  if (!transition.ok) return { error: transition.error }

  await postSystemMessage(
    auth.supabase,
    sowRow.engagement_id as string,
    `Legal requested changes to SOW v${sowRow.version_number}. PM editing.`
  )

  logSowEvent('legal_rejected', {
    engagement: sowRow.engagement_id as string,
    sow: sowRow.id as string,
    v: sowRow.version_number as number,
    notes_chars: input.notes.length,
  })

  revalidateAll(sowRow.engagement_id as string)
  return { ok: true }
}

// ─── recordClientSignature ────────────────────────────────────────────────
// awaiting_signature → awaiting_kickoff. SOW row → signed. The kickoff
// modal takes over from here. Re-renders the PDF with both signatures
// stamped to lock the contract document for the audit trail.

export async function recordClientSignature(input: {
  sow_id: string
  client_signer_name?: string
}): Promise<{ ok?: true; error?: string }> {
  const auth = await assertInternalUser()
  if (!auth.ok) return { error: auth.error }

  const { data: sowRow, error: sowErr } = await auth.supabase
    .from('sows')
    .select('*')
    .eq('id', input.sow_id)
    .single()
  if (sowErr || !sowRow) return { error: 'SOW not found.' }
  const sow = sowRow as Sow

  if (sow.status !== 'awaiting_client') {
    return { error: `SOW is in status ${sow.status}; expected awaiting_client.` }
  }

  const eng = await loadEngagementSnapshot(auth.supabase, sow.engagement_id)
  if (!eng.ok) return { error: eng.error }

  const signedAt = new Date().toISOString()
  const clientSignerName = input.client_signer_name?.trim() || eng.companyName || 'Client'

  // Render the fully-signed PDF (contract of record).
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await renderSowPdf({
      sow: { version_number: sow.version_number, status: 'signed', ...sowToContent(sow) },
      stage: 'client_signature',
      companyName: eng.companyName,
      engagementTitle: eng.engagementTitle,
      legalSignerName: 'FullStack Legal',
      legalSignedAt: sow.legal_signed_at,
      clientSignerName,
      clientSignedAt: signedAt,
    })
  } catch (err) {
    return { error: `PDF rendering failed: ${err instanceof Error ? err.message : String(err)}` }
  }

  const upload = await uploadSowPdf({
    engagement_id: sow.engagement_id,
    sow_id: sow.id,
    stage: 'client_signature',
    buffer: pdfBuffer,
  })
  if (!upload.ok) return { error: `PDF upload failed: ${upload.error}` }

  const { error: updateErr } = await auth.supabase
    .from('sows')
    .update({
      status: 'signed',
      client_signed_at: signedAt,
      client_pdf_storage_path: upload.path,
    })
    .eq('id', sow.id)

  if (updateErr) return { error: updateErr.message }

  // Per the audit-symmetry choice in the lifecycle doc, the both-parties-
  // signed transition uses the existing 'signed' lifecycle event type
  // rather than a new 'sow_finalized'.
  const transition = await transitionEngagement({
    engagement_id: sow.engagement_id,
    expected_from: 'awaiting_signature',
    to: 'awaiting_kickoff',
    patch: { signed_at: signedAt },
    event_type: 'signed',
    actor_role: 'pm',
    actor_user_id: auth.user.id,
    notes: `SOW v${sow.version_number} signed by ${clientSignerName}. Engagement is ready for kickoff.`,
    event_payload: {
      sow_id: sow.id,
      version_number: sow.version_number,
      client_signer_name: clientSignerName,
      client_pdf_storage_path: upload.path,
    },
  })

  if (!transition.ok) return { error: transition.error }

  await postSystemMessage(
    auth.supabase,
    sow.engagement_id,
    `SOW v${sow.version_number} signed by ${clientSignerName}. Engagement is ready for kickoff.`
  )

  logSowEvent('client_signed', {
    engagement: sow.engagement_id,
    sow: sow.id,
    v: sow.version_number,
    client_signer: clientSignerName,
    pdf_bytes: pdfBuffer.length,
  })

  revalidateAll(sow.engagement_id)
  return { ok: true }
}

// ─── recordClientRejection ────────────────────────────────────────────────
// Stays here as the path Carlos uses when the client EMAILS revisions in
// after seeing the counter-signed SOW. Marks the SOW rejected_by_client
// (no new version yet — Carlos calls resubmitSow after to bump the
// version). The engagement transitions awaiting_signature → pending_review.

export async function recordClientRejection(input: {
  sow_id: string
  notes: string
}): Promise<{ ok?: true; error?: string }> {
  const auth = await assertInternalUser()
  if (!auth.ok) return { error: auth.error }

  if (!input.notes.trim()) return { error: 'Rejection notes are required.' }

  const { data: sowRow, error: sowErr } = await auth.supabase
    .from('sows')
    .select('id, engagement_id, version_number, status')
    .eq('id', input.sow_id)
    .single()
  if (sowErr || !sowRow) return { error: 'SOW not found.' }

  if ((sowRow.status as string) !== 'awaiting_client') {
    return { error: `SOW is in status ${sowRow.status}; expected awaiting_client.` }
  }

  const { error: updateErr } = await auth.supabase
    .from('sows')
    .update({
      status: 'rejected_by_client',
      client_rejection_notes: input.notes,
    })
    .eq('id', sowRow.id)

  if (updateErr) return { error: updateErr.message }

  const transition = await transitionEngagement({
    engagement_id: sowRow.engagement_id as string,
    expected_from: 'awaiting_signature',
    to: 'pending_review',
    patch: { sow_sent_at: null, signed_at: null },
    event_type: 'sow_client_rejected',
    actor_role: 'pm',
    actor_user_id: auth.user.id,
    notes: input.notes,
    event_payload: { sow_id: sowRow.id, version_number: sowRow.version_number },
  })

  if (!transition.ok) return { error: transition.error }

  await postSystemMessage(
    auth.supabase,
    sowRow.engagement_id as string,
    `Client requested revisions to SOW v${sowRow.version_number}. PM preparing a new version.`
  )

  logSowEvent('client_rejected', {
    engagement: sowRow.engagement_id as string,
    sow: sowRow.id as string,
    v: sowRow.version_number as number,
    notes_chars: input.notes.length,
  })

  revalidateAll(sowRow.engagement_id as string)
  return { ok: true }
}

// ─── resubmitSow ──────────────────────────────────────────────────────────
// Asymmetric to recordLegalRejection: client rejection creates a NEW SOW
// version (the client saw v1; v2 is a separate document for legal-contract
// reasons). Marks the rejected version 'superseded', creates a new row
// with version_number+1 and content cloned from the previous version, and
// lands the PM back in the editor with the prior content intact.

export async function resubmitSow(input: {
  sow_id: string
}): Promise<{ ok?: true; sow_id?: string; error?: string }> {
  const auth = await assertInternalUser()
  if (!auth.ok) return { error: auth.error }

  const { data: prev, error: prevErr } = await auth.supabase
    .from('sows')
    .select('*')
    .eq('id', input.sow_id)
    .single()

  if (prevErr || !prev) return { error: 'SOW not found.' }
  const prevSow = prev as Sow

  // Resubmit only makes sense after a client rejection (the rejected_by_legal
  // path edits the same row, so it doesn't get here).
  if (prevSow.status !== 'rejected_by_client') {
    return { error: `SOW is in status ${prevSow.status}; resubmit is only valid for rejected_by_client.` }
  }

  // Mark previous version superseded.
  const { error: superErr } = await auth.supabase
    .from('sows')
    .update({ status: 'superseded' })
    .eq('id', prevSow.id)

  if (superErr) return { error: superErr.message }

  // Create new version with content cloned from the previous SOW.
  const { data: created, error: createErr } = await auth.supabase
    .from('sows')
    .insert({
      engagement_id: prevSow.engagement_id,
      version_number: prevSow.version_number + 1,
      status: 'draft',
      scope_summary: prevSow.scope_summary,
      deliverables: prevSow.deliverables,
      milestones: prevSow.milestones,
      pricing: prevSow.pricing,
      timeline_business_days: prevSow.timeline_business_days,
      terms_md: prevSow.terms_md,
      ai_drafted: prevSow.ai_drafted,
      ai_drafted_fields: prevSow.ai_drafted_fields ?? [],
      drafted_by: auth.user.id,
    })
    .select('id')
    .single()

  if (createErr || !created) {
    // Rollback: restore previous SOW status.
    await auth.supabase
      .from('sows')
      .update({ status: 'rejected_by_client' })
      .eq('id', prevSow.id)
    return { error: createErr?.message ?? 'Failed to create new SOW version.' }
  }

  await recordLifecycleEvent({
    engagement_id: prevSow.engagement_id,
    event_type: 'sow_resubmitted',
    actor_role: 'pm',
    actor_user_id: auth.user.id,
    notes: `New SOW version v${prevSow.version_number + 1} created from rejected v${prevSow.version_number}.`,
    payload: {
      previous_sow_id: prevSow.id,
      previous_version: prevSow.version_number,
      new_sow_id: created.id,
      new_version: prevSow.version_number + 1,
    },
  })

  logSowEvent('resubmitted', {
    engagement: prevSow.engagement_id,
    prev_sow: prevSow.id,
    prev_v: prevSow.version_number,
    new_sow: created.id as string,
    new_v: prevSow.version_number + 1,
  })

  revalidateAll(prevSow.engagement_id)
  return { ok: true, sow_id: created.id as string }
}

// ─── Convenience: signed-stage path lookup (for the version history flyout) ─
// Some callers want the storage path without resolving to a signed URL
// (for instance, to decide whether a PDF link should render). This is a
// pure read; no side effects.

export async function getSowPdfStoragePath(input: {
  sow_id: string
  stage: SowRenderStage
}): Promise<{ path?: string; error?: string }> {
  const auth = await assertInternalUser()
  if (!auth.ok) return { error: auth.error }

  const { data, error } = await auth.supabase
    .from('sows')
    .select('legal_pdf_storage_path, client_pdf_storage_path')
    .eq('id', input.sow_id)
    .single()
  if (error || !data) return { error: error?.message ?? 'SOW not found.' }

  const path =
    input.stage === 'legal_review'
      ? (data.legal_pdf_storage_path as string | null)
      : (data.client_pdf_storage_path as string | null)
  if (!path) return { error: `No ${input.stage} PDF for this SOW.` }
  return { path }
}

