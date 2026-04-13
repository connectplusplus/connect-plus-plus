'use client'

import { useRef } from 'react'
import { IntakeForm } from '@/components/marketplace/intake-form'
import { ScopeEstimate } from '@/components/marketplace/scope-estimate'
import type { OutcomeTemplate } from '@/lib/types'

interface OutcomeDetailClientProps {
  template: OutcomeTemplate
  pricingOnly?: boolean
}

export function OutcomeDetailClient({ template, pricingOnly = false }: OutcomeDetailClientProps) {
  const formRef = useRef<HTMLDivElement>(null)

  function scrollToForm() {
    document.getElementById('intake-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (pricingOnly) {
    return <ScopeEstimate template={template} onStartClick={scrollToForm} />
  }

  return (
    <div ref={formRef}>
      <IntakeForm template={template} />
    </div>
  )
}
