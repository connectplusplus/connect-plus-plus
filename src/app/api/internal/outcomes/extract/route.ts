// POST /api/internal/outcomes/extract
//
// Phase 2 wiring: validates auth + role, parses the multipart upload, runs
// every file through the appropriate extractor, applies truncation rules,
// and returns the extracted text payload as JSON. The Anthropic call lands
// in Phase 3 (when this becomes an SSE stream).

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractBatch } from '@/lib/files/extract-text'
import type { ExtractError } from '@/lib/files/types'

// Anthropic extraction can take 30–60s in Phase 3. Local dev is unconstrained;
// hosted (Vercel) caps function duration so we declare it up front.
export const maxDuration = 60
export const runtime = 'nodejs'

interface QuestionnaireResponses {
  service_name?: string
  category?: string
  what_it_delivers?: string
  budget_timeline?: string
  anything_else?: string
}

function errorResponse(error: ExtractError, status = 400) {
  return NextResponse.json({ error }, { status })
}

export async function POST(req: Request) {
  // ── 1. Auth + role gate ──────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse(
      {
        code: 'PARSE_FAILED',
        message: 'Not authenticated.',
        retryable: false,
      },
      401
    )
  }

  const { data: internalUser } = await supabase
    .from('internal_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!internalUser || !['pm', 'delivery_lead'].includes(internalUser.role)) {
    return errorResponse(
      {
        code: 'PARSE_FAILED',
        message: 'Only PMs and Delivery Leads can use smart intake.',
        retryable: false,
      },
      403
    )
  }

  // ── 2. Parse the multipart upload ────────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch (err) {
    return errorResponse({
      code: 'PARSE_FAILED',
      message: 'Could not read the uploaded form data.',
      details: err instanceof Error ? err.message : String(err),
      retryable: true,
    })
  }

  const questionnaire: QuestionnaireResponses = {
    service_name: formData.get('service_name')?.toString() || undefined,
    category: formData.get('category')?.toString() || undefined,
    what_it_delivers: formData.get('what_it_delivers')?.toString() || undefined,
    budget_timeline: formData.get('budget_timeline')?.toString() || undefined,
    anything_else: formData.get('anything_else')?.toString() || undefined,
  }

  const files = formData.getAll('files').filter((v): v is File => v instanceof File)

  // ── 3. Extract text from every file ──────────────────────────────────
  const batch = await extractBatch(files)
  if ('error' in batch) {
    return errorResponse(batch.error)
  }

  // Surface per-file errors and the successful payloads. Phase 3 will feed
  // the successful payloads into Claude; for Phase 2 we just return what
  // we extracted so the user / smoke script can verify.
  const file_errors = batch.results
    .map((r, i) => ('error' in r ? { ...r.error, index: i } : null))
    .filter(Boolean)

  const extracted = batch.results.flatMap((r) =>
    'extracted' in r ? [r.extracted] : []
  )

  return NextResponse.json({
    questionnaire,
    extracted,
    combined_truncated_filenames: batch.combined_truncated_filenames,
    file_errors,
  })
}
