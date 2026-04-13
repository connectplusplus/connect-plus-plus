'use client'

import { ScopeEstimate } from '@/components/marketplace/scope-estimate'
import type { OutcomeTemplate } from '@/lib/types'

export function ScopeEstimateSticky({ template }: { template: OutcomeTemplate }) {
  function scrollToForm() {
    document.getElementById('intake-form')?.scrollIntoView({ behavior: 'smooth' })
  }
  return <ScopeEstimate template={template} onStartClick={scrollToForm} />
}
