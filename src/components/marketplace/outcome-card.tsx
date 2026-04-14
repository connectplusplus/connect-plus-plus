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
    <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-6 flex flex-col hover:border-[#6B8F5E]/30 hover:-translate-y-0.5 transition-all duration-150 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="w-11 h-11 rounded-xl bg-[#EFEDE8] flex items-center justify-center shrink-0">
          <IconComponent
            size={20}
            strokeWidth={1.5}
            className="text-[#6B8F5E]"
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
        <h3 className="font-heading font-semibold text-lg text-[#2D2B27] mb-1 group-hover:text-[#6B8F5E] transition-colors duration-150">
          {template.title}
        </h3>
        {template.subtitle && (
          <p className="text-[#8B8781] text-sm mb-3">{template.subtitle}</p>
        )}
      </div>

      {/* Pricing & timeline */}
      <div className="flex items-center gap-4 my-4 py-4 border-y border-[#E0DDD6]">
        <div className="flex items-center gap-1.5">
          <DollarSign size={14} className="text-[#B0ADA6]" strokeWidth={1.5} />
          <span className="text-[#2D2B27] text-sm font-mono-brand font-medium">
            {formatPriceRange(template.price_range_low, template.price_range_high)}
          </span>
        </div>
        <div className="w-px h-4 bg-[#E2E8F0]" />
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-[#B0ADA6]" strokeWidth={1.5} />
          <span className="text-[#8B8781] text-sm">
            {formatTimelineRange(template.timeline_range_low, template.timeline_range_high)}
          </span>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`${linkPrefix}/${template.slug}`}
        className="flex items-center justify-between text-[#6B8F5E] text-sm font-semibold hover:gap-3 transition-all duration-150 group/link"
      >
        <span>Learn More</span>
        <ArrowRight size={14} className="group-hover/link:translate-x-0.5 transition-transform duration-150" />
      </Link>
    </div>
  )
}
