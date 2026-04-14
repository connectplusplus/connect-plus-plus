import Link from 'next/link'
import {
  ArrowRight,
  Clock,
  DollarSign,
  Rocket,
  TestTube,
  Globe,
  GitBranch,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { OutcomeTemplate } from '@/lib/types'
import { formatPriceRange, formatTimelineRange } from '@/lib/utils'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/constants'

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  Rocket,
  TestTube,
  Globe,
  GitBranch,
  Zap,
}

interface OutcomeCardProps {
  template: OutcomeTemplate
  linkPrefix?: string
}

export function OutcomeCard({ template, linkPrefix = '/marketplace/outcomes' }: OutcomeCardProps) {
  const IconComponent = template.icon ? (ICON_MAP[template.icon] ?? Zap) : Zap
  const categoryColor = CATEGORY_COLORS[template.category]
  const categoryLabel = CATEGORY_LABELS[template.category]

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col hover:border-[#7C3AED]/30 hover:-translate-y-0.5 transition-all duration-150 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="w-11 h-11 rounded-xl bg-[#F1F5F9] flex items-center justify-center shrink-0">
          <IconComponent
            size={20}
            strokeWidth={1.5}
            className="text-[#7C3AED]"
          />
        </div>
        <Badge
          className="text-xs font-medium border rounded-full px-2.5 py-1 bg-transparent"
          style={{ color: categoryColor, borderColor: `${categoryColor}40` }}
        >
          {categoryLabel}
        </Badge>
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="font-heading font-semibold text-lg text-[#0F172A] mb-1 group-hover:text-[#7C3AED] transition-colors duration-150">
          {template.title}
        </h3>
        {template.subtitle && (
          <p className="text-[#64748B] text-sm mb-3">{template.subtitle}</p>
        )}
      </div>

      {/* Pricing & timeline */}
      <div className="flex items-center gap-4 my-4 py-4 border-y border-[#E2E8F0]">
        <div className="flex items-center gap-1.5">
          <DollarSign size={14} className="text-[#94A3B8]" strokeWidth={1.5} />
          <span className="text-[#0F172A] text-sm font-mono-brand font-medium">
            {formatPriceRange(template.price_range_low, template.price_range_high)}
          </span>
        </div>
        <div className="w-px h-4 bg-[#E2E8F0]" />
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-[#94A3B8]" strokeWidth={1.5} />
          <span className="text-[#64748B] text-sm">
            {formatTimelineRange(template.timeline_range_low, template.timeline_range_high)}
          </span>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`${linkPrefix}/${template.slug}`}
        className="flex items-center justify-between text-[#7C3AED] text-sm font-semibold hover:gap-3 transition-all duration-150 group/link"
      >
        <span>Learn More</span>
        <ArrowRight size={14} className="group-hover/link:translate-x-0.5 transition-transform duration-150" />
      </Link>
    </div>
  )
}
