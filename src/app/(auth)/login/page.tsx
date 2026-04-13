'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
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
          Welcome back
        </h1>
        <p className="text-[#9CA3AF] text-sm">Sign in to your Connect++ account</p>
      </div>

      {/* Card */}
      <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              className="bg-[#1E1E24] border-[#2A2A30] text-white placeholder:text-[#6B7280] focus:border-[#A6F84C]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-white">Password</label>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
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
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </div>

      <p className="text-center text-[#9CA3AF] text-sm mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-[#A6F84C] hover:text-[#BCFF6E] transition-colors font-medium">
          Create one free
        </Link>
      </p>
    </div>
  )
}
