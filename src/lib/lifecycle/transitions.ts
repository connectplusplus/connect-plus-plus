// State-machine for the engagement lifecycle. Every server action that
// changes engagements.status must go through transitionEngagement(); this
// is the only place legal transitions are encoded.
//
// The map intentionally permits legacy state transitions (intake → active
// etc.) so old engagements can still be moved by ops. New engagements
// follow the five-state path:
//   pending_review → awaiting_legal_review → awaiting_signature
//                  → awaiting_kickoff → active
//
// Sub-state of the SOW workflow (draft / awaiting_legal / rejected_by_*
// / etc.) lives on the sows row and is NOT modeled here.

import { createClient } from '@/lib/supabase/server'
import { recordLifecycleEvent } from './events'
import type {
  EngagementStatus,
  LifecycleActorRole,
  LifecycleEventType,
} from '@/lib/types'

// Each entry: from-state → set of legal to-states.
// A given transition either appears here or it's illegal.
export const LEGAL_TRANSITIONS: Partial<Record<EngagementStatus, EngagementStatus[]>> = {
  // ── New five-state lifecycle (010) ─────────────────────────────────────
  // Note: pending_review → awaiting_signature is preserved for the legacy
  // sendSowForSignature stub on engagements created before 010. New
  // engagements always route through awaiting_legal_review.
  pending_review: ['awaiting_legal_review', 'awaiting_signature', 'cancelled'],
  awaiting_legal_review: ['awaiting_signature', 'pending_review', 'cancelled'],
  awaiting_signature: ['awaiting_kickoff', 'pending_review', 'cancelled'],
  awaiting_kickoff: ['active', 'cancelled'],

  // ── Active engagement transitions ───────────────────────────────────────
  active: ['in_review', 'completed', 'cancelled'],
  in_review: ['active', 'completed', 'cancelled'],

  // ── Legacy states (engagements that predate migration 008) ──────────────
  intake: ['scoping', 'active', 'cancelled'],
  scoping: ['active', 'cancelled'],
}

export class IllegalTransitionError extends Error {
  constructor(
    public readonly from: EngagementStatus,
    public readonly to: EngagementStatus
  ) {
    super(`Illegal engagement transition: ${from} → ${to}`)
    this.name = 'IllegalTransitionError'
  }
}

export function isLegalTransition(
  from: EngagementStatus,
  to: EngagementStatus
): boolean {
  if (from === to) return true // idempotent no-op is always legal
  return (LEGAL_TRANSITIONS[from] ?? []).includes(to)
}

export function assertLegalTransition(
  from: EngagementStatus,
  to: EngagementStatus
): void {
  if (!isLegalTransition(from, to)) {
    throw new IllegalTransitionError(from, to)
  }
}

export interface TransitionInput {
  engagement_id: string
  // The status the caller believes the engagement is currently in. Used as
  // an optimistic-concurrency guard: the UPDATE only fires if the row's
  // status still matches, which makes double-clicks safe (the second one
  // finds no matching row and returns ok=false with a clear reason).
  expected_from: EngagementStatus
  to: EngagementStatus
  // Optional extra fields to update alongside status (timestamps, etc).
  patch?: Record<string, unknown>
  // Lifecycle event written after the status update succeeds.
  event_type: LifecycleEventType
  actor_role: LifecycleActorRole
  actor_user_id?: string | null
  notes?: string
  event_payload?: Record<string, unknown>
}

export type TransitionResult =
  | { ok: true }
  | { ok: false; code: 'illegal_transition' | 'state_mismatch' | 'db_error'; error: string }

export async function transitionEngagement(
  input: TransitionInput
): Promise<TransitionResult> {
  // 1. Validate legality up front so we fail before touching the DB.
  if (!isLegalTransition(input.expected_from, input.to)) {
    return {
      ok: false,
      code: 'illegal_transition',
      error: `Illegal transition: ${input.expected_from} → ${input.to}`,
    }
  }

  const supabase = await createClient()

  // 2. Conditional UPDATE: only succeeds when current status still matches.
  const { data, error } = await supabase
    .from('engagements')
    .update({ status: input.to, ...(input.patch ?? {}) })
    .eq('id', input.engagement_id)
    .eq('status', input.expected_from)
    .select('id, status')
    .single()

  if (error) {
    // PostgREST returns an error when no rows are matched by .single() —
    // distinguish "concurrent transition / already moved" from real DB errors.
    if (error.code === 'PGRST116') {
      return {
        ok: false,
        code: 'state_mismatch',
        error: `Engagement is no longer in ${input.expected_from} state. It may have been moved already.`,
      }
    }
    return { ok: false, code: 'db_error', error: error.message }
  }

  if (!data) {
    return {
      ok: false,
      code: 'state_mismatch',
      error: `Engagement is no longer in ${input.expected_from} state.`,
    }
  }

  // 3. Audit-log the transition. We don't roll back the status update if the
  //    event write fails — the row is still in the right state, and the
  //    error is logged. A better fix is server-side stored procs; this is
  //    the pragmatic version.
  await recordLifecycleEvent({
    engagement_id: input.engagement_id,
    event_type: input.event_type,
    actor_role: input.actor_role,
    actor_user_id: input.actor_user_id ?? null,
    notes: input.notes,
    payload: input.event_payload,
  })

  return { ok: true }
}
