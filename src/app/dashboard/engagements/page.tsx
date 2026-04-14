import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EngagementList } from '@/components/dashboard/engagement-list'
import { SeedDemoButton } from '@/components/dashboard/seed-demo-button'
import type { Engagement, Milestone, Message } from '@/lib/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default async function EngagementsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  const companyId = userProfile?.company_id
  if (!companyId) redirect('/dashboard')

  const { data: engagements } = await supabase
    .from('engagements')
    .select('*, outcome_templates(title)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  const engagementIds = (engagements ?? []).map((e) => e.id)

  const { data: allMilestones } = engagementIds.length > 0
    ? await supabase.from('milestones').select('*').in('engagement_id', engagementIds).order('display_order', { ascending: true })
    : { data: [] }

  const { data: allMessages } = engagementIds.length > 0
    ? await supabase.from('messages').select('*').in('engagement_id', engagementIds).eq('is_system_message', false).order('created_at', { ascending: false })
    : { data: [] }

  const engagementsWithData = (engagements ?? []).map((eng) => ({
    ...eng,
    milestones: (allMilestones ?? []).filter((m: Milestone) => m.engagement_id === eng.id) as Milestone[],
    last_message: (allMessages ?? []).find((m: Message) => m.engagement_id === eng.id) ?? null,
  }))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-white mb-1">All Engagements</h2>
          <p className="text-[#9CA3AF] text-sm">{engagementsWithData.length} total</p>
        </div>
        <Link href="/dashboard/new-engagement">
          <Button className="bg-[#A6F84C] text-[#0B0B0F] hover:bg-[#BCFF6E] font-semibold">
            New Engagement
            <ArrowRight size={14} className="ml-2" />
          </Button>
        </Link>
      </div>

      {engagementsWithData.length === 0 ? (
        <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-12 text-center">
          <h3 className="font-heading font-semibold text-white text-lg mb-2">No engagements yet</h3>
          <p className="text-[#9CA3AF] text-sm mb-6">Start your first project from the outcome catalog.</p>
          <Link href="/marketplace/outcomes">
            <Button className="bg-[#A6F84C] text-[#0B0B0F] hover:bg-[#BCFF6E] font-semibold">
              Browse outcomes
            </Button>
          </Link>
        </div>
      ) : (
        <EngagementList engagements={engagementsWithData} />
      )}

      <div className="pt-4 text-center">
        <SeedDemoButton />
      </div>
    </div>
  )
}
