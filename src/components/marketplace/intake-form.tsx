'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { IntakeSchema, OutcomeTemplate } from '@/lib/types'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface IntakeFormProps {
  template: OutcomeTemplate
  companyId?: string
}

export function IntakeForm({ template, companyId }: IntakeFormProps) {
  const router = useRouter()
  const [responses, setResponses] = useState<Record<string, string | string[]>>({})
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [multiselects, setMultiselects] = useState<Record<string, string[]>>({})

  const schema: IntakeSchema = template.intake_schema

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Check if user is authenticated
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

      // For unauthenticated users, we need a company — create a placeholder
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
          title: `${template.title} — ${email || 'New Project'}`,
          status: 'intake',
          intake_responses: {
            ...responses,
            contact_email: email || user?.email || '',
          },
        })
        .select('id')
        .single()

      if (engError) throw engError

      setSubmitted(true)

      // If authenticated, redirect to dashboard
      if (user && engagement) {
        setTimeout(() => {
          router.push(`/dashboard/engagements/${engagement.id}`)
        }, 2000)
      }
    } catch (err) {
      console.error('Intake submission error:', err)
      setError('Something went wrong submitting your project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-[#16161C] border border-[#A6F84C]/30 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-[#A6F84C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-[#A6F84C]" strokeWidth={1.5} />
        </div>
        <h3 className="font-heading font-semibold text-xl text-white mb-2">
          We&apos;ve received your project details.
        </h3>
        <p className="text-[#9CA3AF] text-sm leading-relaxed">
          An AI-native Project Manager will review your scope and reach out within 24 hours.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            <Select
              value={(responses[field.key] as string) ?? ''}
              onValueChange={(val) => handleSelectChange(field.key, val ?? '')}
              required={field.required}
            >
              <SelectTrigger className="bg-[#1E1E24] border-[#2A2A30] text-white focus:border-[#A6F84C]">
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent className="bg-[#16161C] border-[#2A2A30]">
                {field.options.map((opt) => (
                  <SelectItem
                    key={opt}
                    value={opt}
                    className="text-white hover:bg-[#1E1E24] focus:bg-[#1E1E24] cursor-pointer"
                  >
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      {/* Contact email for unauthenticated users */}
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
        {loading ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit for Scoping'
        )}
      </Button>
    </form>
  )
}
