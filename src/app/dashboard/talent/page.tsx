import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { TalentProfile } from '@/lib/types'
import { TalentBrowseClient } from '@/app/(marketing)/marketplace/talent/talent-browse-client'

export default async function DashboardTalentPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profiles } = await supabase
    .from('talent_profiles')
    .select('*')
    .eq('is_available', true)
    .order('ai_velocity_score', { ascending: false })

  const talentProfiles = (profiles as TalentProfile[]) ?? []

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="font-heading font-bold text-2xl text-[#0F172A] mb-1">Browse Talent</h2>
        <p className="text-[#64748B] text-sm">
          AI-accelerated engineers available for your projects.
        </p>
      </div>

      {talentProfiles.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center">
          <p className="text-[#64748B] text-sm">No talent profiles available yet.</p>
        </div>
      ) : (
        <TalentBrowseClient profiles={talentProfiles} />
      )}
    </div>
  )
}
