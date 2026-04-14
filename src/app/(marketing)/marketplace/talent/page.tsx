import { createClient } from '@/lib/supabase/server'
import type { TalentProfile } from '@/lib/types'
import { TalentBrowseClient } from './talent-browse-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore Talent — Glassbox',
  description:
    'Browse AI-accelerated engineers. Every profile includes an AI Velocity Score — see how much faster each engineer ships with AI tools.',
}

export default async function TalentPage() {
  const supabase = await createClient()

  const { data: profiles, error } = await supabase
    .from('talent_profiles')
    .select('*')
    .eq('is_available', true)
    .order('ai_velocity_score', { ascending: false })

  if (error) {
    console.error('Error fetching talent:', error)
  }

  const talentProfiles = (profiles as TalentProfile[]) ?? []

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Page header */}
      <div className="border-b border-[#E0DDD6] bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 border border-[#E0DDD6] bg-[#FAFAF7] rounded-full px-3 py-1.5 mb-6">
              <span className="text-[#D4A574] text-xs font-medium tracking-wide uppercase">
                Individual Talent
              </span>
            </div>
            <h1 className="font-heading font-bold text-4xl md:text-5xl mb-4">
              Engineers with an
              <br />
              <span className="text-[#6B8F5E]">AI velocity edge.</span>
            </h1>
            <p className="text-[#8B8781] text-lg leading-relaxed">
              Every engineer on Glassbox ships 1.8x–2.7x faster than traditional teams. Browse
              profiles, filter by skill, and request the right engineer for your project.
            </p>
          </div>
        </div>
      </div>

      {/* Browse */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {talentProfiles.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-[#8B8781] text-lg mb-2">No talent profiles available yet.</p>
            <p className="text-[#B0ADA6] text-sm">
              Run the seed script in your Supabase project to populate talent profiles.
            </p>
          </div>
        ) : (
          <TalentBrowseClient profiles={talentProfiles} />
        )}
      </div>
    </div>
  )
}
