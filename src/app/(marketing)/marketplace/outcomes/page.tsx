import { createClient } from '@/lib/supabase/server'
import { OutcomeCatalog } from '@/components/marketplace/outcome-catalog'
import type { OutcomeTemplate } from '@/lib/types'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Predefined Outcomes — Glassbox',
  description:
    'Productized engineering services at fixed prices. MVP Sprint, CI/CD, Testing, Performance — scoped and priced upfront.',
}

export default async function OutcomesPage() {
  const supabase = await createClient()

  const { data: templates, error } = await supabase
    .from('outcome_templates')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching templates:', error)
  }

  const outcomeTemplates = (templates as OutcomeTemplate[]) ?? []

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Page header */}
      <div className="border-b border-[#E0DDD6] bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 border border-[#E0DDD6] bg-[#FAFAF7] rounded-full px-3 py-1.5 mb-6">
              <span className="text-[#6B8F5E] text-xs font-medium tracking-wide uppercase">
                Predefined Outcomes
              </span>
            </div>
            <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4">
              Fixed price. Defined timeline.
              <br />
              <span className="text-[#6B8F5E]">No surprises.</span>
            </h1>
            <p className="text-[#8B8781] text-lg leading-relaxed">
              Productized engineering services with upfront pricing and timelines. Browse the
              catalog, fill in the intake form, and our AI-native team handles the rest.
            </p>
          </div>
        </div>
      </div>

      {/* Catalog */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {outcomeTemplates.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-[#8B8781] text-lg mb-2">No outcomes available yet.</p>
            <p className="text-[#B0ADA6] text-sm">
              Run the seed script in your Supabase project to populate the catalog.
            </p>
          </div>
        ) : (
          <OutcomeCatalog templates={outcomeTemplates} />
        )}
      </div>
    </div>
  )
}
