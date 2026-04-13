import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EngagementList } from '@/components/dashboard/engagement-list'
import type { Engagement, Milestone, Message } from '@/lib/types'
import { ArrowRight, Layers, CheckCircle2, MessageSquare, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('*, companies(id, name)')
    .eq('id', user.id)
    .single()

  const companyId = userProfile?.company_id

  if (!companyId) {
    // No company yet
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h2 className="font-heading font-bold text-2xl text-white mb-3">
          Welcome to Connect++
        </h2>
        <p className="text-[#9CA3AF] mb-6">
          Your account is being set up. If this persists, please contact support.
        </p>
      </div>
    )
  }

  // Fetch engagements
  const { data: engagements } = await supabase
    .from('engagements')
    .select('*, outcome_templates(title)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  // Fetch milestones for all engagements
  const engagementIds = (engagements ?? []).map((e) => e.id)

  const { data: allMilestones } = engagementIds.length > 0
    ? await supabase
        .from('milestones')
        .select('*')
        .in('engagement_id', engagementIds)
        .order('display_order', { ascending: true })
    : { data: [] }

  // Fetch last message for each engagement
  const { data: allMessages } = engagementIds.length > 0
    ? await supabase
        .from('messages')
        .select('*')
        .in('engagement_id', engagementIds)
        .eq('is_system_message', false)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Build engagement data
  const engagementsWithData = (engagements ?? []).map((eng) => {
    const milestones = (allMilestones ?? []).filter(
      (m: Milestone) => m.engagement_id === eng.id
    ) as Milestone[]
    const lastMessage =
      (allMessages ?? []).find((m: Message) => m.engagement_id === eng.id) ?? null

    return { ...eng, milestones, last_message: lastMessage }
  })

  // Active engagements
  const activeEngagements = engagementsWithData.filter(
    (e) => e.status === 'active' || e.status === 'in_review' || e.status === 'scoping'
  )

  // Stats
  const completedMilestonesThisMonth = (allMilestones ?? []).filter((m: Milestone) => {
    if (m.status !== 'completed' || !m.completed_at) return false
    const completedDate = new Date(m.completed_at)
    const now = new Date()
    return (
      completedDate.getMonth() === now.getMonth() &&
      completedDate.getFullYear() === now.getFullYear()
    )
  }).length

  const firstName = userProfile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome banner */}
      <div>
        <h2 className="font-heading font-bold text-2xl text-white mb-1">
          Welcome back, {firstName}.
        </h2>
        <p className="text-[#9CA3AF] text-sm">
          Here&apos;s what&apos;s happening across your engagements.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Engagements',
            value: activeEngagements.length,
            icon: Layers,
            color: '#A6F84C',
          },
          {
            label: 'Milestones This Month',
            value: completedMilestonesThisMonth,
            icon: CheckCircle2,
            color: '#34D399',
          },
          {
            label: 'Total Engagements',
            value: (engagements ?? []).length,
            icon: Activity,
            color: '#60A5FA',
          },
          {
            label: 'Messages',
            value: (allMessages ?? []).length,
            icon: MessageSquare,
            color: '#A78BFA',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#9CA3AF] text-xs font-medium">{stat.label}</span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon size={15} style={{ color: stat.color }} strokeWidth={1.5} />
              </div>
            </div>
            <div className="font-mono-brand font-semibold text-2xl text-white">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Active Engagements */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-semibold text-lg text-white">
            Active Engagements
          </h3>
          {activeEngagements.length > 0 && (
            <Link
              href="/dashboard/engagements"
              className="flex items-center gap-1 text-[#A6F84C] text-sm hover:text-[#BCFF6E] transition-colors"
            >
              View all <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {activeEngagements.length === 0 ? (
          <div className="bg-[#16161C] border border-[#2A2A30] rounded-xl p-12 text-center">
            <div className="w-14 h-14 bg-[#1E1E24] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Layers size={24} className="text-[#6B7280]" strokeWidth={1.5} />
            </div>
            <h3 className="font-heading font-semibold text-white text-lg mb-2">
              No active engagements yet
            </h3>
            <p className="text-[#9CA3AF] text-sm mb-6 max-w-sm mx-auto">
              Browse the outcome catalog to find a productized service that fits your needs, or
              explore our engineer talent pool.
            </p>
            <Link href="/marketplace/outcomes">
              <Button className="bg-[#A6F84C] text-[#0B0B0F] hover:bg-[#BCFF6E] font-semibold">
                Browse outcomes
                <ArrowRight size={14} className="ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <EngagementList engagements={activeEngagements} />
        )}
      </div>

      {/* All other engagements */}
      {engagementsWithData.filter((e) => !activeEngagements.includes(e)).length > 0 && (
        <div>
          <h3 className="font-heading font-semibold text-lg text-white mb-5">
            Past Engagements
          </h3>
          <EngagementList
            engagements={engagementsWithData.filter((e) => !activeEngagements.includes(e))}
          />
        </div>
      )}
    </div>
  )
}
