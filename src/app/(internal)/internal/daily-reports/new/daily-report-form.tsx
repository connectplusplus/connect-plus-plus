'use client'

import { useState, useEffect, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { generateReport, publishDailyReport } from '../../actions'
import { HealthScoreDisplay } from '@/components/internal/health-score-display'
import { SignalsPanel } from '@/components/internal/signals-panel'
import type { GeneratedReport } from '@/lib/types'
import { Loader2, CheckCircle2, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react'

interface EngagementOption {
  id: string
  title: string
  status: string
  has_todays_report: boolean
  companies: { name: string } | null
}

interface DailyReportFormProps {
  engagements: EngagementOption[]
}

export function DailyReportForm({ engagements }: DailyReportFormProps) {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('engagement')
  const today = new Date().toISOString().split('T')[0]

  const [engagementId, setEngagementId] = useState(preselectedId ?? '')
  const [generating, setGenerating] = useState(false)
  const [, startTransition] = useTransition()

  const [report, setReport] = useState<GeneratedReport | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  const [accomplishments, setAccomplishments] = useState('')
  const [blockers, setBlockers] = useState('')
  const [planTomorrow, setPlanTomorrow] = useState('')
  const [healthScore, setHealthScore] = useState(80)
  const [healthReasoning, setHealthReasoning] = useState('')
  const [aiVelocityNote, setAiVelocityNote] = useState('')
  const [pmNotes, setPmNotes] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set())

  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ engagement: string; date: string } | null>(null)

  const pendingEngagements = engagements.filter((e) => !e.has_todays_report && e.id !== engagementId)

  useEffect(() => {
    if (engagementId && !report && !generating) {
      handleGenerate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId])

  async function handleGenerate() {
    if (!engagementId) return
    setGenerating(true)
    setError(null)
    setReport(null)
    setSuccess(null)
    setEditedFields(new Set())

    startTransition(async () => {
      const result = await generateReport(engagementId)
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        const r = result.data
        setReport(r)
        setIsFallback(r.fallback ?? false)
        setAccomplishments(r.draft.accomplishments)
        setBlockers(r.draft.blockers ?? '')
        setPlanTomorrow(r.draft.plan_tomorrow)
        setHealthScore(r.draft.health_score)
        setHealthReasoning(r.draft.health_reasoning)
        setAiVelocityNote(r.draft.ai_velocity_note ?? '')
      }
      setGenerating(false)
    })
  }

  function markEdited(field: string) {
    setEditedFields((prev) => new Set(prev).add(field))
  }

  async function handlePublish() {
    if (!engagementId) return
    setPublishing(true)
    setError(null)

    const result = await publishDailyReport({
      engagement_id: engagementId,
      report_date: today,
      accomplishments,
      blockers: blockers.trim() || null,
      plan_tomorrow: planTomorrow,
      health_score: healthScore,
      ai_velocity_note: aiVelocityNote.trim() || null,
      ai_reasoning: healthReasoning,
      baseline_score_computed: report?.baselineScore ?? healthScore,
      ai_score_suggested: report?.draft.health_score ?? healthScore,
      pm_override_reason: overrideReason || undefined,
      pm_notes: pmNotes.trim() || null,
    })

    if (result.success) {
      const eng = engagements.find((e) => e.id === engagementId)
      setSuccess({
        engagement: `${eng?.companies?.name ? eng.companies.name + ' — ' : ''}${eng?.title ?? 'Engagement'}`,
        date: today,
      })
      setReport(null)
    } else {
      setError(result.error ?? 'Failed to publish report.')
    }
    setPublishing(false)
  }

  function handleNextEngagement() {
    if (pendingEngagements.length > 0) {
      setSuccess(null)
      setEngagementId(pendingEngagements[0].id)
      setReport(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-2xl text-[#2D2B27] mb-1">Daily Report</h2>
        <p className="text-[#8B8781] text-sm">AI generates the draft. You review and publish.</p>
      </div>

      {/* Engagement selector */}
      <select
        value={engagementId}
        onChange={(e) => { setEngagementId(e.target.value); setReport(null); setSuccess(null) }}
        className="w-full h-10 px-3 rounded-lg bg-[#EFEDE8] border border-[#E0DDD6] text-[#2D2B27] text-sm focus:border-[#6B8F5E] focus:outline-none transition-colors appearance-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23B0ADA6' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
      >
        <option value="">Select an engagement...</option>
        {engagements.map((eng) => (
          <option key={eng.id} value={eng.id}>
            {eng.has_todays_report ? '✓ ' : '⚡ '}{eng.companies?.name ? `${eng.companies.name} — ` : ''}{eng.title}
          </option>
        ))}
      </select>

      {/* Fallback warning */}
      {isFallback && (
        <div className="flex items-start gap-2 text-[#F59E0B] text-sm bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg px-4 py-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">AI generation failed — manual entry mode</p>
            <p className="text-xs text-[#8B8781] mt-0.5">Health score computed from metrics. Fill in the text fields manually.</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {generating && (
        <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-8 text-center">
          <Loader2 size={28} className="text-[#6B8F5E] animate-spin mx-auto mb-3" />
          <h3 className="font-heading font-semibold text-[#2D2B27] text-base mb-1">Generating report...</h3>
          <p className="text-[#8B8781] text-xs">Analyzing engagement signals and drafting your report</p>
        </div>
      )}

      {/* Success state */}
      {success && (
        <div className="space-y-4">
          <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl p-5 flex items-start gap-3">
            <CheckCircle2 size={20} className="text-[#10B981] shrink-0 mt-0.5" />
            <div>
              <p className="text-[#2D2B27] text-sm font-semibold">Report published. Your client can see it now.</p>
              <p className="text-[#8B8781] text-xs mt-1">
                {new Date(success.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} — {success.engagement}
              </p>
            </div>
          </div>
          {pendingEngagements.length > 0 && (
            <button
              onClick={handleNextEngagement}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#6B8F5E] text-white font-semibold text-sm rounded-lg hover:bg-[#7DA06E] transition-colors"
            >
              {pendingEngagements.length} more engagement{pendingEngagements.length > 1 ? 's' : ''}{' '}still need today&apos;s report
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Report review form */}
      {report && !success && !generating && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-5 space-y-5">
              {[
                { key: 'accomplishments', label: 'What we accomplished', value: accomplishments, setter: setAccomplishments, rows: 4 },
                { key: 'blockers', label: 'Blockers', value: blockers, setter: setBlockers, rows: 3, hint: '(leave empty for "None")' },
                { key: 'plan_tomorrow', label: 'Plan for tomorrow', value: planTomorrow, setter: setPlanTomorrow, rows: 3 },
              ].map((field) => (
                <div key={field.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[#2D2B27]">
                      {field.label}
                      {field.hint && <span className="text-[#B0ADA6] text-xs font-normal ml-1">{field.hint}</span>}
                    </label>
                    {!editedFields.has(field.key) && field.value && (
                      <span className="text-[10px] text-[#6B8F5E] bg-[#6B8F5E]/10 rounded px-1.5 py-0.5 flex items-center gap-1">
                        <Sparkles size={9} /> AI generated
                      </span>
                    )}
                  </div>
                  <Textarea
                    value={field.value}
                    onChange={(e) => { field.setter(e.target.value); markEdited(field.key) }}
                    rows={field.rows}
                    className="bg-[#EFEDE8] border-[#E0DDD6] text-[#2D2B27] placeholder:text-[#B0ADA6] focus:border-[#6B8F5E] resize-none"
                  />
                </div>
              ))}

              <div className="space-y-2 pt-4 border-t border-[#E0DDD6]">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#2D2B27]">
                    AI Velocity Note
                    <span className="ml-2 text-[10px] font-normal text-[#B0ADA6] bg-[#EFEDE8] rounded px-1.5 py-0.5">Internal only</span>
                  </label>
                  {!editedFields.has('ai_velocity_note') && aiVelocityNote && (
                    <span className="text-[10px] text-[#6B8F5E] bg-[#6B8F5E]/10 rounded px-1.5 py-0.5 flex items-center gap-1">
                      <Sparkles size={9} /> AI generated
                    </span>
                  )}
                </div>
                <Textarea
                  value={aiVelocityNote}
                  onChange={(e) => { setAiVelocityNote(e.target.value); markEdited('ai_velocity_note') }}
                  rows={2}
                  className="bg-[#EFEDE8] border-[#E0DDD6] text-[#2D2B27] placeholder:text-[#B0ADA6] focus:border-[#6B8F5E] resize-none"
                />
              </div>
            </div>

            {/* PM Notes — human in the loop, at the end, distinct accent */}
            <div className="bg-[#6B8F5E]/5 border-2 border-[#6B8F5E]/20 rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 bg-[#6B8F5E] rounded-full" />
                <label className="text-sm font-semibold text-[#2D2B27]">Your Notes to the Client</label>
              </div>
              <Textarea
                value={pmNotes}
                onChange={(e) => setPmNotes(e.target.value)}
                placeholder="Add your own context — things the AI can't know. Client calls, decisions made, relationship context, or anything you want the client to hear directly from you."
                rows={3}
                className="bg-white border-[#6B8F5E]/20 text-[#2D2B27] placeholder:text-[#B0ADA6] focus:border-[#6B8F5E] resize-none"
              />
              <p className="text-[#8B8781] text-[10px]">This is your voice — it goes directly to the client alongside the AI-generated report.</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-[#EF4444] text-sm bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-4 py-3">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              onClick={handlePublish}
              disabled={publishing || !accomplishments.trim() || !planTomorrow.trim()}
              className="w-full bg-[#6B8F5E] text-white hover:bg-[#7DA06E] font-semibold h-12 text-base"
            >
              {publishing ? <><Loader2 size={16} className="mr-2 animate-spin" />Publishing...</> : 'Publish to Client'}
            </Button>
          </div>

          <div className="space-y-4">
            <HealthScoreDisplay
              score={healthScore}
              reasoning={healthReasoning}
              baselineScore={report.baselineScore}
              onScoreChange={(score, reason) => { setHealthScore(score); if (reason) setOverrideReason(reason) }}
            />
            <SignalsPanel signals={report.signals} />
          </div>
        </div>
      )}
    </div>
  )
}
