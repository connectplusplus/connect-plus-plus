import { createClient } from '@/lib/supabase/server'
import { OutcomeCatalog } from '@/components/marketplace/outcome-catalog'
import type { OutcomeTemplate } from '@/lib/types'

export default async function NewEngagementPage() {
  const supabase = await createClient()

  const { data: templates } = await supabase
    .from('outcome_templates')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const outcomeTemplates = (templates as OutcomeTemplate[]) ?? []

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="font-heading font-bold text-2xl text-[#2D2B27] mb-1">New Engagement</h2>
        <p className="text-[#8B8781] text-sm">
          Choose a productized service. Fixed price, defined timeline, no surprises.
        </p>
      </div>

      {outcomeTemplates.length === 0 ? (
        <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-16 text-center">
          <p className="text-[#8B8781] mb-2">No outcomes available yet.</p>
          <p className="text-[#B0ADA6] text-sm">
            Run the seed script in your Supabase project to populate the catalog.
          </p>
        </div>
      ) : (
        <OutcomeCatalog
          templates={outcomeTemplates}
          linkPrefix="/dashboard/new-engagement"
        />
      )}
    </div>
  )
}
