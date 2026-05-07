// SOW PDF storage — wraps the Supabase Storage client for the sow-pdfs
// bucket. Path scheme: {engagement_id}/{sow_id}/{stage}.pdf where stage is
// 'legal_review' or 'client_signature'.
//
// Reads always go through signed URLs (15-minute expiry) so the PDFs
// don't leak via cached URLs. The storage.objects RLS in migration 010
// enforces who can SELECT each row; this module is the typed surface the
// app uses to upload + read.

import { createClient } from '@/lib/supabase/server'
import type { SowRenderStage } from './render-pdf'

const BUCKET = 'sow-pdfs'
const SIGNED_URL_TTL_SECONDS = 60 * 15

export function sowPdfPath(input: {
  engagement_id: string
  sow_id: string
  stage: SowRenderStage
}): string {
  return `${input.engagement_id}/${input.sow_id}/${input.stage}.pdf`
}

// Upload a freshly-rendered PDF buffer. Caller passes their authenticated
// Supabase client (PM session); the storage RLS in migration 010 gates
// writes to is_internal_user(). Upsert=true so re-running the action
// after a fix doesn't fail on the existing object.

export async function uploadSowPdf(input: {
  engagement_id: string
  sow_id: string
  stage: SowRenderStage
  buffer: Buffer
}): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const supabase = await createClient()
  const path = sowPdfPath(input)

  const { error } = await supabase.storage.from(BUCKET).upload(path, input.buffer, {
    contentType: 'application/pdf',
    upsert: true,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true, path }
}

// Fetch a signed URL for a stored PDF. RLS gates whether the caller is
// allowed to see the underlying object. Signed URLs expire — the caller
// is expected to refetch on each click rather than caching.

export async function getSowPdfSignedUrl(
  path: string
): Promise<{ url: string | null; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  if (error || !data) {
    return { url: null, error: error?.message ?? 'Could not create signed URL.' }
  }
  return { url: data.signedUrl }
}
