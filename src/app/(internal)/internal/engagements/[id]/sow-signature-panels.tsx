'use client'

// Signature-flow panels rendered when the SOW is past the editor:
// - AwaitingLegalPanel: SOW status awaiting_legal
// - AwaitingClientPanel: SOW status awaiting_client
// - SignedSowSummary: SOW status signed
//
// Each panel owns its own server-action wiring + small in-line confirm
// states. They share the inline PDF preview helper at the bottom.

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Send,
  Undo2,
  AlertCircle,
  Download,
  Loader2,
  FileText,
  ScrollText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  recordLegalSignature,
  recordLegalRejection,
  recordClientSignature,
  recordClientRejection,
  resubmitSow,
  getSignedSowPdfUrl,
} from './sow-actions'
import type { Sow } from '@/lib/types'
import type { SowRenderStage } from '@/lib/sow/render-pdf'

// ─── AwaitingLegalPanel ─────────────────────────────────────────────────────
// PM marks legal as signed (manual stub for now), or records that legal
// requested changes. Same row stays editable on rejection.

export function AwaitingLegalPanel({ sow }: { sow: Sow }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [rejectionNotes, setRejectionNotes] = useState('')

  function handleSign() {
    setError(null)
    startTransition(async () => {
      const res = await recordLegalSignature({ sow_id: sow.id })
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  function handleReject() {
    setError(null)
    startTransition(async () => {
      const res = await recordLegalRejection({ sow_id: sow.id, notes: rejectionNotes })
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* PDF preview */}
      <div className="xl:col-span-2 bg-white border border-[#7E8B6A]/20 rounded-xl p-5">
        <header className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-heading font-semibold text-[#1F2A1A] text-sm flex items-center gap-1.5">
              <ScrollText size={14} className="text-[#5C6B4D]" />
              Sent to FullStack Legal
            </h3>
            <p className="text-[#5C6B4D] text-xs mt-0.5">
              {sow.sent_to_legal_at
                ? `Sent ${new Date(sow.sent_to_legal_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}`
                : 'Awaiting legal review'}
            </p>
          </div>
        </header>
        <PdfPreview sowId={sow.id} stage="legal_review" />
      </div>

      {/* Action panel */}
      <aside className="bg-white border border-[#7E8B6A]/20 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="font-heading font-semibold text-[#1F2A1A] text-sm">
            Legal review actions
          </h3>
          <p className="text-[#5C6B4D] text-xs mt-0.5">
            Real e-signature isn&apos;t wired yet. Mark legal&apos;s decision manually.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleSign}
          disabled={pending}
          className="bg-[#7E8B6A] text-white hover:bg-[#6B785A] font-semibold w-full"
        >
          {pending ? (
            <Loader2 size={13} className="mr-1.5 animate-spin" />
          ) : (
            <CheckCircle2 size={13} className="mr-1.5" />
          )}
          Mark legal as signed
        </Button>

        {!showRejectConfirm ? (
          <button
            type="button"
            onClick={() => setShowRejectConfirm(true)}
            className="text-[#BA7517] text-xs font-semibold hover:text-[#a16614] block"
          >
            <Undo2 size={11} className="inline -mt-0.5 mr-1" />
            Legal requested changes
          </button>
        ) : (
          <div className="space-y-2 pt-2 border-t border-[#7E8B6A]/20">
            <Textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="What changes is legal asking for?"
              rows={3}
              className="bg-[#FAF8F4] border-[#7E8B6A]/30 text-[#1F2A1A] focus:border-[#BA7517] text-xs resize-none"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleReject}
                disabled={!rejectionNotes.trim() || pending}
                size="sm"
                className="bg-[#BA7517] text-white hover:bg-[#a16614] flex-1"
              >
                Send back to PM
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowRejectConfirm(false)}
              >
                Back
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg px-3 py-2 text-[#B91C1C] text-xs flex items-start gap-2">
            <AlertCircle size={11} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </aside>
    </div>
  )
}

// ─── AwaitingClientPanel ────────────────────────────────────────────────────

export function AwaitingClientPanel({ sow }: { sow: Sow }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [signerName, setSignerName] = useState('')
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [rejectionNotes, setRejectionNotes] = useState('')

  function handleSign() {
    setError(null)
    startTransition(async () => {
      const res = await recordClientSignature({
        sow_id: sow.id,
        client_signer_name: signerName.trim() || undefined,
      })
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  function handleResubmit() {
    setError(null)
    startTransition(async () => {
      const reject = await recordClientRejection({
        sow_id: sow.id,
        notes: rejectionNotes,
      })
      if (reject.error) {
        setError(reject.error)
        return
      }
      const resub = await resubmitSow({ sow_id: sow.id })
      if (resub.error) setError(resub.error)
      else router.refresh()
    })
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="xl:col-span-2 bg-white border border-[#7E8B6A]/20 rounded-xl p-5">
        <header className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-heading font-semibold text-[#1F2A1A] text-sm flex items-center gap-1.5">
              <Send size={14} className="text-[#7C3AED]" />
              Sent to client
            </h3>
            <p className="text-[#5C6B4D] text-xs mt-0.5">
              Counter-signed by FullStack Legal
              {sow.legal_signed_at
                ? ` on ${new Date(sow.legal_signed_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}`
                : ''}
              {sow.sent_to_client_at
                ? ` · sent ${new Date(sow.sent_to_client_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}`
                : ''}
            </p>
          </div>
        </header>
        <PdfPreview sowId={sow.id} stage="client_signature" />
      </div>

      <aside className="bg-white border border-[#7E8B6A]/20 rounded-xl p-5 space-y-4">
        <div>
          <h3 className="font-heading font-semibold text-[#1F2A1A] text-sm">
            Client signature actions
          </h3>
          <p className="text-[#5C6B4D] text-xs mt-0.5">
            Real e-signature isn&apos;t wired yet. Mark client&apos;s decision manually.
          </p>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-widest font-semibold text-[#5C6B4D] mb-1">
            Client signer name (optional)
          </label>
          <Input
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="e.g. Diane Choi"
            className="bg-[#FAF8F4] border-[#7E8B6A]/30 text-[#1F2A1A] focus:border-[#7E8B6A] text-sm"
          />
        </div>

        <Button
          type="button"
          onClick={handleSign}
          disabled={pending}
          className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold w-full"
        >
          {pending ? (
            <Loader2 size={13} className="mr-1.5 animate-spin" />
          ) : (
            <CheckCircle2 size={13} className="mr-1.5" />
          )}
          Mark client as signed
        </Button>

        {!showRejectConfirm ? (
          <button
            type="button"
            onClick={() => setShowRejectConfirm(true)}
            className="text-[#BA7517] text-xs font-semibold hover:text-[#a16614] block"
          >
            <Undo2 size={11} className="inline -mt-0.5 mr-1" />
            Make changes and resubmit
          </button>
        ) : (
          <div className="space-y-2 pt-2 border-t border-[#7E8B6A]/20">
            <Textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="What revisions did the client request?"
              rows={3}
              className="bg-[#FAF8F4] border-[#7E8B6A]/30 text-[#1F2A1A] focus:border-[#BA7517] text-xs resize-none"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleResubmit}
                disabled={!rejectionNotes.trim() || pending}
                size="sm"
                className="bg-[#BA7517] text-white hover:bg-[#a16614] flex-1"
              >
                Create v{sow.version_number + 1} draft
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowRejectConfirm(false)}
              >
                Back
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg px-3 py-2 text-[#B91C1C] text-xs flex items-start gap-2">
            <AlertCircle size={11} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </aside>
    </div>
  )
}

// ─── SignedSowSummary ──────────────────────────────────────────────────────
// Compact, read-only card for engagements that have moved past the SOW
// (awaiting_kickoff and beyond). Provides a download link to the final
// signed PDF.

export function SignedSowSummary({ sow }: { sow: Sow }) {
  return (
    <div className="bg-white border border-[#10B981]/30 rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[#10B981]/15 flex items-center justify-center shrink-0">
          <CheckCircle2 size={14} className="text-[#10B981]" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[#1F2A1A] text-sm">Signed SOW v{sow.version_number}</p>
          <p className="text-[#5C6B4D] text-xs">
            Signed{' '}
            {sow.client_signed_at
              ? new Date(sow.client_signed_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '—'}
          </p>
        </div>
      </div>
      <DownloadPdfLink sowId={sow.id} stage="client_signature" label="Download" />
    </div>
  )
}

// ─── Inline PDF preview ────────────────────────────────────────────────────
// Fetches a signed URL on mount and embeds the PDF in an iframe at a
// reasonable height. The signed URL expires; we refetch when the sowId
// or stage changes.

function PdfPreview({ sowId, stage }: { sowId: string; stage: SowRenderStage }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Reset on key change (the "compare-during-render" pattern from
  // react.dev so we don't trip the set-state-in-effect lint).
  const [prevKey, setPrevKey] = useState(`${sowId}::${stage}`)
  const currentKey = `${sowId}::${stage}`
  if (currentKey !== prevKey) {
    setPrevKey(currentKey)
    setUrl(null)
    setError(null)
  }

  useEffect(() => {
    let cancelled = false
    getSignedSowPdfUrl({ sow_id: sowId, stage }).then((res) => {
      if (cancelled) return
      if (res.error) setError(res.error)
      else setUrl(res.url ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [sowId, stage])

  if (error) {
    return (
      <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg px-3 py-2 text-[#B91C1C] text-xs">
        {error}
      </div>
    )
  }

  return (
    <div className="bg-[#FAF8F4] border border-[#7E8B6A]/20 rounded-lg overflow-hidden">
      {url ? (
        <iframe
          src={url}
          title="SOW PDF preview"
          className="w-full h-[700px] bg-white"
        />
      ) : (
        <div className="h-[180px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-[#5C6B4D] text-xs">
            <Loader2 size={12} className="animate-spin" />
            Loading PDF preview…
          </div>
        </div>
      )}
      <div className="border-t border-[#7E8B6A]/20 px-3 py-2 flex items-center justify-between">
        <p className="text-[10px] text-[#7E8B6A]">
          <FileText size={10} className="inline -mt-0.5 mr-1" />
          Signed link expires in 15 minutes
        </p>
        <DownloadPdfLink sowId={sowId} stage={stage} label="Open in new tab" />
      </div>
    </div>
  )
}

// ─── Download / open link ──────────────────────────────────────────────────
// Resolves a signed URL on click rather than at render time so that the
// link is fresh every time and we don't accumulate expired URLs.

function DownloadPdfLink({
  sowId,
  stage,
  label,
}: {
  sowId: string
  stage: SowRenderStage
  label: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function open() {
    setError(null)
    startTransition(async () => {
      const res = await getSignedSowPdfUrl({ sow_id: sowId, stage })
      if (res.error || !res.url) {
        setError(res.error ?? 'Could not open PDF.')
        return
      }
      window.open(res.url, '_blank', 'noopener,noreferrer')
    })
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-[10px] text-[#B91C1C]">{error}</span>}
      <button
        type="button"
        onClick={open}
        disabled={pending}
        className="text-[#5C6B4D] text-[11px] font-semibold hover:text-[#1F2A1A] disabled:opacity-50 inline-flex items-center gap-1"
      >
        {pending ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <Download size={11} />
        )}
        {label}
      </button>
    </div>
  )
}
