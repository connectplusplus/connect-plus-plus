'use client'

import { Loader2, Sparkles, X } from 'lucide-react'

// Public stage type kept for callers; we no longer surface stage-specific
// copy in the overlay (the LLM call is opaque from the user's POV — there's
// no honest progress meter we can show). The shell still consumes these
// events for analytics / future extension.
export type ProgressStage =
  | 'preparing'
  | 'calling_claude'
  | 'received_response'
  | 'parsing'
  | 'retry'
  | 'validating'

interface Props {
  stage: ProgressStage | null
  fileCount: number
  retryReason?: string
  onCancel: () => void
}

export function ExtractionProgress({ retryReason, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
            <Sparkles size={22} className="text-[#7C3AED]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-[#0F172A] text-base">
              Glassbox is using AI to pre-fill your template
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-[#94A3B8] hover:text-[#0F172A] transition-colors p-1 rounded"
            aria-label="Cancel extraction"
            title="Cancel"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Loader2 size={16} className="text-[#7C3AED] animate-spin shrink-0" />
          <span className="text-[#64748B]">Working on it…</span>
        </div>
        {retryReason && (
          <p className="text-[#F59E0B] text-xs mt-3 pl-7">{retryReason}</p>
        )}
      </div>
    </div>
  )
}
