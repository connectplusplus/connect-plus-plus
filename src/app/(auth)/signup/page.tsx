'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.fullName },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // If email confirmation is required, show success message and stop here.
      // The user profile will be created after they confirm and log in.
      if (!authData.session) {
        setSuccess(true)
        setLoading(false)
        return
      }

      // 2. Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({ name: form.companyName })
        .select('id')
        .single()

      if (companyError) throw companyError

      // 3. Create user profile
      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id,
        company_id: company.id,
        full_name: form.fullName,
        email: form.email,
        role: 'owner',
      })

      if (userError) throw userError

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

  if (success) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img
            src="https://cdn.prod.website-files.com/63ea859d3ade03089d7e65c6/651c3035ed3443430da378d1_fs_logo_horizontal_white.svg"
            alt="FullStack"
            className="h-6 w-auto"
          />
          <span className="text-[#A6F84C] font-heading font-semibold text-sm border-l border-[#2A2A30] pl-2">
            Connect++
          </span>
        </div>
        <div className="bg-[#16161C] border border-[#A6F84C]/30 rounded-xl p-8">
          <div className="w-14 h-14 bg-[#A6F84C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-[#A6F84C]" strokeWidth={1.5} />
          </div>
          <h2 className="font-heading font-bold text-xl text-white mb-2">Check your email</h2>
          <p className="text-[#9CA3AF] text-sm leading-relaxed">
            We sent a confirmation link to{' '}
            <span className="text-white">{form.email}</span>. Click it to activate your account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img
            src="https://cdn.prod.website-files.com/63ea859d3ade03089d7e65c6/651c3035ed3443430da378d1_fs_logo_horizontal_white.svg"
            alt="FullStack"
            className="h-6 w-auto"
          />
          <span className="text-[#A6F84C] font-heading font-semibold text-sm border-l border-[#2A2A30] pl-2">
            Connect++
          </span>
        </div>
        <h1 className="font-heading font-bold text-2xl text-white mb-1">
          Get started free
        </h1>
        <p className="text-[#9CA3AF] text-sm">Start your first AI-native engineering project</p>
      </div>

      {/* Card */}
      <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Full name</label>
            <Input
              value={form.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Alex Johnson"
              required
              autoComplete="name"
              className="bg-[#1E1E24] border-[#2A2A30] text-white placeholder:text-[#6B7280] focus:border-[#A6F84C]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Company name</label>
            <Input
              value={form.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="Acme Corp"
              required
              autoComplete="organization"
              className="bg-[#1E1E24] border-[#2A2A30] text-white placeholder:text-[#6B7280] focus:border-[#A6F84C]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Work email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              className="bg-[#1E1E24] border-[#2A2A30] text-white placeholder:text-[#6B7280] focus:border-[#A6F84C]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Password</label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
              className="bg-[#1E1E24] border-[#2A2A30] text-white placeholder:text-[#6B7280] focus:border-[#A6F84C]"
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
            className="w-full bg-[#A6F84C] text-[#0B0B0F] hover:bg-[#BCFF6E] font-semibold h-11 mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>

        <p className="text-[#6B7280] text-xs text-center mt-4">
          By signing up, you agree to FullStack&apos;s terms and privacy policy.
        </p>
      </div>

      <p className="text-center text-[#9CA3AF] text-sm mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-[#A6F84C] hover:text-[#BCFF6E] transition-colors font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
