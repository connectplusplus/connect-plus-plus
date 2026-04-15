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
      const { data: { user } } = await supabase.auth.getUser()
      const { data: internalUser, error: roleError } = await supabase
        .from('internal_users')
        .select('id, role')
        .eq('id', user?.id ?? '')
        .single()

      if (roleError || !internalUser) {
        // Not an internal user — sign out
        await supabase.auth.signOut()
        const detail = roleError ? `: ${roleError.message}` : ''
        throw new Error(`This login is for FullStack internal team members only${detail}`)
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
    <div className="min-h-screen bg-[#F5F3EE] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/logo.png" alt="Glassbox" className="h-7 w-auto" />
          </div>
          <div className="inline-flex items-center gap-2 bg-[#6B8F5E]/10 border border-[#6B8F5E]/20 rounded-full px-3 py-1.5 mb-4">
            <Shield size={12} className="text-[#6B8F5E]" />
            <span className="text-[#6B8F5E] text-xs font-semibold">Internal Portal</span>
          </div>
          <h1 className="font-heading font-bold text-2xl text-[#2D2B27] mb-1">
            FullStack Team Login
          </h1>
          <p className="text-[#8B8781] text-sm">
            For FullStack project managers and delivery leads.
          </p>
        </div>

        <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#2D2B27]">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@fullstack.com"
                required
                autoComplete="email"
                className="bg-[#EFEDE8] border-[#E0DDD6] text-[#2D2B27] placeholder:text-[#B0ADA6] focus:border-[#6B8F5E]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#2D2B27]">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="bg-[#EFEDE8] border-[#E0DDD6] text-[#2D2B27] placeholder:text-[#B0ADA6] focus:border-[#6B8F5E]"
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
              className="w-full bg-[#6B8F5E] text-white hover:bg-[#7DA06E] font-semibold h-11"
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

        <p className="text-center text-[#B0ADA6] text-xs mt-6">
          Not a FullStack team member?{' '}
          <a href="/login" className="text-[#6B8F5E] hover:text-[#7DA06E] transition-colors">
            Client login is here
          </a>
        </p>
      </div>
    </div>
  )
}
