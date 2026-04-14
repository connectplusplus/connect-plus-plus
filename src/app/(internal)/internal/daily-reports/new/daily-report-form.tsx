'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { submitDailyReport } from '../../actions'
import { getHealthLabel, getHealthColor } from '@/lib/types'
import { Loader2, CheckCircle2, FileText } from 'lucide-react'

interface EngagementOption {
  id: string
  title: string
  status: string
  companies: { name: string } | null
}

interface DailyReportFormProps {
  engagements: EngagementOption[]
}

export function DailyReportForm({ engagements }: DailyReportFormProps) {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const [engagementId, setEngagementId] = useState('')
  const [reportDate, setReportDate] = useState(today)
  const [accomplishments, setAccomplishments] = useState('')
  const [blockers, setBlockers] = useState('')
  const [planTomorrow, setPlanTomorrow] = useState('')
  const [healthScore, setHealthScore] = useState(80)
  const [aiVelocityNote, setAiVelocityNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ date: string; engagement: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!engagementId) {
      setError('Please select an engagement.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    const result = await submitDailyReport({
      engagement_id: engagementId,
      report_date: reportDate,
      accomplishments,
      blockers: blockers.trim() || null,
      plan_tomorrow: planTomorrow,
      health_score: healthScore,
      ai_velocity_note: aiVelocityNote.trim() || null,
    })

    if (result.success) {
      const eng = engagements.find((e) => e.id === engagementId)
      const engName = eng ? `${eng.companies?.name ?? ''} — ${eng.title}` : 'Engagement'
      setSuccess({ date: reportDate, engagement: engName })

      // Reset form but keep engagement selected
      setAccomplishments('')
      setBlockers('')
      setPlanTomorrow('')
      setHealthScore(80)
      setAiVelocityNote('')
      setReportDate(today)
    } else {
      setError(result.error ?? 'Failed to submit report.')
    }

    setLoading(false)
  }

  const healthLabel = getHealthLabel(healthScore)
  const healthColor = getHealthColor(healthScore)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading font-bold text-2xl text-[#0F172A] mb-1">New Daily Report</h2>
        <p className="text-[#64748B] text-sm">
          This report will be visible to the client immediately after submission.
        </p>
      </div>

      {/* Success block */}
      {success && (
        <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl p-5 flex items-start gap-3">
          <CheckCircle2 size={20} className="text-[#10B981] shrink-0 mt-0.5" />
          <div>
            <p className="text-[#0F172A] text-sm font-semibold">Report published. Your client can see it now.</p>
            <p className="text-[#64748B] text-xs mt-1">
              {new Date(success.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} — {success.engagement}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-5">

        {/* Engagement selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0F172A]">
            Engagement <span className="text-[#EF4444]">*</span>
          </label>
          {engagements.length === 0 ? (
            <p className="text-[#64748B] text-sm bg-[#F1F5F9] rounded-lg p-3">
              No engagements assigned to you. Contact your delivery lead.
            </p>
          ) : (
            <select
              value={engagementId}
              onChange={(e) => setEngagementId(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]/30 transition-colors appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              <option value="">Select an engagement...</option>
              {engagements.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.companies?.name ? `${eng.companies.name} — ` : ''}{eng.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Report date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0F172A]">
            Report Date <span className="text-[#EF4444]">*</span>
          </label>
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            max={today}
            min={yesterday}
            required
            className="w-full h-10 px-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] text-sm focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]/30 transition-colors"
          />
        </div>

        {/* Accomplishments */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0F172A]">
            What we accomplished today <span className="text-[#EF4444]">*</span>
          </label>
          <Textarea
            value={accomplishments}
            onChange={(e) => setAccomplishments(e.target.value)}
            placeholder="Completed the auth middleware refactor, merged 3 PRs, resolved the Hertz API integration blocker."
            required
            rows={4}
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#7C3AED] resize-none"
          />
        </div>

        {/* Blockers */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0F172A]">
            Blockers <span className="text-[#94A3B8] text-xs font-normal">(optional — leave empty for &quot;None&quot;)</span>
          </label>
          <Textarea
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            placeholder="Waiting on client API credentials for the payment gateway integration."
            rows={3}
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#7C3AED] resize-none"
          />
        </div>

        {/* Plan for tomorrow */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0F172A]">
            Plan for tomorrow <span className="text-[#EF4444]">*</span>
          </label>
          <Textarea
            value={planTomorrow}
            onChange={(e) => setPlanTomorrow(e.target.value)}
            placeholder="Begin milestone 3 testing, pair with Marcus on the caching layer."
            required
            rows={3}
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#7C3AED] resize-none"
          />
        </div>

        {/* Health score slider */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[#0F172A]">
            Health Score
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={100}
              value={healthScore}
              onChange={(e) => setHealthScore(Number(e.target.value))}
              className="flex-1 h-2 bg-[#E2E8F0] rounded-full appearance-none cursor-pointer accent-[#7C3AED]"
            />
            <div className="flex items-center gap-2 shrink-0 w-32 justify-end">
              <span className="font-mono-brand font-bold text-lg" style={{ color: healthColor }}>
                {healthScore}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: healthColor, backgroundColor: `${healthColor}15` }}>
                {healthLabel}
              </span>
            </div>
          </div>
        </div>

        {/* AI velocity note (internal only) */}
        <div className="space-y-2 pt-4 border-t border-[#E2E8F0]">
          <label className="block text-sm font-medium text-[#0F172A]">
            AI Velocity Note
            <span className="ml-2 text-xs font-normal text-[#94A3B8] bg-[#F1F5F9] rounded px-1.5 py-0.5">
              Internal only — not visible to client
            </span>
          </label>
          <Textarea
            value={aiVelocityNote}
            onChange={(e) => setAiVelocityNote(e.target.value)}
            placeholder="Team used Cursor for the API scaffold — saved ~4 hours. Marcus is exploring Claude for code review automation."
            rows={2}
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#7C3AED] resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 text-[#EF4444] text-sm bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-3 py-3">
            <FileText size={15} className="shrink-0 mt-0.5" strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading || engagements.length === 0}
          className="w-full bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold h-11"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Publishing report...
            </>
          ) : (
            'Publish Daily Report'
          )}
        </Button>
      </form>
    </div>
  )
}
