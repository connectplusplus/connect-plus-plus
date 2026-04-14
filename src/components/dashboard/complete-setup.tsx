'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface CompleteSetupProps {
  userId: string
  fullName: string
  email: string
}

export function CompleteSetup({ userId, fullName, email }: CompleteSetupProps) {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({ name: companyName })
        .select('id')
        .single()

      if (companyError) throw companyError

      const { error: userError } = await supabase.from('users').insert({
        id: userId,
        company_id: company.id,
        full_name: fullName,
        email,
        role: 'owner',
      })

      if (userError) throw userError

      router.refresh()
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? 'Something went wrong.'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-8">
        <h2 className="font-heading font-bold text-xl text-white mb-2">
          One last step
        </h2>
        <p className="text-[#9CA3AF] text-sm mb-6">
          What&apos;s the name of your company?
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Corp"
            required
            className="bg-[#1E1E24] border-[#2A2A30] text-white placeholder:text-[#6B7280] focus:border-[#A6F84C]"
          />
          {error && (
            <p className="text-[#F87171] text-sm">{error}</p>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#A6F84C] text-[#0B0B0F] hover:bg-[#BCFF6E] font-semibold h-11"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  )
}
