'use client'

import { useState } from 'react'
import { OutcomeCard } from './outcome-card'
import type { OutcomeTemplate, OutcomeCategory } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/constants'

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
                  ? 'bg-[#A6F84C] text-[#0B0B0F]'
                  : 'bg-[#16161C] text-[#9CA3AF] border border-[#2A2A30] hover:text-white hover:border-[#3A3A40]'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[#9CA3AF]">
          No outcomes in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((template) => (
            <OutcomeCard key={template.id} template={template} linkPrefix={linkPrefix} />
          ))}
        </div>
      )}
    </div>
  )
}
