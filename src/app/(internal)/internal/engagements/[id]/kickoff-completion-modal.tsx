'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Plus, Rocket, X } from 'lucide-react'
import {
  getKickoffPrefill,
  type ActivationChecklistItem,
  type CompleteKickoffInput,
} from './kickoff-actions'
import type { ReportCadence, ReportTone } from '@/lib/types'

const DEFAULT_CHECKLIST: Omit<ActivationChecklistItem, 'done' | 'notes'>[] = [
  { key: 'team_allocated', label: 'Engineering team allocated in Connect' },
  { key: 'repo_access', label: 'Repo access granted' },
  { key: 'cicd_hooks', label: 'CI/CD hooks configured' },
  { key: 'slack_channel', label: 'Slack channel created' },
  { key: 'first_sprint', label: 'First sprint scheduled' },
]

interface Props {
  engagementId: string
  scheduledKickoffAt: string | null
  onClose: () => void
  onSubmit: (input: CompleteKickoffInput) => Promise<{ ok?: true; error?: string }>
}

interface ListInputProps {
  values: string[]
  onChange: (next: string[]) => void
  placeholder: string
}

function ListInput({ values, onChange, placeholder }: ListInputProps) {
  const [draft, setDraft] = useState('')
  function add() {
    const v = draft.trim()
    if (!v) return
    onChange([...values, v])
    setDraft('')
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border bg-[#F1F5F9] text-[#0F172A] border-[#E2E8F0]"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="text-[#94A3B8] hover:text-[#EF4444]"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] h-8 text-xs"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="text-[#7C3AED] text-xs font-semibold px-2 h-8 rounded hover:bg-[#7C3AED]/5 disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  )
}

export function KickoffCompletionModal({
  engagementId,
  scheduledKickoffAt,
  onClose,
  onSubmit,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1
  const [kickoffNotes, setKickoffNotes] = useState('')
  const [internalAttendees, setInternalAttendees] = useState<string[]>([])
  const [clientAttendees, setClientAttendees] = useState<string[]>([])

  // Step 2 — pre-filled from server after mount
  const [successDefinition, setSuccessDefinition] = useState('')
  const [criticalRequirements, setCriticalRequirements] = useState<string[]>([])
  const [riskAreas, setRiskAreas] = useState<string[]>([])
  const [weights, setWeights] = useState({
    timeline: 8,
    quality: 10,
    scope: 7,
    communication: 6,
    velocity: 7,
  })
  const [alertThresholds, setAlertThresholds] = useState({ critical: 60, warning: 75 })
  const [cadence, setCadence] = useState<ReportCadence>('every_2_days')
  const [tone, setTone] = useState<ReportTone>('technical')
  const [reviewWindow, setReviewWindow] = useState(4)
  const [prefilled, setPrefilled] = useState(false)

  // Step 3
  const [checklist, setChecklist] = useState<ActivationChecklistItem[]>(
    DEFAULT_CHECKLIST.map((c) => ({ ...c, done: false, notes: '' }))
  )

  useEffect(() => {
    let cancelled = false
    getKickoffPrefill(engagementId).then((prefill) => {
      if (cancelled) return
      const tplDefaults = prefill.template_defaults
      const intake = prefill.client_intake_preferences
      // Layered prefill: template defaults are the base; client intake
      // preferences win when present (those are what the client actually
      // asked for in the agent step at intake).
      if (tplDefaults?.priority_weights || intake?.weights) {
        setWeights({
          timeline:
            intake?.weights?.timeline ?? tplDefaults?.priority_weights?.timeline ?? 8,
          quality:
            intake?.weights?.quality ?? tplDefaults?.priority_weights?.quality ?? 10,
          scope: intake?.weights?.scope ?? tplDefaults?.priority_weights?.scope ?? 7,
          communication:
            intake?.weights?.communication ??
            tplDefaults?.priority_weights?.communication ??
            6,
          velocity:
            intake?.weights?.velocity ?? tplDefaults?.priority_weights?.velocity ?? 7,
        })
      }
      if (tplDefaults?.alert_thresholds || intake?.alerts) {
        setAlertThresholds({
          critical:
            intake?.alerts?.criticalThreshold ??
            tplDefaults?.alert_thresholds?.critical ??
            60,
          warning: tplDefaults?.alert_thresholds?.warning ?? 75,
        })
      }
      if (tplDefaults?.report_cadence || intake?.cadence) {
        setCadence(intake?.cadence ?? tplDefaults?.report_cadence ?? 'every_2_days')
      }
      if (tplDefaults?.report_tone || intake?.tone) {
        setTone(intake?.tone ?? tplDefaults?.report_tone ?? 'technical')
      }
      if (tplDefaults?.pm_review_window_hours) {
        setReviewWindow(tplDefaults.pm_review_window_hours)
      }
      if (intake?.success_definition) setSuccessDefinition(intake.success_definition)
      if (intake?.critical_requirements?.length)
        setCriticalRequirements(intake.critical_requirements)
      if (intake?.risk_areas?.length) setRiskAreas(intake.risk_areas)
      setPrefilled(true)
    })
    return () => {
      cancelled = true
    }
  }, [engagementId])

  function patchChecklist(idx: number, p: Partial<ActivationChecklistItem>) {
    setChecklist((prev) => prev.map((c, i) => (i === idx ? { ...c, ...p } : c)))
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    const result = await onSubmit({
      engagement_id: engagementId,
      kickoff_notes: kickoffNotes,
      kickoff_attendees_internal: internalAttendees,
      kickoff_attendees_client: clientAttendees,
      agent_config: {
        success_definition: successDefinition,
        critical_requirements: criticalRequirements,
        risk_areas: riskAreas,
        weights,
        alert_thresholds: alertThresholds,
        report_cadence: cadence,
        report_tone: tone,
        pm_review_window_hours: reviewWindow,
      },
      activation_checklist: checklist,
    })
    setSubmitting(false)
    if (result.error) setError(result.error)
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full shadow-2xl my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-[#0F172A] text-base">
              Complete kickoff
            </h3>
            <p className="text-[#94A3B8] text-xs">
              Step {step} of 4 ·{' '}
              {step === 1
                ? 'Confirm kickoff'
                : step === 2
                  ? 'Agent configuration'
                  : step === 3
                    ? 'Activation checklist'
                    : 'Review and activate'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#0F172A] p-1"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <>
              {scheduledKickoffAt && (
                <p className="text-xs text-[#64748B]">
                  Scheduled:{' '}
                  <span className="font-mono-brand text-[#0F172A]">
                    {new Date(scheduledKickoffAt).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </p>
              )}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#0F172A]">
                  Kickoff notes
                </label>
                <Textarea
                  value={kickoffNotes}
                  onChange={(e) => setKickoffNotes(e.target.value)}
                  placeholder="What was discussed? Any scope confirmations or open items?"
                  rows={4}
                  className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#0F172A]">
                  Attendees from FullStack
                </label>
                <ListInput
                  values={internalAttendees}
                  onChange={setInternalAttendees}
                  placeholder="Add a teammate"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#0F172A]">
                  Attendees from client
                </label>
                <ListInput
                  values={clientAttendees}
                  onChange={setClientAttendees}
                  placeholder="Add a client attendee"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {!prefilled && (
                <p className="text-[#94A3B8] text-xs flex items-center gap-1.5">
                  <Loader2 size={11} className="animate-spin" /> Loading template defaults…
                </p>
              )}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#0F172A]">
                  Success definition
                </label>
                <Textarea
                  value={successDefinition}
                  onChange={(e) => setSuccessDefinition(e.target.value)}
                  placeholder="What does success look like for this engagement?"
                  rows={3}
                  className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#0F172A]">
                  Critical requirements
                </label>
                <ListInput
                  values={criticalRequirements}
                  onChange={setCriticalRequirements}
                  placeholder="Add a critical requirement"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#0F172A]">
                  Risk areas
                </label>
                <ListInput
                  values={riskAreas}
                  onChange={setRiskAreas}
                  placeholder="Add a risk area"
                />
              </div>
              <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
                <p className="text-sm font-medium text-[#0F172A]">Priority weights (1–10)</p>
                {(
                  ['timeline', 'quality', 'scope', 'communication', 'velocity'] as const
                ).map((k) => (
                  <div key={k} className="flex items-center gap-3">
                    <span className="text-[#0F172A] text-sm w-32 capitalize shrink-0">{k}</span>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={weights[k]}
                      onChange={(e) => setWeights({ ...weights, [k]: Number(e.target.value) })}
                      className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full appearance-none cursor-pointer accent-[#7C3AED]"
                    />
                    <span className="font-mono-brand text-sm font-semibold text-[#7C3AED] w-10 text-right">
                      {weights[k]}/10
                    </span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#64748B] text-xs">Critical threshold</label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={alertThresholds.critical}
                    onChange={(e) =>
                      setAlertThresholds({ ...alertThresholds, critical: Number(e.target.value) })
                    }
                    className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#64748B] text-xs">Warning threshold</label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={alertThresholds.warning}
                    onChange={(e) =>
                      setAlertThresholds({ ...alertThresholds, warning: Number(e.target.value) })
                    }
                    className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] font-mono-brand"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[#64748B] text-xs">Cadence</label>
                  <select
                    value={cadence}
                    onChange={(e) => setCadence(e.target.value as ReportCadence)}
                    className="w-full h-10 px-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#7C3AED] focus:outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="every_2_days">Every 2 days</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[#64748B] text-xs">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as ReportTone)}
                    className="w-full h-10 px-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#7C3AED] focus:outline-none"
                  >
                    <option value="balanced">Balanced</option>
                    <option value="technical">Technical</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-[#64748B] text-xs">
                Acknowledge the activation tasks. Items left unchecked will appear as a banner
                on the active engagement until you resolve them — they don&apos;t block
                activation.
              </p>
              <ul className="space-y-3">
                {checklist.map((c, i) => (
                  <li
                    key={c.key}
                    className="bg-white border border-[#E2E8F0] rounded-lg p-3"
                  >
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={c.done}
                        onChange={(e) => patchChecklist(i, { done: e.target.checked })}
                        className="accent-[#7C3AED] mt-0.5"
                      />
                      <span className="text-[#0F172A] text-sm font-medium">{c.label}</span>
                    </label>
                    <Input
                      value={c.notes ?? ''}
                      onChange={(e) => patchChecklist(i, { notes: e.target.value })}
                      placeholder="Notes (optional)"
                      className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] focus:border-[#7C3AED] h-7 text-xs mt-2"
                    />
                  </li>
                ))}
              </ul>
            </>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <Summary label="Kickoff notes">{kickoffNotes || <em className="text-[#94A3B8]">none</em>}</Summary>
              <Summary label="Attendees (FullStack)">
                {internalAttendees.length ? internalAttendees.join(', ') : <em className="text-[#94A3B8]">none</em>}
              </Summary>
              <Summary label="Attendees (client)">
                {clientAttendees.length ? clientAttendees.join(', ') : <em className="text-[#94A3B8]">none</em>}
              </Summary>
              <Summary label="Priority weights">
                <span className="font-mono-brand text-xs">
                  T{weights.timeline} · Q{weights.quality} · S{weights.scope} · C
                  {weights.communication} · V{weights.velocity}
                </span>
              </Summary>
              <Summary label="Alert thresholds">
                <span className="font-mono-brand text-xs">
                  critical {alertThresholds.critical} · warning {alertThresholds.warning}
                </span>
              </Summary>
              <Summary label="Cadence / tone">
                <span className="font-mono-brand text-xs">
                  {cadence} · {tone}
                </span>
              </Summary>
              <Summary
                label={`Activation checklist (${checklist.filter((c) => c.done).length}/${checklist.length})`}
              >
                <ul className="text-xs space-y-1">
                  {checklist.map((c) => (
                    <li key={c.key} className="flex items-center gap-1.5">
                      {c.done ? (
                        <CheckCircle2 size={12} className="text-[#10B981]" />
                      ) : (
                        <Plus size={12} className="text-[#94A3B8]" />
                      )}
                      <span className={c.done ? 'text-[#0F172A]' : 'text-[#94A3B8]'}>
                        {c.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </Summary>
            </div>
          )}

          {error && (
            <p className="text-[#B91C1C] text-sm bg-[#F87171]/10 border border-[#F87171]/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => (step === 1 ? onClose() : setStep((s) => (s - 1) as 1 | 2 | 3 | 4))}
            disabled={submitting}
          >
            <ChevronLeft size={13} className="mr-1" />
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          {step < 4 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
              className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold"
            >
              Next
              <ChevronRight size={13} className="ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#10B981] text-white hover:bg-[#059669] font-semibold"
            >
              {submitting ? (
                <Loader2 size={13} className="mr-2 animate-spin" />
              ) : (
                <Rocket size={13} className="mr-2" />
              )}
              Activate engagement
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function Summary({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-medium text-[#94A3B8] mb-0.5">
        {label}
      </p>
      <div className="text-[#0F172A] text-sm">{children}</div>
    </div>
  )
}
