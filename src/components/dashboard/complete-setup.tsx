'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { completeAccountSetup } from '@/app/dashboard/actions'

export function CompleteSetup() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await completeAccountSetup(companyName)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-8">
        <h2 className="font-heading font-bold text-xl text-[#0F172A] mb-2">
          One last step
        </h2>
        <p className="text-[#64748B] text-sm mb-6">
          What&apos;s the name of your company?
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Corp"
            required
            className="bg-[#F1F5F9] border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#7C3AED]"
          />
          {error && (
            <p className="text-[#F87171] text-sm">{error}</p>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold h-11"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  )
}
