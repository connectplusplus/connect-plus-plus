'use client'

// The two-column SOW editor: form on the left, live preview on the right.
//
// Owns the in-memory draft (the saved value comes in as `initialContent`;
// the user edits on the client; "Save draft" pushes to the server). Reload
// preserves state because the server is the source of truth and the page
// is a server component re-render.
//
// "Generate first draft" lives outside this component (in the panel).
// AI-pill dismissals are handled here because they mutate
// ai_drafted_fields, which is part of the same save batch.

import { useState, useTransition } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SowFormFields } from './sow-form-fields'
import { SowPreview } from '@/components/sow/sow-preview'
import { saveSowDraft } from './sow-actions'
import type { Sow, SowContent } from '@/lib/types'

interface Props {
  sow: Sow
  companyName: string | null
  engagementTitle: string
}

const EMPTY_CONTENT: SowContent = {
  scope_summary: '',
  deliverables: [],
  milestones: [],
  pricing: { total_cents: 0, currency: 'USD', payment_terms_md: '' },
  timeline_business_days: 0,
  terms_md: '',
}

function sowToContent(sow: Sow): SowContent {
  return {
    scope_summary: sow.scope_summary ?? '',
    deliverables: sow.deliverables ?? [],
    milestones: sow.milestones ?? [],
    pricing: sow.pricing ?? EMPTY_CONTENT.pricing,
    timeline_business_days: sow.timeline_business_days ?? 0,
    terms_md: sow.terms_md ?? '',
  }
}

export function SowEditor({ sow, companyName, engagementTitle }: Props) {
  const [content, setContent] = useState<SowContent>(() => sowToContent(sow))
  const [aiFields, setAiFields] = useState<string[]>(() => sow.ai_drafted_fields ?? [])
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  // Adjust local draft when the SOW row updates from the server (e.g.
  // after AI drafting completes via the streaming route). Using the
  // "store previous prop in state and compare during render" pattern from
  // react.dev so we avoid a setState-in-useEffect cascade.
  const [prevUpdatedAt, setPrevUpdatedAt] = useState(sow.updated_at)
  if (sow.updated_at !== prevUpdatedAt) {
    setPrevUpdatedAt(sow.updated_at)
    setContent(sowToContent(sow))
    setAiFields(sow.ai_drafted_fields ?? [])
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const res = await saveSowDraft({
        sow_id: sow.id,
        content,
        ai_drafted_fields: aiFields,
      })
      if (res.error) {
        setError(res.error)
        return
      }
      setSavedAt(Date.now())
    })
  }

  function dismissAi(path: string) {
    setAiFields((prev) => prev.filter((p) => p !== path))
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {/* ── Form column ─────────────────────────────────────────────── */}
      <div className="bg-white border border-[#7E8B6A]/20 rounded-xl p-5">
        <SowFormFields
          content={content}
          onChange={setContent}
          aiDraftedFields={aiFields}
          onDismissAi={dismissAi}
          disabled={pending}
        />

        <div className="mt-6 pt-4 border-t border-[#7E8B6A]/20 flex items-center justify-between">
          <div className="text-[11px] text-[#7E8B6A]">
            {pending ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 size={11} className="animate-spin" />
                Saving…
              </span>
            ) : savedAt ? (
              <span>Saved {timeAgo(savedAt)}</span>
            ) : (
              <span>Edits stay local until you save.</span>
            )}
          </div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={pending}
            variant="ghost"
            size="sm"
            className="text-[#5C6B4D] hover:text-[#1F2A1A] hover:bg-[#7E8B6A]/10"
          >
            <Save size={12} className="mr-1.5" />
            Save draft
          </Button>
        </div>

        {error && (
          <div className="mt-3 bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg px-3 py-2 text-[#B91C1C] text-xs">
            {error}
          </div>
        )}
      </div>

      {/* ── Preview column ──────────────────────────────────────────── */}
      <div className="xl:sticky xl:top-4 xl:self-start xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto">
        <SowPreview
          sow={{
            version_number: sow.version_number,
            status: sow.status,
            ...content,
          }}
          companyName={companyName}
          engagementTitle={engagementTitle}
        />
      </div>
    </div>
  )
}

function timeAgo(ms: number): string {
  const elapsed = Math.max(0, Date.now() - ms)
  if (elapsed < 5_000) return 'just now'
  if (elapsed < 60_000) return `${Math.floor(elapsed / 1000)}s ago`
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`
  return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
