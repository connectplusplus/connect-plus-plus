'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import type { IntakeSchema, OutcomeTemplate } from '@/lib/types'
import { CheckCircle2, Loader2, FileText, ExternalLink, Hexagon, Plus, X } from 'lucide-react'

// Map outcome slugs to their contract PDF filenames
const SLUG_TO_CONTRACT: Record<string, string> = {
  'mvp-sprint': '/FS-GBC-01-MVP_Sprint.pdf',
  'landing-page': '/FS-GBC-02-Landing_Page_and_Marketing_Site.pdf',
  'ai-feature-integration': '/FS-GBC-03-AI_Feature_Integration.pdf',
  'ai-native-experience': '/FS-GBC-04-AI-Native_Experience_Build.pdf',
  'automated-testing': '/FS-GBC-05-Automated_Testing_Setup.pdf',
  'cicd-pipeline': '/FS-GBC-06-CI_CD_Pipeline_Build.pdf',
  'agentic-workflows': '/FS-GBC-07-Agentic_Workflow_Builder.pdf',
  'performance-audit': '/FS-GBC-08-Performance_Audit_and_Fix.pdf',
  'ai-sdlc': '/FS-GBC-09-AI-SDLC_Implementation.pdf',
  'ai-ready-data': '/FS-GBC-10-AI-Ready_Data_Modernisation.pdf',
}

type FormStep = 'intake' | 'agent' | 'contract' | 'creating' | 'done'

interface IntakeFormProps {
  template: OutcomeTemplate
  companyId?: string
  userEmail?: string
}

