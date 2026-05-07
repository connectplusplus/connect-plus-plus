'use client'

// Top-level panel that replaces the textarea-and-stub on the PM workspace
// for engagements in pending_review or awaiting_legal_review (and renders
// a read-only summary for awaiting_kickoff and beyond).
//
// Dispatches by the SOW row's sub-status:
//   draft / rejected_by_legal / rejected_by_client → SowEditor
//   awaiting_legal                                  → AwaitingLegalPanel  (Phase 5)
//   awaiting_client                                 → AwaitingClientPanel (Phase 5)
//   signed                                          → SignedSowSummary    (Phase 5)
//
// Phase 4 ships the editor + AI generation. Phase 5 fills in the
// signature flow panels.

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { History, Sparkles, Loader2, AlertCircle, FilePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SowEditor } from './sow-editor'
import { SowVersionHistory } from './sow-version-history'
import {
  AwaitingLegalPanel,
  AwaitingClientPanel,
  SignedSowSummary,
} from './sow-signature-panels'
import { getOrCreateSowDraft } from './sow-actions'
import type { Sow, SowStatus } from '@/lib/types'

interface Props {
  // null when no SOW exists yet for the engagement (legacy in-flight
  // engagements that predate migration 010, or fresh engagements where
  // the PM hasn't started). The empty state below offers "Generate first
  // draft" or "Start blank".
  sow: Sow | null
  engagementId: string
  engagementTitle: string
  companyName: string | null
}

