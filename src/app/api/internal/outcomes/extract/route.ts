// POST /api/internal/outcomes/extract
//
// Smart-intake entry point. Auth-gates the caller, rate-limits, extracts text
// from each uploaded file, calls Claude Sonnet 4.6 to draft an
// OutcomeTemplate, inserts it as a draft, and streams progress + the final
// outcome back as Server-Sent Events.

import { createClient } from '@/lib/supabase/server'
import { extractBatch } from '@/lib/files/extract-text'
import {
  createPopulatedDraft,
} from '@/app/(internal)/internal/outcomes/actions'
import {
  extractTemplate,
  type ExtractionEvent,
} from '@/lib/anthropic/extract-template'
import type { ExtractError, ExtractErrorCode } from '@/lib/files/types'

// Anthropic extraction can take 30–60s. Local dev is unconstrained; hosted
// (Vercel) caps function duration so we declare it up front.
export const maxDuration = 60
export const runtime = 'nodejs'

const RATE_LIMIT_PER_HOUR = 10

// ─── Helpers ────────────────────────────────────────────────────────────────

const encoder = new TextEncoder()

function sseEvent(name: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`)
}

interface UsageLogInput {
  user_id: string
  template_id: string | null
  file_count: number
  total_words: number
  model_used: string | null
  input_tokens: number | null
  output_tokens: number | null
  latency_ms: number | null
  status: 'success' | 'error' | 'rate_limited'
  error_code: ExtractErrorCode | null
}

async function logUsage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: UsageLogInput
) {
  // Fire-and-forget — observability shouldn't block the user response.
  await supabase
    .from('smart_intake_usage')
    .insert(row)
    .then(({ error }) => {
      if (error) console.error('[smart-intake] usage log failed:', error.message)
    })
}

// ─── POST handler ───────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonError({
      code: 'AUTH_ERROR',
      message: 'Not authenticated.',
      retryable: false,
    }, 401)
  }

  const { data: internalUser } = await supabase
    .from('internal_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!internalUser || !['pm', 'delivery_lead'].includes(internalUser.role)) {
    return jsonError({
      code: 'AUTH_ERROR',
      message: 'Only PMs and Delivery Leads can use smart intake.',
      retryable: false,
    }, 403)
  }

  // ── Rate limit ───────────────────────────────────────────────────────
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from('smart_intake_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneHourAgo)

  if ((recentCount ?? 0) >= RATE_LIMIT_PER_HOUR) {
    await logUsage(supabase, {
      user_id: user.id,
      template_id: null,
      file_count: 0,
      total_words: 0,
      model_used: null,
      input_tokens: null,
      output_tokens: null,
      latency_ms: null,
      status: 'rate_limited',
      error_code: 'RATE_LIMITED',
    })
    return jsonError({
      code: 'RATE_LIMITED',
      message: `Rate limit reached (${RATE_LIMIT_PER_HOUR}/hour). Try again later, or use copy-from-template / manual intake.`,
      retryable: true,
    }, 429)
  }

  // ── Multipart parse ──────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch (err) {
    return jsonError({
      code: 'PARSE_FAILED',
      message: 'Could not read the uploaded form data.',
      details: err instanceof Error ? err.message : String(err),
      retryable: true,
    })
  }

  const questionnaire = {
    service_name: (formData.get('service_name')?.toString() ?? '').trim(),
    category: (formData.get('category')?.toString() ?? '').trim(),
    what_it_delivers: (formData.get('what_it_delivers')?.toString() ?? '').trim(),
    budget_timeline: formData.get('budget_timeline')?.toString() || undefined,
    anything_else: formData.get('anything_else')?.toString() || undefined,
  }

  if (!questionnaire.service_name || !questionnaire.category || !questionnaire.what_it_delivers) {
    return jsonError({
      code: 'PARSE_FAILED',
      message: 'Service name, category, and what-it-delivers are all required.',
      retryable: false,
    })
  }

  const files = formData.getAll('files').filter((v): v is File => v instanceof File)

  // ── Extract text from every file (Phase 2 pipeline) ──────────────────
  const batch = await extractBatch(files)
  if ('error' in batch) {
    return jsonError(batch.error)
  }

  const extracted = batch.results.flatMap((r) =>
    'extracted' in r ? [r.extracted] : []
  )
  const fileErrors = batch.results
    .map((r) => ('error' in r ? r.error : null))
    .filter((e): e is ExtractError => e !== null)

  // We continue even if some files failed; partial input is better than none.
  // The fileErrors get surfaced in the SSE stream so the user can see what
  // we couldn't read.

  const totalWords = extracted.reduce((s, f) => s + (f.original_word_count ?? 0), 0)

  // ── Stream the Claude call as SSE ────────────────────────────────────
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (fileErrors.length > 0) {
          controller.enqueue(sseEvent('file_errors', { errors: fileErrors }))
        }

        const generator = extractTemplate({
          questionnaire: {
            service_name: questionnaire.service_name,
            category: questionnaire.category,
            what_it_delivers: questionnaire.what_it_delivers,
            budget_timeline: questionnaire.budget_timeline,
            anything_else: questionnaire.anything_else,
          },
          files: extracted.map((f) => ({
            filename: f.filename,
            text: f.text,
            was_truncated: f.was_truncated,
          })),
        })

        let result: Awaited<ReturnType<typeof generator.next>>
        while (!(result = await generator.next()).done) {
          const event = result.value as ExtractionEvent
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
            template_id: null,
            file_count: files.length,
            total_words: totalWords,
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

        // ── Insert the populated draft ───────────────────────────────────
        const insert = await createPopulatedDraft({
          template: final.template,
          ai_suggested_fields: final.ai_suggested_fields,
          desired_slug: final.template.slug,
        })

        if (insert.error || !insert.slug || !insert.id) {
          controller.enqueue(
            sseEvent('error', {
              code: 'API_ERROR',
              message: insert.error ?? 'Failed to insert the draft.',
              retryable: true,
            })
          )
          await logUsage(supabase, {
            user_id: user.id,
            template_id: null,
            file_count: files.length,
            total_words: totalWords,
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

        await logUsage(supabase, {
          user_id: user.id,
          template_id: insert.id,
          file_count: files.length,
          total_words: totalWords,
          model_used: final.usage.model,
          input_tokens: final.usage.input_tokens,
          output_tokens: final.usage.output_tokens,
          latency_ms: final.usage.latency_ms,
          status: 'success',
          error_code: null,
        })

        controller.enqueue(
          sseEvent('done', {
            slug: insert.slug,
            template_id: insert.id,
            ai_suggested_fields: final.ai_suggested_fields,
            usage: final.usage,
          })
        )
        controller.close()
      } catch (err) {
        controller.enqueue(
          sseEvent('error', {
            code: 'API_ERROR',
            message: 'An unexpected error interrupted the extraction.',
            details: err instanceof Error ? err.message : String(err),
            retryable: true,
          })
        )
        await logUsage(supabase, {
          user_id: user.id,
          template_id: null,
          file_count: files.length,
          total_words: totalWords,
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
      // SSE-specific: tell proxies not to buffer.
      'X-Accel-Buffering': 'no',
    },
  })
}

function jsonError(error: ExtractError, status = 400) {
  return Response.json({ error }, { status })
}
