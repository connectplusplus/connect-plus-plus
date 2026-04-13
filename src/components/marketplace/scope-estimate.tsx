import { Clock, DollarSign, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { OutcomeTemplate } from '@/lib/types'
import { formatPriceRange, formatTimelineRange } from '@/lib/utils'

interface ScopeEstimateProps {
  template: OutcomeTemplate
  onStartClick: () => void
}

export function ScopeEstimate({ template, onStartClick }: ScopeEstimateProps) {
  return (
    <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-6 sticky top-24">
      <div className="mb-6">
        <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-3">
          Estimated Investment
        </p>
        <div className="flex items-center gap-2 mb-1">
          <DollarSign size={18} className="text-[#A6F84C]" strokeWidth={1.5} />
          <span className="font-mono-brand font-semibold text-2xl text-white">
            {formatPriceRange(template.price_range_low, template.price_range_high)}
          </span>
        </div>
        <p className="text-[#6B7280] text-xs">Fixed price — no scope creep surprises</p>
      </div>

      <div className="mb-6 pt-6 border-t border-[#2A2A30]">
        <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wide mb-3">
          Timeline
        </p>
        <div className="flex items-center gap-2 mb-1">
          <Clock size={18} className="text-[#A6F84C]" strokeWidth={1.5} />
          <span className="font-mono-brand font-semibold text-2xl text-white">
            {formatTimelineRange(template.timeline_range_low, template.timeline_range_high)}
          </span>
        </div>
        <p className="text-[#6B7280] text-xs">Business days from kickoff</p>
      </div>

      <Button
        onClick={onStartClick}
        className="w-full bg-[#A6F84C] text-[#0B0B0F] hover:bg-[#BCFF6E] font-semibold h-11 mb-4 text-sm"
      >
        Start This Project →
      </Button>

      <div className="space-y-2.5">
        {[
          '30-day post-delivery warranty',
          'Fixed price guarantee',
          'Dedicated AI-native PM',
          'Real-time milestone tracking',
        ].map((item) => (
          <div key={item} className="flex items-center gap-2.5">
            <CheckCircle2 size={14} className="text-[#A6F84C] shrink-0" strokeWidth={2} />
            <span className="text-[#9CA3AF] text-xs">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