const STATUS_HEADER_LABEL: Record<SowStatus, string> = {
  draft: 'Draft',
  awaiting_legal: 'Awaiting Legal',
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

interface DraftEvent {
  stage: string
  attempt?: number
  reason?: string
}

export function SowAuthoringPanel({
  sow,
  engagementId,
  engagementTitle,
  companyName,
}: Props) {
  const router = useRouter()
  const [historyOpen, setHistoryOpen] = useState(false)

  // No SOW row yet → empty-state choice screen.
  if (!sow) {
    return (
      <SowEmptyState
        engagementId={engagementId}
        onCreated={() => router.refresh()}
      />
    )
  }

  const isEditable = ['draft', 'rejected_by_legal', 'rejected_by_client'].includes(sow.status)

  return (
    <section className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="bg-white border border-[#7E8B6A]/20 rounded-xl px-5 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border bg-[#FAF8F4] hover:bg-white transition-colors font-mono"
            style={{ borderColor: `${STATUS_COLOR[sow.status]}40`, color: STATUS_COLOR[sow.status] }}
            title="View version history"
          >
            SOW v{sow.version_number} · {STATUS_HEADER_LABEL[sow.status]}
            <History size={11} className="opacity-70" />
          </button>
          {sow.ai_drafted && sow.ai_drafted_fields.length > 0 && (
            <span className="text-[11px] text-[#5C6B4D] italic">
              AI-drafted · {sow.ai_drafted_fields.length} field{sow.ai_drafted_fields.length === 1 ? '' : 's'} pending review
            </span>
          )}
        </div>

        {isEditable && (
          <GenerateFirstDraftButton
            engagementId={engagementId}
            sow={sow}
            onComplete={() => router.refresh()}
          />
        )}
      </header>

      {/* ── Body — dispatches by SOW status ────────────────────────── */}
      {(sow.status === 'draft' ||
        sow.status === 'rejected_by_legal' ||
        sow.status === 'rejected_by_client') && (
        <>
          {sow.status === 'rejected_by_legal' && sow.legal_rejection_notes && (
            <RejectionBanner
              source="Legal"
              notes={sow.legal_rejection_notes}
            />
          )}
          {sow.status === 'rejected_by_client' && sow.client_rejection_notes && (
            <RejectionBanner
              source="Client"
              notes={sow.client_rejection_notes}
            />
          )}
          <SowEditor
            sow={sow}
            companyName={companyName}
            engagementTitle={engagementTitle}
          />
        </>
      )}

      {sow.status === 'awaiting_legal' && <AwaitingLegalPanel sow={sow} />}
      {sow.status === 'awaiting_client' && <AwaitingClientPanel sow={sow} />}
      {sow.status === 'signed' && <SignedSowSummary sow={sow} />}

      {(sow.status === 'superseded' || sow.status === 'cancelled') && (
        <div className="bg-white border border-[#7E8B6A]/20 rounded-xl p-5 text-center text-sm text-[#7E8B6A]">
          This SOW version is {STATUS_HEADER_LABEL[sow.status].toLowerCase()}.
        </div>
      )}

      <SowVersionHistory
        engagementId={engagementId}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </section>
  )
}

// ─── Generate first draft button + streaming UI ────────────────────────────

function GenerateFirstDraftButton({
  engagementId,
  sow,
  onComplete,
}: {
  engagementId: string
  sow: Sow
  onComplete: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [events, setEvents] = useState<DraftEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // The button is "obvious" only when the SOW is empty (no scope, no
  // deliverables, no milestones). Otherwise it becomes a quieter "Re-draft
  // with Glassbox" affordance — Carlos can still hit it but it's not the
  // primary call to action.
  const sowIsEmpty =
    !sow.scope_summary &&
    (sow.deliverables ?? []).length === 0 &&
    (sow.milestones ?? []).length === 0

  function start() {
    if (pending) return
    setEvents([])
    setError(null)
    setDone(false)
    const ac = new AbortController()
    abortRef.current = ac

    startTransition(async () => {
      try {
        const res = await fetch(`/api/internal/engagements/${engagementId}/draft-sow`, {
          method: 'POST',
          signal: ac.signal,
        })
        if (!res.ok || !res.body) {
          const body = await res.text().catch(() => '')
          throw new Error(`HTTP ${res.status} ${body.slice(0, 200)}`)
        }
        await consumeSseStream(res.body, {
          onStatus: (e) => setEvents((prev) => [...prev, e]),
          onError: (msg) => setError(msg),
          onDone: () => {
            setDone(true)
            onComplete()
          },
        })
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button
        type="button"
        onClick={start}
        disabled={pending}
        className={
          sowIsEmpty
            ? 'bg-[#7E8B6A] text-white hover:bg-[#6B785A] font-semibold'
            : 'bg-white text-[#5C6B4D] border border-[#7E8B6A]/30 hover:bg-[#FAF8F4] font-medium'
        }
        size="sm"
        title={sowIsEmpty ? 'Use Sonnet 4.6 to draft scope, deliverables, milestones, pricing, and terms.' : 'Replace the current draft with a fresh AI-generated version.'}
      >
        {pending ? (
          <Loader2 size={12} className="mr-1.5 animate-spin" />
        ) : (
          <Sparkles size={12} className="mr-1.5" />
        )}
        {sowIsEmpty ? 'Generate first draft with Glassbox' : 'Re-draft with Glassbox'}
      </Button>

      {(events.length > 0 || error) && !done && (
        <div className="text-[11px] text-[#5C6B4D] font-mono max-w-xs text-right">
          {events.slice(-3).map((e, i) => (
            <p key={i}>
              {stageLabel(e.stage, e.attempt)}
              {e.reason ? ` (${e.reason})` : ''}
            </p>
          ))}
          {error && (
            <p className="text-[#B91C1C] flex items-center gap-1 justify-end mt-1">
              <AlertCircle size={11} />
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function stageLabel(stage: string, attempt?: number): string {
  switch (stage) {
    case 'preparing':
      return 'Reading template snapshot…'
    case 'calling_claude':
      return attempt && attempt > 1 ? `Calling Claude (retry ${attempt})…` : 'Calling Claude…'
    case 'received_response':
      return 'Got response, parsing…'
    case 'parsing':
      return 'Parsing response…'
    case 'retry':
      return 'Retrying after malformed JSON…'
    case 'validating':
      return 'Validating output…'
    default:
      return stage
  }
}

// ─── SSE consumer ──────────────────────────────────────────────────────────
// Server-Sent Events parser tailored to the route's emit pattern (status /
// error / done events). Tolerant of partial frames and split chunks.

interface ConsumeHandlers {
  onStatus: (data: DraftEvent) => void
  onError: (message: string) => void
  onDone: () => void
}

async function consumeSseStream(
  body: ReadableStream<Uint8Array>,
  handlers: ConsumeHandlers
) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let frameEnd: number
    while ((frameEnd = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, frameEnd)
      buffer = buffer.slice(frameEnd + 2)

      let eventName = 'message'
      let data = ''
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim()
        else if (line.startsWith('data:')) data += line.slice(5).trim()
      }
      if (!data) continue

      let parsed: unknown
      try {
        parsed = JSON.parse(data)
      } catch {
        continue
      }

      if (eventName === 'status') handlers.onStatus(parsed as DraftEvent)
      else if (eventName === 'error') {
        const e = parsed as { message?: string }
        handlers.onError(e.message ?? 'Drafting failed.')
        return
      } else if (eventName === 'done') {
        handlers.onDone()
        return
      }
    }
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────

function RejectionBanner({ source, notes }: { source: 'Legal' | 'Client'; notes: string }) {
  return (
    <div className="bg-[#BA7517]/10 border border-[#BA7517]/30 rounded-lg px-4 py-3">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-[#BA7517] mb-1">
        {source} requested changes
      </p>
      <p className="text-sm text-[#1F2A1A] leading-relaxed">{notes}</p>
    </div>
  )
}

// ─── Empty-state choice screen ─────────────────────────────────────────────

function SowEmptyState({
  engagementId,
  onCreated,
}: {
  engagementId: string
  onCreated: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [aiPending, setAiPending] = useState(false)
  const [aiEvents, setAiEvents] = useState<DraftEvent[]>([])

  function startBlank() {
    setError(null)
    startTransition(async () => {
      const res = await getOrCreateSowDraft(engagementId)
      if (res.error) {
        setError(res.error)
        return
      }
      onCreated()
    })
  }

  function generate() {
    if (aiPending) return
    setAiPending(true)
    setAiEvents([])
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/internal/engagements/${engagementId}/draft-sow`, {
          method: 'POST',
        })
        if (!res.ok || !res.body) {
          const body = await res.text().catch(() => '')
          throw new Error(`HTTP ${res.status} ${body.slice(0, 200)}`)
        }
        await consumeSseStream(res.body, {
          onStatus: (e) => setAiEvents((prev) => [...prev, e]),
          onError: (msg) => {
            setError(msg)
            setAiPending(false)
          },
          onDone: () => {
            setAiPending(false)
            onCreated()
          },
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        setAiPending(false)
      }
    })
  }

  return (
    <section className="bg-white border border-[#7E8B6A]/20 rounded-xl p-8 text-center max-w-2xl mx-auto">
      <div className="w-12 h-12 rounded-full bg-[#7E8B6A]/10 flex items-center justify-center mx-auto mb-4">
        <FilePlus size={20} className="text-[#5C6B4D]" />
      </div>
      <h2 className="font-heading font-semibold text-[#1F2A1A] text-lg mb-1">
        No SOW drafted yet
      </h2>
      <p className="text-[#5C6B4D] text-sm mb-6">
        Generate a first draft from the engagement&apos;s template snapshot and intake responses,
        or start from a blank document.
      </p>

      <div className="flex flex-col gap-2 max-w-sm mx-auto">
        <Button
          type="button"
          onClick={generate}
          disabled={pending}
          className="bg-[#7E8B6A] text-white hover:bg-[#6B785A] font-semibold w-full"
        >
          {aiPending ? (
            <Loader2 size={13} className="mr-1.5 animate-spin" />
          ) : (
            <Sparkles size={13} className="mr-1.5" />
          )}
          Generate first draft with Glassbox
        </Button>
        <Button
          type="button"
          onClick={startBlank}
          disabled={pending}
          variant="ghost"
          className="text-[#5C6B4D] hover:bg-[#7E8B6A]/10 w-full"
        >
          Start blank draft
        </Button>
      </div>

      {aiEvents.length > 0 && aiPending && (
        <div className="mt-5 text-[11px] text-[#5C6B4D] font-mono">
          {aiEvents.slice(-3).map((e, i) => (
            <p key={i}>
              {stageLabel(e.stage, e.attempt)}
              {e.reason ? ` (${e.reason})` : ''}
            </p>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-5 max-w-sm mx-auto bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg px-3 py-2 text-[#B91C1C] text-xs flex items-start gap-2">
          <AlertCircle size={12} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </section>
  )
}

