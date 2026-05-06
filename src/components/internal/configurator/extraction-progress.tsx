'use client'

import { Loader2, Sparkles, X } from 'lucide-react'

export type ProgressStage =
  | 'preparing'
  | 'calling_claude'
  | 'received_response'
  | 'parsing'
  | 'retry'
  | 'validating'

const STAGE_COPY: Record<ProgressStage, string> = {
  preparing: 'Reading your files…',
  calling_claude: 'Asking Claude to draft your template…',
  received_response: 'Receiving response…',
  parsing: 'Parsing the JSON…',
  retry: 'Retrying after parse error…',
  validating: 'Validating the structure…',
}

interface Props {
  stage: ProgressStage | null
  fileCount: number
  retryReason?: string
  onCancel: () => void
}

export function ExtractionProgress({ stage, fileCount, retryReason, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center">
            <Sparkles size={22} className="text-[#7C3AED]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-[#0F172A] text-base">
              Drafting your template
            </h3>
            <p className="text-[#94A3B8] text-xs">
              {fileCount > 0
                ? `${fileCount} file${fileCount === 1 ? '' : 's'} attached`
                : 'No files — using questionnaire only'}
            </p>
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

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Loader2 size={16} className="text-[#7C3AED] animate-spin shrink-0" />
            <span className="text-[#0F172A]">
              {stage ? STAGE_COPY[stage] : 'Connecting…'}
            </span>
          </div>
          {retryReason && (
            <p className="text-[#F59E0B] text-xs pl-7">{retryReason}</p>
          )}
        </div>

        <p className="text-[#94A3B8] text-[11px] mt-6 leading-relaxed">
          Sonnet 4.6 typically responds in 15–60 seconds. This page must stay open until the
          draft is created. Cancel safely anytime — nothing is saved until extraction
          succeeds.
        </p>
      </div>
    </div>
  )
}
