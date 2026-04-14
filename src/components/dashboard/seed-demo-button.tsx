'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'
import { seedDemoEngagements } from '@/app/dashboard/actions'

export function SeedDemoButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    const result = await seedDemoEngagements()
    if (result.success) {
      router.refresh()
    } else {
      setError(result.error ?? 'Unknown error')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-[#6B7280] hover:text-[#9CA3AF] text-xs transition-colors disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center gap-1.5">
            <Loader2 size={11} className="animate-spin" />
            Loading demo data...
          </span>
        ) : (
          'Load demo engagements'
        )}
      </button>
      {error && (
        <p className="text-[#F87171] text-xs max-w-xs">{error}</p>
      )}
    </div>
  )
}
