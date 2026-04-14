'use client'

import { useState } from 'react'
import Image from 'next/image'
import { OutcomeCard } from './outcome-card'
import type { OutcomeTemplate, OutcomeCategory } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/constants'
import { ExternalLink } from 'lucide-react'

interface OutcomeCatalogProps {
  templates: OutcomeTemplate[]
  linkPrefix?: string
}

const categories: Array<{ value: OutcomeCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'build', label: CATEGORY_LABELS.build },
  { value: 'automate', label: CATEGORY_LABELS.automate },
  { value: 'migrate', label: CATEGORY_LABELS.migrate },
  { value: 'optimize', label: CATEGORY_LABELS.optimize },
]

export function OutcomeCatalog({ templates, linkPrefix }: OutcomeCatalogProps) {
  const [activeCategory, setActiveCategory] = useState<OutcomeCategory | 'all'>('all')

  const filtered =
    activeCategory === 'all'
      ? templates
      : templates.filter((t) => t.category === activeCategory)

  return (
    <div>
      {/* Category filter tabs */}
      <div className="flex items-center gap-2 flex-wrap mb-8">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.value
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-[#7C3AED] text-white'
                  : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:text-[#0F172A] hover:border-[#CBD5E1]'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[#64748B]">
          No outcomes in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((template) => (
            <OutcomeCard key={template.id} template={template} linkPrefix={linkPrefix} />
          ))}

          {/* Custom Engagement card */}
          <div className="bg-[#7C3AED] text-white rounded-xl p-6 flex flex-col">
            <h3 className="font-heading font-bold text-lg mb-2">Custom Engagement</h3>
            <p className="text-sm leading-relaxed opacity-80 mb-5 flex-1">
              Need something that doesn&apos;t fit a predefined outcome? We scope bespoke
              engineering projects collaboratively — from AI transformations to full platform builds.
            </p>
            <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3 mb-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                <Image src="/tori.jpeg" alt="Tori Ireland" width={48} height={48} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-semibold text-sm">Tori Ireland</p>
                <p className="text-xs opacity-70">Your FullStack Client Partner</p>
              </div>
            </div>
            <a
              href="https://calendly.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-white text-[#7C3AED] font-semibold text-sm hover:bg-white transition-colors"
            >
              <ExternalLink size={13} />
              Schedule a call with Tori
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
