'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LifecycleTimeline } from '@/components/lifecycle/lifecycle-timeline'
import { EngagementStatusBadge } from '@/components/dashboard/status-badge'
import { ArrowLeft, FileText, Send, CheckCircle2, Calendar, Undo2, XCircle, AlertCircle } from 'lucide-react'
import {
  sendSowForSignature,
  recordSignature,
  scheduleKickoff,
  returnToReview,
  cancelEngagementAsPM,
} from '../actions'
import { completeKickoff } from './kickoff-actions'
import { KickoffCompletionModal } from './kickoff-completion-modal'
import type { Engagement, EngagementLifecycleEvent } from '@/lib/types'

interface Props {
  engagement: Engagement & {
    outcome_templates?: { slug: string; title: string } | { slug: string; title: string }[] | null
  }
  companyName: string | null
  lifecycleEvents: EngagementLifecycleEvent[]
  lifecycleActorNames: Record<string, string>
  scheduledKickoffAt: string | null
  currentUserId: string
}

export function PMWorkspace({
  engagement,
  companyName,
  lifecycleEvents,
  lifecycleActorNames,
  scheduledKickoffAt,
  currentUserId: _currentUserId,
}: Props) {
  void _currentUserId
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showKickoffModal, setShowKickoffModal] = useState(false)

  function refresh() {
    setError(null)
    router.refresh()
  }

  function handle<T>(fn: () => Promise<{ ok?: true; error?: string } | T>) {
    setError(null)
    startTransition(async () => {
      const result = (await fn()) as { ok?: true; error?: string }
      if (result.error) {
        setError(result.error)
      } else {
        refresh()
      }
    })
  }

  const tplTitle = Array.isArray(engagement.outcome_templates)
    ? engagement.outcome_templates[0]?.title
    : engagement.outcome_templates?.title

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        href="/internal/queue"
        className="inline-flex items-center gap-1.5 text-[#64748B] text-sm hover:text-[#0F172A] transition-colors"
      >
        <ArrowLeft size={14} />
        Back to queue
      </Link>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <EngagementStatusBadge status={engagement.status} />
            {tplTitle && (
              <span className="text-[#94A3B8] text-xs">· from {tplTitle}</span>
            )}
          </div>
          <h2 className="font-heading font-bold text-xl text-[#0F172A] leading-tight">
            {engagement.title}
          </h2>
          {companyName && (
            <p className="text-[#64748B] text-sm mt-0.5">{companyName}</p>
          )}
        </div>
        <div className="text-right text-xs text-[#94A3B8] shrink-0">
          <p>
            Submitted{' '}
            {engagement.intake_submitted_at
              ? new Date(engagement.intake_submitted_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : '—'}
          </p>
        </div>
      </header>

      {error && (
        <div className="bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg px-4 py-3 flex items-start gap-2">
          <AlertCircle size={14} className="text-[#B91C1C] shrink-0 mt-0.5" />
          <p className="text-[#B91C1C] text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: lifecycle timeline ───────────────────────────────────── */}
        <section className="lg:col-span-3 bg-white border border-[#E2E8F0] rounded-xl p-5">
          <h3 className="font-heading font-semibold text-sm text-[#0F172A] mb-4">
            Lifecycle
          </h3>
          <LifecycleTimeline
            events={lifecycleEvents}
            audience="internal"
            actorNames={lifecycleActorNames}
          />
        </section>

        {/* ── Right: state-specific action panel ─────────────────────────── */}
        <aside className="lg:col-span-2 space-y-4">
          {engagement.status === 'pending_review' && (
            <PendingReviewPanel
              engagementId={engagement.id}
              pending={pending}
              onSendSow={(scope_notes, sow_url) =>
                handle(() =>
                  sendSowForSignature({
                    engagement_id: engagement.id,
                    scope_notes,
                    sow_url,
                  })
                )
              }
              onCancel={(reason) =>
                handle(() =>
                  cancelEngagementAsPM({
                    engagement_id: engagement.id,
                    current_status: 'pending_review',
                    reason,
                  })
                )
              }
            />
          )}

          {engagement.status === 'awaiting_signature' && (
            <AwaitingSignaturePanel
              pending={pending}
              onMarkSigned={() =>
                handle(() => recordSignature({ engagement_id: engagement.id }))
              }
              onReturnToReview={(notes) =>
                handle(() =>
                  returnToReview({ engagement_id: engagement.id, revision_notes: notes })
                )
              }
              onCancel={(reason) =>
                handle(() =>
                  cancelEngagementAsPM({
                    engagement_id: engagement.id,
                    current_status: 'awaiting_signature',
                    reason,
                  })
                )
              }
            />
          )}

          {engagement.status === 'awaiting_kickoff' && (
            <AwaitingKickoffPanel
              pending={pending}
              scheduledKickoffAt={scheduledKickoffAt}
              onSchedule={(scheduled_at) =>
                handle(() =>
                  scheduleKickoff({
                    engagement_id: engagement.id,
                    scheduled_at,
                  })
                )
              }
              onCompleteKickoff={() => setShowKickoffModal(true)}
              onCancel={(reason) =>
                handle(() =>
                  cancelEngagementAsPM({
                    engagement_id: engagement.id,
                    current_status: 'awaiting_kickoff',
                    reason,
                  })
                )
              }
            />
          )}

          {engagement.status === 'active' && (
            <ActivePanel engagementId={engagement.id} />
          )}

          {(engagement.status === 'cancelled' ||
            engagement.status === 'completed') && (
            <ReadOnlyPanel status={engagement.status} engagementId={engagement.id} />
          )}

          {/* Legacy states (intake / scoping) get a friendly note */}
          {(engagement.status === 'intake' || engagement.status === 'scoping') && (
            <LegacyPanel status={engagement.status} engagementId={engagement.id} />
          )}
        </aside>
      </div>

      {showKickoffModal && (
        <KickoffCompletionModal
          engagementId={engagement.id}
          scheduledKickoffAt={scheduledKickoffAt}
          onClose={() => setShowKickoffModal(false)}
          onSubmit={(input) =>
            new Promise((resolve) => {
              startTransition(async () => {
                const result = await completeKickoff(input)
                if (result.error) {
                  setError(result.error)
                  resolve({ error: result.error })
                  return
                }
                setShowKickoffModal(false)
                router.refresh()
                resolve({ ok: true })
              })
            })
          }
        />
      )}
    </div>
  )
}

// ─── Pending review panel ───────────────────────────────────────────────────

function PendingReviewPanel({
  engagementId: _engagementId,
  pending,
  onSendSow,
  onCancel,
}: {
  engagementId: string
  pending: boolean
  onSendSow: (scopeNotes: string, sowUrl?: string) => void
  onCancel: (reason: string) => void
}) {
  void _engagementId
  const [scopeNotes, setScopeNotes] = useState('')
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
      <div>
        <h3 className="font-heading font-semibold text-[#0F172A] text-sm flex items-center gap-2">
          <FileText size={14} className="text-[#7C3AED]" />
          Prepare the SOW
        </h3>
        <p className="text-[#64748B] text-xs mt-0.5">
          Capture scope and pricing notes. Real SOW generation lands in a future sprint —
          for now, sending sets up a stubbed signature URL.
        </p>
      </div>

      <Textarea
        value={scopeNotes}
        onChange={(e) => setScopeNotes(e.target.value)}
        placeholder="Final scope confirmation, pricing notes, anything the client should know."
        rows={6}
        className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] resize-none text-sm"
      />

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={() => onSendSow(scopeNotes)}
          disabled={pending}
          className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold w-full"
        >
          <Send size={13} className="mr-1.5" />
          Send for signature
        </Button>
        {!showCancel ? (
          <button
            type="button"
            onClick={() => setShowCancel(true)}
            className="text-[#94A3B8] hover:text-[#B91C1C] text-xs"
          >
            Cancel engagement
          </button>
        ) : (
          <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (logged in lifecycle)"
              rows={2}
              className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#F87171] text-xs resize-none"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => onCancel(cancelReason)}
                disabled={!cancelReason.trim() || pending}
                size="sm"
                className="bg-[#F87171] text-white hover:bg-[#EF4444] flex-1"
              >
                <XCircle size={12} className="mr-1.5" />
                Confirm cancellation
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowCancel(false)}
              >
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Awaiting signature panel ───────────────────────────────────────────────

function AwaitingSignaturePanel({
  pending,
  onMarkSigned,
  onReturnToReview,
  onCancel,
}: {
  pending: boolean
  onMarkSigned: () => void
  onReturnToReview: (notes: string) => void
  onCancel: (reason: string) => void
}) {
  const [revisionNotes, setRevisionNotes] = useState('')
  const [showReturn, setShowReturn] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
      <div>
        <h3 className="font-heading font-semibold text-[#0F172A] text-sm flex items-center gap-2">
          <Send size={14} className="text-[#7C3AED]" />
          Awaiting client signature
        </h3>
        <p className="text-[#64748B] text-xs mt-0.5">
          The SOW is out. Real e-signature webhook isn&apos;t wired yet — when the client
          signs, mark it manually here.
        </p>
      </div>

      <Button
        type="button"
        onClick={onMarkSigned}
        disabled={pending}
        className="bg-[#10B981] text-white hover:bg-[#059669] font-semibold w-full"
      >
        <CheckCircle2 size={13} className="mr-1.5" />
        Mark as signed
      </Button>

      {!showReturn && !showCancel && (
        <div className="flex justify-between text-xs">
          <button
            type="button"
            onClick={() => setShowReturn(true)}
            className="text-[#7C3AED] hover:text-[#8B5CF6]"
          >
            <Undo2 size={11} className="inline -mt-0.5 mr-1" />
            Return to review
          </button>
          <button
            type="button"
            onClick={() => setShowCancel(true)}
            className="text-[#94A3B8] hover:text-[#B91C1C]"
          >
            Cancel
          </button>
        </div>
      )}

      {showReturn && (
        <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
          <Textarea
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            placeholder="What revisions did the client request?"
            rows={3}
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] text-xs resize-none"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => onReturnToReview(revisionNotes)}
              disabled={!revisionNotes.trim() || pending}
              size="sm"
              variant="default"
              className="bg-[#BA7517] text-white hover:bg-[#a16614] flex-1"
            >
              Return to review
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowReturn(false)}>
              Back
            </Button>
          </div>
        </div>
      )}

      {showCancel && (
        <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason for cancellation"
            rows={2}
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#F87171] text-xs resize-none"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => onCancel(cancelReason)}
              disabled={!cancelReason.trim() || pending}
              size="sm"
              className="bg-[#F87171] text-white hover:bg-[#EF4444] flex-1"
            >
              Confirm cancellation
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowCancel(false)}>
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Awaiting kickoff panel ─────────────────────────────────────────────────

function AwaitingKickoffPanel({
  pending,
  scheduledKickoffAt,
  onSchedule,
  onCompleteKickoff,
  onCancel,
}: {
  pending: boolean
  scheduledKickoffAt: string | null
  onSchedule: (scheduled_at: string) => void
  onCompleteKickoff: () => void
  onCancel: (reason: string) => void
}) {
  const [datetime, setDatetime] = useState('')
  const [showCancel, setShowCancel] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const kickoffInPast =
    scheduledKickoffAt && new Date(scheduledKickoffAt) <= new Date()

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
      <div>
        <h3 className="font-heading font-semibold text-[#0F172A] text-sm flex items-center gap-2">
          <Calendar size={14} className="text-[#06B6D4]" />
          Schedule and run kickoff
        </h3>
        <p className="text-[#64748B] text-xs mt-0.5">
          Capture the scheduled date, then complete the kickoff after the call.
        </p>
      </div>

      {scheduledKickoffAt && (
        <div className="bg-[#06B6D4]/5 border border-[#06B6D4]/20 rounded-lg p-3">
          <p className="text-[#0891B2] text-xs font-medium uppercase tracking-widest">
            Scheduled
          </p>
          <p className="text-[#0F172A] text-sm font-mono-brand mt-0.5">
            {new Date(scheduledKickoffAt).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-xs font-medium text-[#64748B]">
          {scheduledKickoffAt ? 'Update kickoff date' : 'Set kickoff date'}
        </label>
        <Input
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED]"
        />
        <Button
          type="button"
          onClick={() => onSchedule(new Date(datetime).toISOString())}
          disabled={!datetime || pending}
          size="sm"
          variant="default"
          className="w-full bg-[#06B6D4] text-white hover:bg-[#0891B2] font-semibold"
        >
          {scheduledKickoffAt ? 'Update schedule' : 'Save kickoff date'}
        </Button>
      </div>

      <div className="pt-3 border-t border-[#E2E8F0]">
        <Button
          type="button"
          onClick={onCompleteKickoff}
          disabled={!kickoffInPast || pending}
          title={
            !scheduledKickoffAt
              ? 'Schedule kickoff first'
              : !kickoffInPast
                ? 'Available after the scheduled kickoff time has passed'
                : 'Complete the kickoff and activate the engagement'
          }
          className="bg-[#10B981] text-white hover:bg-[#059669] font-semibold w-full"
        >
          Complete kickoff
        </Button>
      </div>

      {!showCancel ? (
        <button
          type="button"
          onClick={() => setShowCancel(true)}
          className="text-[#94A3B8] hover:text-[#B91C1C] text-xs block w-full text-center"
        >
          Cancel engagement
        </button>
      ) : (
        <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason for cancellation"
            rows={2}
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#F87171] text-xs resize-none"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => onCancel(cancelReason)}
              disabled={!cancelReason.trim() || pending}
              size="sm"
              className="bg-[#F87171] text-white hover:bg-[#EF4444] flex-1"
            >
              Confirm cancellation
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowCancel(false)}>
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Active panel (read-only redirect) ──────────────────────────────────────

function ActivePanel({ engagementId }: { engagementId: string }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
      <h3 className="font-heading font-semibold text-[#0F172A] text-sm mb-2">
        Engagement is active
      </h3>
      <p className="text-[#64748B] text-xs mb-3">
        Day-to-day delivery happens in the dashboard view, not here.
      </p>
      <Link
        href={`/dashboard/engagements/${engagementId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#7C3AED] text-xs font-semibold hover:underline"
      >
        Open the client view →
      </Link>
    </div>
  )
}

// ─── Read-only panel (cancelled / completed) ───────────────────────────────

function ReadOnlyPanel({
  status,
  engagementId,
}: {
  status: 'cancelled' | 'completed'
  engagementId: string
}) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
      <h3 className="font-heading font-semibold text-[#0F172A] text-sm mb-2">
        {status === 'cancelled' ? 'Engagement was cancelled' : 'Engagement completed'}
      </h3>
      <p className="text-[#64748B] text-xs mb-3">
        Lifecycle is preserved for audit. No further actions available.
      </p>
      <Link
        href={`/dashboard/engagements/${engagementId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#7C3AED] text-xs font-semibold hover:underline"
      >
        Open the client view →
      </Link>
    </div>
  )
}

// ─── Legacy states ─────────────────────────────────────────────────────────

function LegacyPanel({
  status,
  engagementId,
}: {
  status: 'intake' | 'scoping'
  engagementId: string
}) {
  return (
    <div className="bg-white border border-dashed border-[#E2E8F0] rounded-xl p-5">
      <h3 className="font-heading font-semibold text-[#0F172A] text-sm mb-1">
        Legacy state ({status})
      </h3>
      <p className="text-[#64748B] text-xs mb-3">
        This engagement predates the lifecycle redesign. Continue managing it via the dashboard
        view; the new queue picks up engagements created after migration 008.
      </p>
      <Link
        href={`/dashboard/engagements/${engagementId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#7C3AED] text-xs font-semibold hover:underline"
      >
        Open the client view →
      </Link>
    </div>
  )
}
