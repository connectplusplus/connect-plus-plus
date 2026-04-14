'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import type { IntakeSchema, OutcomeTemplate } from '@/lib/types'
import { CheckCircle2, Loader2, FileText, ExternalLink } from 'lucide-react'

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

type FormStep = 'intake' | 'contract' | 'creating' | 'done'

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
    // Move to contract signing step
    setStep('contract')
    // Scroll to top of form area
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
      <div className="bg-[#16161C] border border-[#A6F84C]/30 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-[#A6F84C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-[#A6F84C]" strokeWidth={1.5} />
        </div>
        <h3 className="font-heading font-semibold text-xl text-white mb-2">
          Your engagement is live.
        </h3>
        <p className="text-[#9CA3AF] text-sm leading-relaxed">
          Contract signed. Your engagement dashboard is being set up — redirecting now...
        </p>
      </div>
    )
  }

  // ── Creating state ──────────────────────────────────────────────────────
  if (step === 'creating') {
    return (
      <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-8 text-center">
        <Loader2 size={32} className="text-[#A6F84C] animate-spin mx-auto mb-4" />
        <h3 className="font-heading font-semibold text-lg text-white mb-2">
          Setting up your engagement...
        </h3>
        <p className="text-[#9CA3AF] text-sm">
          Creating your project dashboard, assigning your PM, and preparing the workspace.
        </p>
      </div>
    )
  }

  // ── Contract signing step ───────────────────────────────────────────────
  if (step === 'contract') {
    return (
      <div className="space-y-4">
        <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl overflow-hidden">
          {/* Header with sign button */}
          <div className="flex items-center justify-between p-4 border-b border-[#2A2A30] bg-[#111116]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#A6F84C]/10 flex items-center justify-center">
                <FileText size={16} className="text-[#A6F84C]" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-white text-sm">
                  Glassbox Service Contract
                </h3>
                <p className="text-[#6B7280] text-xs">
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
                  className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-[#2A2A30] text-[#9CA3AF] hover:text-white hover:border-[#3A3A42] text-sm transition-colors"
                >
                  <ExternalLink size={13} />
                  Open in new tab
                </a>
              )}
              <Button
                onClick={handleSign}
                disabled={loading}
                className="bg-[#A6F84C] text-[#0B0B0F] hover:bg-[#BCFF6E] font-semibold h-9 px-5 text-sm"
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
            <div className="p-8 text-center text-[#6B7280] text-sm">
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
          className="text-[#9CA3AF] text-sm hover:text-white transition-colors"
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
        <h3 className="font-heading font-semibold text-lg text-white mb-1">
          Project Intake
        </h3>
        <p className="text-[#9CA3AF] text-sm">
          Tell us about your project. The more context you share, the faster we can prepare
          your scope.
        </p>
      </div>

      {/* Dynamic fields from intake_schema */}
      {schema.fields.map((field) => (
        <div key={field.key} className="space-y-2">
          <label className="block text-sm font-medium text-white">
            {field.label}
            {field.required && <span className="text-[#F87171] ml-1">*</span>}
          </label>

          {field.type === 'text' && (
            <Input
              value={(responses[field.key] as string) ?? ''}
              onChange={(e) => handleTextChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="bg-[#1E1E24] border-[#2A2A30] text-white placeholder:text-[#6B7280] focus:border-[#A6F84C] focus:ring-[#A6F84C]/20"
            />
          )}

          {field.type === 'textarea' && (
            <Textarea
              value={(responses[field.key] as string) ?? ''}
              onChange={(e) => handleTextChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
              className="bg-[#1E1E24] border-[#2A2A30] text-white placeholder:text-[#6B7280] focus:border-[#A6F84C] focus:ring-[#A6F84C]/20 resize-none"
            />
          )}

          {field.type === 'select' && field.options && (
            <select
              value={(responses[field.key] as string) ?? ''}
              onChange={(e) => handleSelectChange(field.key, e.target.value)}
              required={field.required}
              className="w-full h-10 px-3 rounded-lg bg-[#1E1E24] border border-[#2A2A30] text-white text-sm focus:border-[#A6F84C] focus:outline-none focus:ring-1 focus:ring-[#A6F84C]/30 transition-colors appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              <option value="" disabled className="text-[#6B7280]">
                Select {field.label.toLowerCase()}
              </option>
              {field.options.map((opt) => (
                <option key={opt} value={opt} className="bg-[#1E1E24] text-white">
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
                        ? 'bg-[#A6F84C]/10 border-[#A6F84C] text-[#A6F84C]'
                        : 'bg-[#1E1E24] border-[#2A2A30] text-[#9CA3AF] hover:border-[#3A3A40]'
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
      <div className="pt-4 border-t border-[#2A2A30] space-y-2">
        <label className="block text-sm font-medium text-white">
          Your email <span className="text-[#F87171] ml-1">*</span>
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          className="bg-[#1E1E24] border-[#2A2A30] text-white placeholder:text-[#6B7280] focus:border-[#A6F84C] focus:ring-[#A6F84C]/20"
        />
        <p className="text-[#6B7280] text-xs">
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
        className="w-full bg-[#A6F84C] text-[#0B0B0F] hover:bg-[#BCFF6E] font-semibold h-12 text-base"
      >
        Continue to Contract
      </Button>
    </form>
  )
}
