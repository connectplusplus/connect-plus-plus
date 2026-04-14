import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { EngagementList } from '@/components/dashboard/engagement-list'
import { CompleteSetup } from '@/components/dashboard/complete-setup'
import { SeedDemoButton } from '@/components/dashboard/seed-demo-button'
import type { Engagement, Milestone, Message, TalentProfile } from '@/lib/types'
import { ArrowRight, Calendar, Clock, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ── FullStack account manager (static for demo) ───────────────────────────────
const ACCOUNT_MANAGER = {
  name: 'Tori Ireland',
  title: 'Client Partner',
  photo: '/tori.jpeg',
  calendly: 'https://calendly.com',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user profile + company
  const { data: userProfile } = await supabase
    .from('users')
    .select('*, companies(id, name, created_at)')
    .eq('id', user.id)
    .single()

  // No profile yet — ask for company name to complete setup
  if (!userProfile?.company_id) {
    return <CompleteSetup />
  }

  const company = userProfile.companies as { id: string; name: string; created_at: string } | null
  const companyId = userProfile.company_id
  const firstName = userProfile.full_name?.split(' ')[0] ?? 'there'
  const clientSince = company?.created_at
    ? new Date(company.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  // Fetch engagements
  const { data: engagements } = await supabase
    .from('engagements')
    .select('*, outcome_templates(title)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  const engagementIds = (engagements ?? []).map((e) => e.id)

  const { data: allMilestones } = engagementIds.length > 0
    ? await supabase
        .from('milestones')
        .select('*')
        .in('engagement_id', engagementIds)
        .order('display_order', { ascending: true })
    : { data: [] }

  const { data: allMessages } = engagementIds.length > 0
    ? await supabase
        .from('messages')
        .select('*')
        .in('engagement_id', engagementIds)
        .eq('is_system_message', false)
        .order('created_at', { ascending: false })
    : { data: [] }

  const engagementsWithData = (engagements ?? []).map((eng) => {
    const milestones = (allMilestones ?? []).filter(
      (m: Milestone) => m.engagement_id === eng.id
    ) as Milestone[]
    const lastMessage =
      (allMessages ?? []).find((m: Message) => m.engagement_id === eng.id) ?? null
    return { ...eng, milestones, last_message: lastMessage }
  })

  const activeEngagements = engagementsWithData.filter(
    (e) => e.status === 'active' || e.status === 'in_review' || e.status === 'scoping'
  )

  // Fetch shortlisted talent (top 4 available)
  const { data: shortlistedTalent } = await supabase
    .from('talent_profiles')
    .select('*')
    .eq('is_available', true)
    .order('ai_velocity_score', { ascending: false })
    .limit(4)

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      {/* ── Client hero banner ─────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left: client info */}
          <div className="space-y-4">
            <div>
              <p className="text-[#94A3B8] text-xs font-medium uppercase tracking-widest mb-1">
                Client Account
              </p>
              <h2 className="font-heading font-bold text-3xl text-[#0F172A]">
                {company?.name ?? 'Your Company'}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              {clientSince && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center">
                    <Calendar size={13} className="text-[#7C3AED]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-[#94A3B8] text-xs">FullStack client since</p>
                    <p className="text-[#0F172A] text-sm font-medium">{clientSince}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center">
                  <Clock size={13} className="text-[#7C3AED]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[#94A3B8] text-xs">Active engagements</p>
                  <p className="text-[#0F172A] text-sm font-medium">{activeEngagements.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: account manager card */}
          <div className="flex items-center gap-0 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl overflow-hidden shrink-0">
            <div className="w-36 h-36 shrink-0">
              <Image
                src={ACCOUNT_MANAGER.photo}
                alt={ACCOUNT_MANAGER.name}
                width={144}
                height={144}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="px-5 py-4">
              <p className="text-[#7C3AED] text-[10px] font-semibold uppercase tracking-widest mb-1">Your FullStack Partner</p>
              <p className="text-[#0F172A] font-heading font-bold text-lg">{ACCOUNT_MANAGER.name}</p>
              <p className="text-[#64748B] text-sm mb-4">{ACCOUNT_MANAGER.title}</p>
              <a
                href={ACCOUNT_MANAGER.calendly}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#8B5CF6] px-4 py-2 rounded-lg transition-colors duration-150"
              >
                <ExternalLink size={11} strokeWidth={2.5} />
                Schedule a call
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Special Offer Banner ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#7C3AED]/10 via-[#7C3AED]/5 to-transparent border border-[#7C3AED]/20 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/15 flex items-center justify-center shrink-0">
              <span className="text-[#7C3AED] font-mono-brand font-bold text-lg">%</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#7C3AED] text-[10px] font-semibold uppercase tracking-widest">Limited Offer</span>
                <span className="text-[#94A3B8] text-[10px]">Expires Apr 30, 2026</span>
              </div>
              <h3 className="font-heading font-bold text-[#0F172A] text-base">
                20% off billing rates for React developers
              </h3>
              <p className="text-[#64748B] text-sm mt-0.5">
                Onboard before April 30th and lock in reduced rates for the duration of your engagement.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/talent"
            className="shrink-0 px-5 py-2.5 bg-[#7C3AED] text-white font-semibold text-sm rounded-lg hover:bg-[#8B5CF6] transition-colors"
          >
            Browse React Engineers
          </Link>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      </div>

      {/* ── Shortlisted talent ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-heading font-semibold text-lg text-[#0F172A]">
              New Positions for {company?.name ?? 'Your Company'}
            </h3>
            <p className="text-[#94A3B8] text-xs mt-0.5">
              Shortlisted by your technology priorities
            </p>
          </div>
          <Link
            href="/dashboard/talent"
            className="flex items-center gap-1 text-[#7C3AED] text-sm hover:text-[#8B5CF6] transition-colors"
          >
            Browse all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(shortlistedTalent as TalentProfile[] ?? []).map((talent) => (
            <div
              key={talent.id}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-[#7C3AED]/30 hover:-translate-y-0.5 transition-all duration-150"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[#7C3AED] font-mono-brand text-sm font-semibold shrink-0">
                  {talent.display_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-[#0F172A] text-sm font-semibold truncate">{talent.display_name}</p>
                  <p className="text-[#94A3B8] text-xs truncate">{talent.seniority}</p>
                </div>
              </div>
              <p className="text-[#64748B] text-xs leading-relaxed mb-3 line-clamp-2">
                {talent.title}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {((talent.skills as string[]) ?? []).slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded text-[10px] bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7C3AED] font-mono-brand text-xs font-semibold">
                  {talent.ai_velocity_score}x AI velocity
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Active Engagements ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-semibold text-lg text-[#0F172A]">
            Active Engagements
          </h3>
          {activeEngagements.length > 0 && (
            <Link
              href="/dashboard/engagements"
              className="flex items-center gap-1 text-[#7C3AED] text-sm hover:text-[#8B5CF6] transition-colors"
            >
              View all <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {activeEngagements.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center space-y-4">
            <p className="text-[#64748B] text-sm">No active engagements yet.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <SeedDemoButton />
              <Link href="/dashboard/new-engagement">
                <Button variant="outline" className="border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] text-sm h-9">
                  Browse catalog
                  <ArrowRight size={13} className="ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <EngagementList engagements={activeEngagements} />
        )}
      </div>

    </div>
  )
}
