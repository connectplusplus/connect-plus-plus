'use client'

// Right-side flyout listing every SOW version for the engagement. Click
// the version pill in the panel header to open. Shows status, who drafted,
// when, and a "View archived PDF" link that fetches a fresh signed URL on
// click (signed URLs expire after 15 minutes).

import { useEffect, useState } from 'react'
import { X, FileText } from 'lucide-react'
import { getSowHistory } from './sow-actions'
import type { Sow, SowStatus } from '@/lib/types'

const STATUS_LABEL: Record<SowStatus, string> = {
  draft: 'Draft',
  awaiting_legal: 'Awaiting legal',
  rejected_by_legal: 'Legal requested changes',
  awaiting_client: 'Awaiting client',
  rejected_by_client: 'Client requested changes',
  signed: 'Signed',
  superseded: 'Superseded',
  cancelled: 'Cancelled',
}

const STATUS_COLOR: Record<SowStatus, string> = {
  draft: '#7E8B6A',
  awaiting_legal: '#7E8B6A',
  rejected_by_legal: '#BA7517',
  awaiting_client: '#7C3AED',
  rejected_by_client: '#BA7517',
  signed: '#10B981',
  superseded: '#94A3B8',
  cancelled: '#F87171',
}

interface Props {
  engagementId: string
  open: boolean
  onClose: () => void
}

export function SowVersionHistory({ engagementId, open, onClose }: Props) {
  const [versions, setVersions] = useState<Sow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Reset to "loading" whenever the flyout transitions closed→open. Using
  // the "compare-during-render" pattern (react.dev: "you might not need
  // an effect") keeps the lint quiet about setState-in-effect cascades.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setVersions(null)
      setError(null)
    }
  }

  useEffect(() => {
    if (!open) return
    let cancelled = false
    getSowHistory(engagementId).then((res) => {
      if (cancelled) return
      if (res.error) setError(res.error)
      else setVersions(res.versions ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [engagementId, open])

  if (!open) return null

  return (
    <>
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close version history"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[#1F2A1A]/30 backdrop-blur-[1px]"
      />
      {/* flyout */}
      <aside className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white border-l border-[#7E8B6A]/30 shadow-2xl overflow-y-auto">
        <header className="px-5 py-4 border-b border-[#7E8B6A]/20 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h3 className="font-heading font-semibold text-[#1F2A1A] text-sm">
              SOW version history
            </h3>
            <p className="text-[#7E8B6A] text-[11px]">All versions for this engagement</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#7E8B6A] hover:text-[#1F2A1A] p-1"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>
        <div className="p-5">
          {error && (
            <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg px-3 py-2 text-[#B91C1C] text-xs mb-3">
              {error}
            </div>
          )}
          {versions === null && !error && (
            <p className="text-[#7E8B6A] text-xs">Loading versions…</p>
          )}
          {versions !== null && versions.length === 0 && (
            <p className="text-[#7E8B6A] text-xs italic">No versions yet.</p>
          )}
          {versions !== null && versions.length > 0 && (
            <ol className="space-y-3">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="bg-[#FAF8F4] border border-[#7E8B6A]/20 rounded-lg p-3"
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="font-semibold text-[#1F2A1A] text-sm">v{v.version_number}</p>
                    <span
                      className="text-[10px] uppercase tracking-widest font-semibold"
                      style={{ color: STATUS_COLOR[v.status] }}
                    >
                      {STATUS_LABEL[v.status]}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5C6B4D]">
                    Updated{' '}
                    {new Date(v.updated_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {v.ai_drafted ? ' · AI drafted' : ''}
                  </p>
                  {(v.legal_pdf_storage_path || v.client_pdf_storage_path) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {v.legal_pdf_storage_path && (
                        <ArchivedPdfLink
                          label="Legal PDF"
                          stage="legal_review"
                          sowId={v.id}
                        />
                      )}
                      {v.client_pdf_storage_path && (
                        <ArchivedPdfLink
                          label="Client PDF"
                          stage="client_signature"
                          sowId={v.id}
                        />
                      )}
                    </div>
                  )}
                  {v.legal_rejection_notes && (
                    <p className="mt-1.5 text-[11px] text-[#BA7517] italic">
                      Legal: {v.legal_rejection_notes}
                    </p>
                  )}
                  {v.client_rejection_notes && (
                    <p className="mt-1.5 text-[11px] text-[#BA7517] italic">
                      Client: {v.client_rejection_notes}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </>
  )
}

// PDF link that resolves a signed URL on click. Phase 5 wires the actual
// getSignedSowPdfUrl action; for now we render a disabled hint so the UI
// shape is in place and the feature flips on with no template change.
function ArchivedPdfLink({
  label,
  stage: _stage,
  sowId: _sowId,
}: {
  label: string
  stage: 'legal_review' | 'client_signature'
  sowId: string
}) {
  void _stage
  void _sowId
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] text-[#7E8B6A] bg-white border border-[#7E8B6A]/20 rounded px-1.5 py-0.5 cursor-not-allowed"
      title="Available once Phase 5 wires the signed-URL action"
    >
      <FileText size={10} />
      {label}
    </span>
  )
}