export function IntakeForm({ template, companyId, userEmail }: IntakeFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<FormStep>('intake')
  const [responses, setResponses] = useState<Record<string, string | string[]>>({})
  const [email, setEmail] = useState(userEmail ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [multiselects, setMultiselects] = useState<Record<string, string[]>>({})

  // Agent configuration state
  const [agentSuccessDefinition, setAgentSuccessDefinition] = useState('')
  const [agentCriticalReqs, setAgentCriticalReqs] = useState<string[]>([])
  const [agentRiskAreas, setAgentRiskAreas] = useState<string[]>([])
  const [agentWeights, setAgentWeights] = useState({
    timeline: 8, quality: 7, scope: 9, communication: 5, velocity: 4,
  })
  const [agentAlerts, setAgentAlerts] = useState({
    critical_threshold: 60, milestone_slip_days: 3, pm_silence_hours: 48,
  })
  const [agentCadence, setAgentCadence] = useState<'daily' | 'every_2_days' | 'weekly'>('daily')
  const [agentTone, setAgentTone] = useState<'technical' | 'executive' | 'balanced'>('balanced')

  const schema: IntakeSchema = template.intake_schema
  const contractPdf = SLUG_TO_CONTRACT[template.slug]

  function handleTextChange(key: string, value: string) {
    setResponses((prev) => ({ ...prev, [key]: value }))
  }

  function handleSelectChange(key: string, value: string) {
    setResponses((prev) => ({ ...prev, [key]: value }))
  }

  function toggleMultiselect(key: string, option: string) {
    setMultiselects((prev) => {
      const current = prev[key] ?? []
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option]
      setResponses((r) => ({ ...r, [key]: updated }))
      return { ...prev, [key]: updated }
    })
  }

  function handleIntakeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    // Move to agent configuration step
    setStep('agent')
    document.getElementById('intake-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleAgentContinue() {
    setStep('contract')
    document.getElementById('intake-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleAgentSkip() {
    // Use all defaults
    setAgentSuccessDefinition('Successful delivery of all contracted scope on time and to quality standards.')
    setStep('contract')
    document.getElementById('intake-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleSign() {
    setStep('creating')
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Resolve company_id
      let resolvedCompanyId = companyId

      if (!resolvedCompanyId && user) {
        const { data: userRecord } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single()
        resolvedCompanyId = userRecord?.company_id ?? undefined
      }

      if (!resolvedCompanyId) {
        const domain = email.split('@')[1] ?? 'unknown.com'
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert({ name: domain })
          .select('id')
          .single()
        if (companyError) throw companyError
        resolvedCompanyId = company.id
      }

      // Create the engagement
      const { data: engagement, error: engError } = await supabase
        .from('engagements')
        .insert({
          company_id: resolvedCompanyId,
          template_id: template.id,
          mode: 'predefined_outcome',
          title: `${template.title}`,
          status: 'intake',
          intake_responses: {
            ...responses,
            contact_email: email || user?.email || '',
            contract_signed: true,
            contract_signed_at: new Date().toISOString(),
          },
        })
        .select('id')
        .single()

      if (engError) throw engError

      // Create initial system message
      if (engagement) {
        await supabase.from('messages').insert({
          engagement_id: engagement.id,
          sender_name: 'System',
          sender_role: 'system',
          content: `Engagement created. Contract signed for ${template.title}. Your AI-native PM will review your scope within 24 hours.`,
          is_system_message: true,
        })

        // Create Glassbox Agent configuration
        await supabase.from('agent_configs').insert({
          engagement_id: engagement.id,
          success_definition: agentSuccessDefinition || 'Successful delivery of all contracted scope on time and to quality standards.',
          critical_requirements: agentCriticalReqs.filter(Boolean),
          risk_areas: agentRiskAreas.filter(Boolean),
          weight_timeline: agentWeights.timeline,
          weight_quality: agentWeights.quality,
          weight_scope: agentWeights.scope,
          weight_communication: agentWeights.communication,
          weight_velocity: agentWeights.velocity,
          alert_critical_threshold: agentAlerts.critical_threshold,
          alert_milestone_slip_days: agentAlerts.milestone_slip_days,
          alert_pm_silence_hours: agentAlerts.pm_silence_hours,
          report_cadence: agentCadence,
          report_tone: agentTone,
          on_demand_enabled: true,
          configured_by: user?.id ?? null,
        })
      }

      setStep('done')

      // Redirect to engagement dashboard
      if (user && engagement) {
        setTimeout(() => {
          router.push(`/dashboard/engagements/${engagement.id}`)
        }, 2000)
      }
    } catch (err) {
      console.error('Engagement creation error:', err)
      setError('Something went wrong creating your engagement. Please try again.')
      setStep('contract')
    } finally {
      setLoading(false)
    }
  }

  // ── Done state ──────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="bg-[#FAFAF7] border border-[#6B8F5E]/30 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-[#6B8F5E]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-[#6B8F5E]" strokeWidth={1.5} />
        </div>
        <h3 className="font-heading font-semibold text-xl text-[#2D2B27] mb-2">
          Your engagement is live.
        </h3>
        <p className="text-[#8B8781] text-sm leading-relaxed">
          Contract signed. Your engagement dashboard is being set up — redirecting now...
        </p>
      </div>
    )
  }

  // ── Creating state ──────────────────────────────────────────────────────
  if (step === 'creating') {
    return (
      <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-8 text-center">
        <Loader2 size={32} className="text-[#6B8F5E] animate-spin mx-auto mb-4" />
        <h3 className="font-heading font-semibold text-lg text-[#2D2B27] mb-2">
          Setting up your engagement...
        </h3>
        <p className="text-[#8B8781] text-sm">
          Creating your project dashboard, assigning your PM, and preparing the workspace.
        </p>
      </div>
    )
  }

  // ── Agent configuration step ─────────────────────────────────────────────
  if (step === 'agent') {
    return (
      <div className="space-y-6">
        <div className="bg-[#6B8F5E]/5 border border-[#6B8F5E]/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#6B8F5E]/10 flex items-center justify-center">
              <Hexagon size={18} className="text-[#6B8F5E]" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-[#2D2B27] text-lg">Your Glassbox Agent</h3>
              <p className="text-[#8B8781] text-xs">Every engagement includes a dedicated AI agent that independently monitors your project and reports directly to you.</p>
            </div>
          </div>
        </div>

        <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-6 space-y-6">
          {/* Success definition */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#2D2B27]">
              What does success look like?
            </label>
            <p className="text-[#B0ADA6] text-xs">In your own words, describe what a successful outcome means for this project.</p>
            <Textarea
              value={agentSuccessDefinition}
              onChange={(e) => setAgentSuccessDefinition(e.target.value)}
              placeholder="E.g. 'A fully functional onboarding portal with SSO, deployed to production, handling 500+ users daily with 99.9% uptime.'"
              rows={3}
              className="bg-[#EFEDE8] border-[#E0DDD6] text-[#2D2B27] placeholder:text-[#B0ADA6] focus:border-[#6B8F5E] resize-none"
            />
          </div>

          {/* Critical requirements */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#2D2B27]">
              Critical requirements <span className="text-[#B0ADA6] text-xs font-normal">(up to 5)</span>
            </label>
            <p className="text-[#B0ADA6] text-xs">Non-negotiables. If any are at risk, the agent flags it immediately.</p>
            {agentCriticalReqs.map((req, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={req}
                  onChange={(e) => {
                    const updated = [...agentCriticalReqs]
                    updated[i] = e.target.value
                    setAgentCriticalReqs(updated)
                  }}
                  placeholder="E.g. 'HIPAA compliance at every milestone'"
                  className="bg-[#EFEDE8] border-[#E0DDD6] text-[#2D2B27] placeholder:text-[#B0ADA6] focus:border-[#6B8F5E] flex-1"
                />
                <button onClick={() => setAgentCriticalReqs(agentCriticalReqs.filter((_, j) => j !== i))} className="text-[#B0ADA6] hover:text-[#EF4444] transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
            {agentCriticalReqs.length < 5 && (
              <button
                onClick={() => setAgentCriticalReqs([...agentCriticalReqs, ''])}
                className="flex items-center gap-1 text-[#6B8F5E] text-xs font-medium hover:text-[#7DA06E] transition-colors"
              >
                <Plus size={12} /> Add requirement
              </button>
            )}
          </div>

          {/* Priority weights */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-[#2D2B27]">
              What matters most to you?
            </label>
            <p className="text-[#B0ADA6] text-xs">The agent weights its health score according to your priorities.</p>
            {[
              { key: 'timeline' as const, label: 'Timeline adherence' },
              { key: 'scope' as const, label: 'Scope fidelity' },
              { key: 'quality' as const, label: 'Code quality' },
              { key: 'communication' as const, label: 'Communication' },
              { key: 'velocity' as const, label: 'Team velocity' },
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <span className="text-[#2D2B27] text-sm w-40 shrink-0">{item.label}</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={agentWeights[item.key]}
                  onChange={(e) => setAgentWeights({ ...agentWeights, [item.key]: Number(e.target.value) })}
                  className="flex-1 h-1.5 bg-[#E0DDD6] rounded-full appearance-none cursor-pointer accent-[#6B8F5E]"
                />
                <span className="font-mono-brand text-sm font-semibold text-[#6B8F5E] w-10 text-right">{agentWeights[item.key]}/10</span>
              </div>
            ))}
          </div>

          {/* Alert thresholds */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-[#2D2B27]">Alert me immediately if...</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[#8B8781] text-xs">Health drops below</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={agentAlerts.critical_threshold}
                  onChange={(e) => setAgentAlerts({ ...agentAlerts, critical_threshold: Number(e.target.value) })}
                  className="bg-[#EFEDE8] border-[#E0DDD6] text-[#2D2B27] focus:border-[#6B8F5E]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#8B8781] text-xs">Milestone slips by (days)</label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={agentAlerts.milestone_slip_days}
                  onChange={(e) => setAgentAlerts({ ...agentAlerts, milestone_slip_days: Number(e.target.value) })}
                  className="bg-[#EFEDE8] border-[#E0DDD6] text-[#2D2B27] focus:border-[#6B8F5E]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[#8B8781] text-xs">PM silent for (hours)</label>
                <Input
                  type="number"
                  min={1}
                  max={168}
                  value={agentAlerts.pm_silence_hours}
                  onChange={(e) => setAgentAlerts({ ...agentAlerts, pm_silence_hours: Number(e.target.value) })}
                  className="bg-[#EFEDE8] border-[#E0DDD6] text-[#2D2B27] focus:border-[#6B8F5E]"
                />
              </div>
            </div>
          </div>

          {/* Report preferences */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-[#2D2B27]">Report preferences</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[#8B8781] text-xs">Cadence</label>
                <select
                  value={agentCadence}
                  onChange={(e) => setAgentCadence(e.target.value as typeof agentCadence)}
                  className="w-full h-10 px-3 rounded-lg bg-[#EFEDE8] border border-[#E0DDD6] text-[#2D2B27] text-sm focus:border-[#6B8F5E] focus:outline-none transition-colors appearance-none"
                >
                  <option value="daily">Daily</option>
                  <option value="every_2_days">Every 2 days</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[#8B8781] text-xs">Tone</label>
                <select
                  value={agentTone}
                  onChange={(e) => setAgentTone(e.target.value as typeof agentTone)}
                  className="w-full h-10 px-3 rounded-lg bg-[#EFEDE8] border border-[#E0DDD6] text-[#2D2B27] text-sm focus:border-[#6B8F5E] focus:outline-none transition-colors appearance-none"
                >
                  <option value="balanced">Balanced</option>
                  <option value="technical">Technical</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => { setStep('intake'); setError(null) }}
            className="text-[#8B8781] text-sm hover:text-[#2D2B27] transition-colors"
          >
            &larr; Back to intake
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAgentSkip}
              className="text-[#B0ADA6] text-sm hover:text-[#8B8781] transition-colors"
            >
              Use defaults
            </button>
            <Button
              onClick={handleAgentContinue}
              className="bg-[#6B8F5E] text-white hover:bg-[#7DA06E] font-semibold h-11 px-6"
            >
              Continue to Contract
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Contract signing step ───────────────────────────────────────────────
  if (step === 'contract') {
    return (
      <div className="space-y-4">
        <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl overflow-hidden">
          {/* Header with sign button */}
          <div className="flex items-center justify-between p-4 border-b border-[#E0DDD6] bg-[#F5F3EE]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#6B8F5E]/10 flex items-center justify-center">
                <FileText size={16} className="text-[#6B8F5E]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-[#2D2B27] text-sm">
                  Glassbox Service Contract
                </h3>
                <p className="text-[#B0ADA6] text-xs">
                  {template.title} — Review and sign to proceed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {contractPdf && (
                <a
                  href={contractPdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[#E0DDD6] text-[#8B8781] hover:text-[#2D2B27] hover:border-[#D4D0C8] text-sm transition-colors"
                >
                  <ExternalLink size={13} />
                  Open in new tab
                </a>
              )}
              <Button
                onClick={handleSign}
                disabled={loading}
                className="bg-[#6B8F5E] text-white hover:bg-[#7DA06E] font-semibold h-9 px-5 text-sm"
              >
                {loading ? (
                  <Loader2 size={14} className="mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 size={14} className="mr-2" />
                )}
                Sign and Start Engagement
              </Button>
            </div>
          </div>

          {/* Embedded PDF */}
          {contractPdf ? (
            <div style={{ height: '500px' }}>
              <iframe
                src={contractPdf}
                className="w-full h-full border-0"
                title={`Glassbox Contract — ${template.title}`}
              />
            </div>
          ) : (
            <div className="p-8 text-center text-[#B0ADA6] text-sm">
              Contract document is being prepared. You can proceed to sign.
            </div>
          )}
        </div>

        {error && (
          <p className="text-[#F87171] text-sm bg-[#F87171]/10 border border-[#F87171]/20 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <button
          onClick={() => setStep('intake')}
          className="text-[#8B8781] text-sm hover:text-[#2D2B27] transition-colors"
        >
          &larr; Back to intake form
        </button>
      </div>
    )
  }

  // ── Intake form step ────────────────────────────────────────────────────
  return (
    <form onSubmit={handleIntakeSubmit} className="space-y-6">
      <div>
        <h3 className="font-heading font-semibold text-lg text-[#2D2B27] mb-1">
          Project Intake
        </h3>
        <p className="text-[#8B8781] text-sm">
          Tell us about your project. The more context you share, the faster we can prepare
          your scope.
        </p>
      </div>

      {/* Dynamic fields from intake_schema */}
      {schema.fields.map((field) => (
        <div key={field.key} className="space-y-2">
          <label className="block text-sm font-medium text-[#2D2B27]">
            {field.label}
            {field.required && <span className="text-[#F87171] ml-1">*</span>}
          </label>

          {field.type === 'text' && (
            <Input
              value={(responses[field.key] as string) ?? ''}
              onChange={(e) => handleTextChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="bg-[#EFEDE8] border-[#E0DDD6] text-[#2D2B27] placeholder:text-[#B0ADA6] focus:border-[#6B8F5E] focus:ring-[#6B8F5E]/20"
            />
          )}

          {field.type === 'textarea' && (
            <Textarea
              value={(responses[field.key] as string) ?? ''}
              onChange={(e) => handleTextChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
              className="bg-[#EFEDE8] border-[#E0DDD6] text-[#2D2B27] placeholder:text-[#B0ADA6] focus:border-[#6B8F5E] focus:ring-[#6B8F5E]/20 resize-none"
            />
          )}

          {field.type === 'select' && field.options && (
            <select
              value={(responses[field.key] as string) ?? ''}
              onChange={(e) => handleSelectChange(field.key, e.target.value)}
              required={field.required}
              className="w-full h-10 px-3 rounded-lg bg-[#EFEDE8] border border-[#E0DDD6] text-[#2D2B27] text-sm focus:border-[#6B8F5E] focus:outline-none focus:ring-1 focus:ring-[#6B8F5E]/30 transition-colors appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              <option value="" disabled className="text-[#B0ADA6]">
                Select {field.label.toLowerCase()}
              </option>
              {field.options.map((opt) => (
                <option key={opt} value={opt} className="bg-[#EFEDE8] text-[#2D2B27]">
                  {opt}
                </option>
              ))}
            </select>
          )}

          {field.type === 'multiselect' && field.options && (
            <div className="flex flex-wrap gap-2">
              {field.options.map((opt) => {
                const selected = (multiselects[field.key] ?? []).includes(opt)
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleMultiselect(field.key, opt)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors duration-150 ${
                      selected
                        ? 'bg-[#6B8F5E]/10 border-[#6B8F5E] text-[#6B8F5E]'
                        : 'bg-[#EFEDE8] border-[#E0DDD6] text-[#8B8781] hover:border-[#D4D0C8]'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ))}

      {/* Contact email */}
      <div className="pt-4 border-t border-[#E0DDD6] space-y-2">
        <label className="block text-sm font-medium text-[#2D2B27]">
          Your email <span className="text-[#F87171] ml-1">*</span>
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          className="bg-[#EFEDE8] border-[#E0DDD6] text-[#2D2B27] placeholder:text-[#B0ADA6] focus:border-[#6B8F5E] focus:ring-[#6B8F5E]/20"
        />
        <p className="text-[#B0ADA6] text-xs">
          We&apos;ll use this to send your scope estimate and follow up with questions.
        </p>
      </div>

      {error && (
        <p className="text-[#F87171] text-sm bg-[#F87171]/10 border border-[#F87171]/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#6B8F5E] text-white hover:bg-[#7DA06E] font-semibold h-12 text-base"
      >
        Continue to Contract
      </Button>
    </form>
  )
}
