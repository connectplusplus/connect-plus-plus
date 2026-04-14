'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertCircle, Shield } from 'lucide-react'

export default function InternalLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // Verify internal user role
      const { data: internalUser, error: roleError } = await supabase
        .from('internal_users')
        .select('id, role')
        .single()

      if (roleError || !internalUser) {
        // Not an internal user — sign out
        await supabase.auth.signOut()
        throw new Error('This login is for FullStack internal team members only.')
      }

      router.push('/internal')
      router.refresh()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid credentials. Please try again.'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/logo.png" alt="Glassbox" className="h-7 w-auto" />
          </div>
          <div className="inline-flex items-center gap-2 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-full px-3 py-1.5 mb-4">
            <Shield size={12} className="text-[#7C3AED]" />
            <span className="text-[#7C3AED] text-xs font-semibold">Internal Portal</span>
          </div>
          <h1 className="font-heading font-bold text-2xl text-[#0F172A] mb-1">
            FullStack Team Login
          </h1>
          <p className="text-[#64748B] text-sm">
            For FullStack project managers and delivery leads.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#0F172A]">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@fullstack.com"
                required
                autoComplete="email"
                className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#7C3AED]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#0F172A]">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#7C3AED]"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-[#EF4444] text-sm bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-3 py-3">
                <AlertCircle size={15} className="shrink-0 mt-0.5" strokeWidth={2} />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold h-11"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-[#94A3B8] text-xs mt-6">
          Not a FullStack team member?{' '}
          <a href="/login" className="text-[#7C3AED] hover:text-[#8B5CF6] transition-colors">
            Client login is here
          </a>
        </p>
      </div>
    </div>
  )
}
