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
        <h2 className="font-heading font-bold text-2xl text-[#2D2B27] mb-1">Browse Talent</h2>
        <p className="text-[#8B8781] text-sm">
          AI-accelerated engineers available for your projects.
        </p>
      </div>

      {talentProfiles.length === 0 ? (
        <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-12 text-center">
          <p className="text-[#8B8781] text-sm">No talent profiles available yet.</p>
        </div>
      ) : (
        <TalentBrowseClient profiles={talentProfiles} />
      )}
    </div>
  )
}
