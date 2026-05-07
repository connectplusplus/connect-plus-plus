// POST /api/internal/engagements/[id]/draft-sow
//
// SOW drafter entry point. Auth-gates the caller (PM or delivery_lead),
// rate-limits at 20/PM/hour via sow_drafts_usage, looks up the engagement's
// template snapshot + intake responses, calls Claude Sonnet 4.6 through
// draftSow(), and streams progress + the final outcome back as
// Server-Sent Events.
//
// Mirrors src/app/api/internal/outcomes/extract/route.ts. On success the
// route also writes the drafted SowContent into the active sows row (or
// creates a v1 row if none exists) and emits a sow_drafted lifecycle event.

import { createClient } from '@/lib/supabase/server'
import {
  draftSow,
  type DraftSowEvent,
  type DraftSowErrorCode,
} from '@/lib/anthropic/draft-sow'
import { recordLifecycleEvent } from '@/lib/lifecycle/events'
import type { OutcomeTemplate, SowContent } from '@/lib/types'

export const maxDuration = 60
export const runtime = 'nodejs'

const RATE_LIMIT_PER_HOUR = 20

// ─── Helpers ────────────────────────────────────────────────────────────────

const encoder = new TextEncoder()

function sseEvent(name: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`)
}

interface UsageLogInput {
  user_id: string
  engagement_id: string | null
  sow_id: string | null
  model_used: string | null
  input_tokens: number | null
  output_tokens: number | null
  latency_ms: number | null
  status: 'success' | 'error' | 'rate_limited'
  error_code: DraftSowErrorCode | null
}

async function logUsage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: UsageLogInput
) {
  await supabase
    .from('sow_drafts_usage')
    .insert(row)
    .then(({ error }) => {
      if (error) console.error('[draft-sow] usage log failed:', error.message)
    })
}

interface JsonError {
  code: DraftSowErrorCode | 'NOT_FOUND' | 'FORBIDDEN' | 'PARSE_FAILED'
  message: string
  details?: string
  retryable: boolean
}

function jsonError(error: JsonError, status = 400) {
  return Response.json({ error }, { status })
}

// ─── Engagement context lookup ──────────────────────────────────────────────

async function loadEngagementContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  engagement_id: string
): Promise<
  | {
      ok: true
      template_snapshot: Partial<OutcomeTemplate>
      intake_responses: Record<string, unknown>
      company_name: string
      contact_name?: string
    }
  | { ok: false; code: 'NOT_FOUND' | 'FORBIDDEN'; message: string }
> {
  const { data: eng, error: engErr } = await supabase
    .from('engagements')
    .select(
      'id, status, intake_responses, companies(name), engagement_configurations(payload)'
    )
    .eq('id', engagement_id)
    .single()

  if (engErr || !eng) {
    return { ok: false, code: 'NOT_FOUND', message: 'Engagement not found.' }
  }

  // Drafting is gated to engagements that are still in the SOW-authoring
  // window. Once we're past awaiting_signature the contract is sealed.
  const allowedStatuses = ['pending_review', 'awaiting_legal_review']
  if (!allowedStatuses.includes(String(eng.status))) {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: `Drafting is not available in status ${eng.status}.`,
    }
  }

  const cfg = Array.isArray(eng.engagement_configurations)
    ? eng.engagement_configurations[0]
    : eng.engagement_configurations
  const template_snapshot = (cfg?.payload ?? {}) as Partial<OutcomeTemplate>

  const company = Array.isArray(eng.companies) ? eng.companies[0] : eng.companies
  const company_name = (company?.name as string) ?? 'the client'

  return {
    ok: true,
    template_snapshot,
    intake_responses: (eng.intake_responses ?? {}) as Record<string, unknown>,
    company_name,
  }
}

// ─── Get-or-create the editable SOW row for the engagement ──────────────────

async function getOrCreateActiveSow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  engagement_id: string,
  drafted_by: string
): Promise<{ ok: true; sow_id: string } | { ok: false; message: string }> {
  // Active SOW row (latest non-superseded, non-cancelled)
  const { data: existing, error: existingErr } = await supabase
    .from('sows')
    .select('id, status, version_number')
    .eq('engagement_id', engagement_id)
    .not('status', 'in', '(superseded,cancelled)')
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingErr) return { ok: false, message: existingErr.message }

  if (existing) {
    // Drafting is only allowed on draft / rejected_by_legal / rejected_by_client.
    if (!['draft', 'rejected_by_legal', 'rejected_by_client'].includes(existing.status)) {
      return {
        ok: false,
        message: `SOW is in status ${existing.status}; drafting is not available.`,
      }
    }
    return { ok: true, sow_id: existing.id as string }
  }

  // No SOW yet → create v1 in draft. The AI fields below get populated on
  // successful draft return; this row exists so the editor has something
  // stable to point at.
  const { data: created, error: createErr } = await supabase
    .from('sows')
    .insert({
      engagement_id,
      version_number: 1,
      status: 'draft',
      drafted_by,
    })
    .select('id')
    .single()

  if (createErr || !created) {
    return { ok: false, message: createErr?.message ?? 'Failed to create SOW row.' }
  }

  return { ok: true, sow_id: created.id as string }
}

// ─── POST handler ──────────────────────────────────────────────────────────

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: engagement_id } = await params
  const supabase = await createClient()

  // ── Auth ─────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonError(
      { code: 'FORBIDDEN', message: 'Not authenticated.', retryable: false },
      401
    )
  }

  const { data: internalUser } = await supabase
    .from('internal_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!internalUser || !['pm', 'delivery_lead'].includes(internalUser.role)) {
    return jsonError(
      {
        code: 'FORBIDDEN',
        message: 'Only PMs and Delivery Leads can draft SOWs.',
        retryable: false,
      },
      403
    )
  }

  // ── Rate limit ───────────────────────────────────────────────────────
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from('sow_drafts_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneHourAgo)

  if ((recentCount ?? 0) >= RATE_LIMIT_PER_HOUR) {
    await logUsage(supabase, {
      user_id: user.id,
      engagement_id,
      sow_id: null,
      model_used: null,
      input_tokens: null,
      output_tokens: null,
      latency_ms: null,
      status: 'rate_limited',
      error_code: 'RATE_LIMITED',
    })
    return jsonError(
      {
        code: 'RATE_LIMITED',
        message: `Rate limit reached (${RATE_LIMIT_PER_HOUR}/hour). Try again later, or edit the SOW manually.`,
        retryable: true,
      },
      429
    )
  }

  // ── Engagement context ──────────────────────────────────────────────
  const ctx = await loadEngagementContext(supabase, engagement_id)
  if (!ctx.ok) {
    return jsonError({ ...ctx, retryable: false }, ctx.code === 'NOT_FOUND' ? 404 : 403)
  }

  // ── Get or create the active SOW row ────────────────────────────────
  const sowRow = await getOrCreateActiveSow(supabase, engagement_id, user.id)
  if (!sowRow.ok) {
    return jsonError(
      { code: 'FORBIDDEN', message: sowRow.message, retryable: false },
      400
    )
  }
  const sow_id = sowRow.sow_id

  // ── Stream the Claude call as SSE ───────────────────────────────────
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const generator = draftSow({
          template_snapshot: ctx.template_snapshot,
          intake_responses: ctx.intake_responses,
          company_name: ctx.company_name,
        })

        let result: Awaited<ReturnType<typeof generator.next>>
        while (!(result = await generator.next()).done) {
          const event = result.value as DraftSowEvent
          controller.enqueue(sseEvent('status', event))
        }
        const final = result.value

        if (!final.ok) {
          controller.enqueue(
            sseEvent('error', {
              code: final.code,
              message: final.message,
              details: final.details,
              retryable: final.retryable,
            })
          )
          await logUsage(supabase, {
            user_id: user.id,
            engagement_id,
            sow_id,
            model_used: null,
            input_tokens: null,
            output_tokens: null,
            latency_ms: null,
            status: 'error',
            error_code: final.code,
          })
          controller.close()
          return
        }

        // ── Persist drafted content into the SOW row ────────────────
        const content: SowContent = final.content
        const { error: updateErr } = await supabase
          .from('sows')
          .update({
            scope_summary: content.scope_summary,
            deliverables: content.deliverables,
            milestones: content.milestones,
            pricing: content.pricing,
            timeline_business_days: content.timeline_business_days,
            terms_md: content.terms_md,
            ai_drafted: true,
            ai_drafted_fields: final.ai_drafted_fields,
            drafted_by: user.id,
          })
          .eq('id', sow_id)

        if (updateErr) {
          controller.enqueue(
            sseEvent('error', {
              code: 'API_ERROR',
              message: `Drafted SOW could not be saved: ${updateErr.message}`,
              retryable: true,
            })
          )
          await logUsage(supabase, {
            user_id: user.id,
            engagement_id,
            sow_id,
            model_used: final.usage.model,
            input_tokens: final.usage.input_tokens,
            output_tokens: final.usage.output_tokens,
            latency_ms: final.usage.latency_ms,
            status: 'error',
            error_code: 'API_ERROR',
          })
          controller.close()
          return
        }

        await recordLifecycleEvent({
          engagement_id,
          event_type: 'sow_drafted',
          actor_role: 'pm',
          actor_user_id: user.id,
          notes: 'AI-drafted SOW (initial fill)',
          payload: {
            sow_id,
            ai_drafted: true,
            usage: final.usage,
          },
        })

        await logUsage(supabase, {
          user_id: user.id,
          engagement_id,
          sow_id,
          model_used: final.usage.model,
          input_tokens: final.usage.input_tokens,
          output_tokens: final.usage.output_tokens,
          latency_ms: final.usage.latency_ms,
          status: 'success',
          error_code: null,
        })

        controller.enqueue(
          sseEvent('done', {
            sow_id,
            ai_drafted_fields: final.ai_drafted_fields,
            usage: final.usage,
          })
        )
        controller.close()
      } catch (err) {
        controller.enqueue(
          sseEvent('error', {
            code: 'API_ERROR',
            message: 'An unexpected error interrupted SOW drafting.',
            details: err instanceof Error ? err.message : String(err),
            retryable: true,
          })
        )
        await logUsage(supabase, {
          user_id: user.id,
          engagement_id,
          sow_id,
          model_used: null,
          input_tokens: null,
          output_tokens: null,
          latency_ms: null,
          status: 'error',
          error_code: 'API_ERROR',
        })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
