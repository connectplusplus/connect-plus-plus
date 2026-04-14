'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { completeAccountSetup } from '@/app/dashboard/actions'
import { Loader2, AlertCircle, CheckCircle2, FileText } from 'lucide-react'

type Step = 'code' | 'contract' | 'form' | 'success'

function LogoBlock() {
  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      <img
        src="https://cdn.prod.website-files.com/63ea859d3ade03089d7e65c6/651c3035ed3443430da378d1_fs_logo_horizontal_white.svg" style={{ filter: "brightness(0) saturate(100%)" }}
        alt="FullStack"
        className="h-6 w-auto"
      />
      <span className="w-px h-5 bg-[#E2E8F0]" />
      <img
        src="/logo.png"
        alt="Glassbox"
        className="h-6 w-auto"
      />
    </div>
  )
}

function StepIndicator({ current }: { current: Step }) {
  const steps: Array<{ key: Step; label: string }> = [
    { key: 'code', label: 'Verify' },
    { key: 'contract', label: 'Agreement' },
    { key: 'form', label: 'Account' },
  ]
  const currentIdx = steps.findIndex((s) => s.key === current)

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                backgroundColor: i <= currentIdx ? '#6B8F5E' : '#1E1E24',
                color: i <= currentIdx ? '#0B0B0F' : '#6B7280',
                border: i <= currentIdx ? 'none' : '1px solid #2A2A30',
              }}
            >
              {i + 1}
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: i <= currentIdx ? '#6B8F5E' : '#6B7280' }}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="w-8 h-px"
              style={{ backgroundColor: i < currentIdx ? '#6B8F5E' : '#2A2A30' }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function CodeInput({ value, onChange }: { value: string[]; onChange: (val: string[]) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const handleKeyDown = useCallback(
    (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !value[i] && i > 0) {
        inputs.current[i - 1]?.focus()
      }
    },
    [value]
  )

  const handleChange = useCallback(
    (i: number, char: string) => {
      const cleaned = char.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
      if (!cleaned) return
      const next = [...value]
      const chars = cleaned.split('')
      for (let j = 0; j < chars.length && i + j < 7; j++) {
        next[i + j] = chars[j]
      }
      onChange(next)
      const focusIdx = Math.min(i + chars.length, 6)
      setTimeout(() => inputs.current[focusIdx]?.focus(), 0)
    },
    [value, onChange]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pasted = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7)
      const next = [...value]
      for (let j = 0; j < pasted.length; j++) {
        next[j] = pasted[j]
      }
      onChange(next)
      const focusIdx = Math.min(pasted.length, 6)
      setTimeout(() => inputs.current[focusIdx]?.focus(), 0)
    },
    [value, onChange]
  )

  return (
    <div className="flex items-center justify-center gap-2" onPaste={handlePaste}>
      {Array.from({ length: 7 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el }}
          type="text"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-11 h-13 text-center text-lg font-mono-brand font-bold text-[#2D2B27] bg-[#EFEDE8] border border-[#E0DDD6] rounded-lg focus:border-[#6B8F5E] focus:outline-none focus:ring-1 focus:ring-[#6B8F5E]/30 transition-colors uppercase"
        />
      ))}
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('code')
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
  })
  const [code, setCode] = useState<string[]>(Array(7).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.join('').length < 7) {
      setError('Please enter the full 7-character code.')
      return
    }
    setError(null)
    setStep('contract')
  }

  function handleContractSign() {
    setStep('form')
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.fullName },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      if (!authData.session) {
        setStep('success')
        setLoading(false)
        return
      }

      const setupResult = await completeAccountSetup(form.companyName)
      if (setupResult.error) throw new Error(setupResult.error)

      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? 'Something went wrong. Please try again.'

      if (message.includes('already registered') || message.includes('already exists')) {
        setError('An account with this email already exists. Try signing in instead.')
      } else {
        setError(message)
      }
      setLoading(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="w-full max-w-sm text-center">
        <LogoBlock />
        <div className="bg-[#FAFAF7] border border-[#6B8F5E]/30 rounded-xl p-8">
          <div className="w-14 h-14 bg-[#6B8F5E]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-[#6B8F5E]" strokeWidth={1.5} />
          </div>
          <h2 className="font-heading font-bold text-xl text-[#2D2B27] mb-2">Check your email</h2>
          <p className="text-[#8B8781] text-sm leading-relaxed">
            We sent a confirmation link to{' '}
            <span className="text-[#2D2B27]">{form.email}</span>. Click it to activate your account.
          </p>
        </div>
      </div>
    )
  }

  // ── Step 1: Code entry ──────────────────────────────────────────────────
  if (step === 'code') {
    return (
      <div className="w-full max-w-md">
        <div className="text-center mb-2">
          <LogoBlock />
          <h1 className="font-heading font-bold text-2xl text-[#2D2B27] mb-1">
            New Customer Onboarding
          </h1>
          <p className="text-[#8B8781] text-sm mb-6">Start your guided onboarding process here.</p>
        </div>

        <StepIndicator current="code" />

        <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-8">
          <h2 className="font-heading font-semibold text-lg text-[#2D2B27] text-center mb-2">
            Enter Your Customer Code
          </h2>
          <p className="text-[#8B8781] text-sm text-center leading-relaxed mb-6">
            Enter the new customer code that you have received from the FullStack Sales Team.
          </p>

          <form onSubmit={handleCodeSubmit} className="space-y-6">
            <CodeInput value={code} onChange={setCode} />

            {error && (
              <div className="flex items-start gap-2 text-[#F87171] text-sm bg-[#F87171]/10 border border-[#F87171]/20 rounded-lg px-3 py-3">
                <AlertCircle size={15} className="shrink-0 mt-0.5" strokeWidth={2} />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={code.join('').length < 7}
              className="w-full bg-[#6B8F5E] text-white hover:bg-[#7DA06E] font-semibold h-11"
            >
              Verify Code
            </Button>
          </form>
        </div>

        <div className="mt-6 bg-gradient-to-br from-[#6B8F5E]/5 via-[#9B8B6E]/5 to-[#D4A574]/5 border border-[#6B8F5E]/20 rounded-xl p-6 text-center">
          <h3 className="font-heading font-semibold text-[#2D2B27] text-base mb-2">
            Don&apos;t have a code?
          </h3>
          <p className="text-[#8B8781] text-sm leading-relaxed mb-4">
            Contact your FullStack Sales Representative to get started, or reach out directly to begin your onboarding.
          </p>
          <a
            href="mailto:new_customer@fullstacklabs.co"
            className="inline-flex items-center justify-center w-full px-5 py-3 bg-[#6B8F5E] text-white font-semibold text-sm rounded-lg hover:bg-[#7DA06E] transition-colors"
          >
            new_customer@fullstacklabs.co
          </a>
          <p className="text-[#B0ADA6] text-xs mt-3">
            Our team typically responds within 2 business hours.
          </p>
        </div>

        <p className="text-center text-[#8B8781] text-sm mt-4">
          Existing Customer?{' '}
          <Link href="/login" className="text-[#6B8F5E] hover:text-[#7DA06E] transition-colors font-medium">
            Log in here
          </Link>
        </p>
      </div>
    )
  }

  // ── Step 2: Contract / MSA ──────────────────────────────────────────────
  if (step === 'contract') {
    return (
      <div className="w-full max-w-6xl">
        <div className="text-center mb-2">
          <LogoBlock />
        </div>

        <StepIndicator current="contract" />

        <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl overflow-hidden">
          {/* Sign button at top */}
          <div className="flex items-center justify-between p-5 border-b border-[#E0DDD6] bg-[#F5F3EE]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#6B8F5E]/10 flex items-center justify-center">
                <FileText size={18} className="text-[#6B8F5E]" />
              </div>
              <div>
                <h2 className="font-heading font-semibold text-[#2D2B27] text-base">
                  Master Services Agreement
                </h2>
                <p className="text-[#B0ADA6] text-xs">
                  FullStack Labs, Inc. — Glassbox Platform
                </p>
              </div>
            </div>
            <Button
              onClick={handleContractSign}
              className="bg-[#6B8F5E] text-white hover:bg-[#7DA06E] font-semibold h-10 px-6"
            >
              <CheckCircle2 size={15} className="mr-2" />
              Sign and Get Access to Glassbox
            </Button>
          </div>

          {/* Embedded PDF */}
          <div className="w-full" style={{ height: 'calc(100vh - 240px)' }}>
            <iframe
              src="/msa.pdf"
              className="w-full h-full border-0"
              title="FullStack Glassbox Master Services Agreement"
            />
          </div>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => { setStep('code'); setError(null) }}
            className="text-[#8B8781] text-sm hover:text-[#2D2B27] transition-colors"
          >
            &larr; Back
          </button>
        </div>
      </div>
    )
  }

  // ── Step 3: Create account ──────────────────────────────────────────────
  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-2">
        <LogoBlock />
      </div>

      <StepIndicator current="form" />

      <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-8">
        <h2 className="font-heading font-semibold text-lg text-[#2D2B27] text-center mb-1">
          Create Your Account
        </h2>
        <p className="text-[#8B8781] text-xs text-center mb-6">
          Set up your login credentials to access Glassbox.
        </p>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#2D2B27]">Full name</label>
            <Input
              value={form.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Alex Johnson"
              required
              autoComplete="name"
              className="bg-[#EFEDE8] border-[#E0DDD6] text-[#2D2B27] placeholder:text-[#B0ADA6] focus:border-[#6B8F5E]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#2D2B27]">Company name</label>
            <Input
              value={form.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="Acme Corp"
              required
              autoComplete="organization"
              className="bg-[#EFEDE8] border-[#E0DDD6] text-[#2D2B27] placeholder:text-[#B0ADA6] focus:border-[#6B8F5E]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#2D2B27]">Work email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              className="bg-[#EFEDE8] border-[#E0DDD6] text-[#2D2B27] placeholder:text-[#B0ADA6] focus:border-[#6B8F5E]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#2D2B27]">Password</label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
              className="bg-[#EFEDE8] border-[#E0DDD6] text-[#2D2B27] placeholder:text-[#B0ADA6] focus:border-[#6B8F5E]"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-[#F87171] text-sm bg-[#F87171]/10 border border-[#F87171]/20 rounded-lg px-3 py-3">
              <AlertCircle size={15} className="shrink-0 mt-0.5" strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6B8F5E] text-white hover:bg-[#7DA06E] font-semibold h-11 mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>
      </div>

      <div className="text-center mt-4">
        <button
          onClick={() => { setStep('contract'); setError(null) }}
          className="text-[#8B8781] text-sm hover:text-[#2D2B27] transition-colors"
        >
          &larr; Back
        </button>
      </div>
    </div>
  )
}
