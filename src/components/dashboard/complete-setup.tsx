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
      <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-8">
        <h2 className="font-heading font-bold text-xl text-[#2D2B27] mb-2">
          One last step
        </h2>
        <p className="text-[#8B8781] text-sm mb-6">
          What&apos;s the name of your company?
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Corp"
            required
            className="bg-[#EFEDE8] border-[#E0DDD6] text-[#2D2B27] placeholder:text-[#B0ADA6] focus:border-[#6B8F5E]"
          />
          {error && (
            <p className="text-[#F87171] text-sm">{error}</p>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6B8F5E] text-white hover:bg-[#7DA06E] font-semibold h-11"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  )
}
