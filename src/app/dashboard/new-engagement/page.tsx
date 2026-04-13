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
        <h2 className="font-heading font-bold text-2xl text-white mb-1">New Engagement</h2>
        <p className="text-[#9CA3AF] text-sm">
          Choose a productized service. Fixed price, defined timeline, no surprises.
        </p>
      </div>

      {outcomeTemplates.length === 0 ? (
        <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-16 text-center">
          <p className="text-[#9CA3AF] mb-2">No outcomes available yet.</p>
          <p className="text-[#6B7280] text-sm">
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
