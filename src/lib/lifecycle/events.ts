// recordLifecycleEvent — single entry point for writing engagement_lifecycle_events.
//
// Every state-changing server action calls this (usually via
// transitionEngagement, which records-then-updates). Centralizing the write
// guarantees we never advance an engagement without an audit row.

import { createClient } from '@/lib/supabase/server'
import type { LifecycleActorRole, LifecycleEventType } from '@/lib/types'

export interface RecordEventInput {
  engagement_id: string
  event_type: LifecycleEventType
  actor_role: LifecycleActorRole
  actor_user_id?: string | null
  notes?: string
  payload?: Record<string, unknown>
}

export async function recordLifecycleEvent(
  input: RecordEventInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('engagement_lifecycle_events').insert({
    engagement_id: input.engagement_id,
    event_type: input.event_type,
    actor_role: input.actor_role,
    actor_user_id: input.actor_user_id ?? null,
    notes: input.notes ?? null,
    payload: input.payload ?? null,
  })

  if (error) {
    console.error('[lifecycle] recordLifecycleEvent failed:', error.message)
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
