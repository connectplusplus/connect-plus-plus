import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CheckCircle2, Zap, ArrowRight, ScrollText, Sparkles, Send, FileSignature } from 'lucide-react'
import { getHealthColor } from '@/lib/types'

export default async function InternalDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/internal-login')

  const { data: internalUser } = await supabase
    .from('internal_users').select('*').eq('id', user.id).single()
  if (!internalUser) redirect('/internal-login')

  const today = new Date().toISOString().split('T')[0]

  const { data: engagements } = await supabase
    .from('engagements')
    .select('id, title, status, companies(name), intake_responses')
    .eq('pm_user_id', user.id)
    .in('status', ['active', 'in_review', 'scoping'])
    .order('created_at', { ascending: false })

  const engIds = ((engagements ?? []) as Array<{ id: string }>).map((e) => e.id)
  const { data: todaysReports } = engIds.length > 0
    ? await supabase.from('daily_reports').select('engagement_id, health_score').in('engagement_id', engIds).eq('report_date', today)
    : { data: [] }

  const reportMap = new Map(
    ((todaysReports ?? []) as Array<{ engagement_id: string; health_score: number }>).map(
      (r) => [r.engagement_id, r.health_score] as const
    )
  )
  const firstName = internalUser.full_name.split(' ')[0]
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  // ── SOW pipeline stats (last 7 days) ──────────────────────────────────────
  // Headline numbers: drafts generated, average draft latency, sent to legal,
  // signed. Pulled from sow_drafts_usage + sows. Best-effort — failures
  // render as 0 / "—" rather than crashing the page.
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoIso = sevenDaysAgo.toISOString()

  const sowStats: {
    draftsGenerated: number
    avgDraftLatencyMs: number | null
    sentToLegal: number
    signed: number
  } = {
    draftsGenerated: 0,
    avgDraftLatencyMs: null,
    sentToLegal: 0,
    signed: 0,
  }

  try {
    const [{ data: drafts }, { count: sentCount }, { count: signedCount }] = await Promise.all([
      supabase
        .from('sow_drafts_usage')
        .select('latency_ms')
        .eq('status', 'success')
        .gte('created_at', sevenDaysAgoIso),
      supabase
        .from('sows')
        .select('id', { count: 'exact', head: true })
        .gte('sent_to_legal_at', sevenDaysAgoIso),
      supabase
        .from('sows')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'signed')
        .gte('client_signed_at', sevenDaysAgoIso),
    ])

    const successLatencies = ((drafts ?? []) as Array<{ latency_ms: number | null }>)
      .map((d) => d.latency_ms)
      .filter((v): v is number => typeof v === 'number')
    sowStats.draftsGenerated = successLatencies.length
    sowStats.avgDraftLatencyMs = successLatencies.length
      ? Math.round(successLatencies.reduce((s, v) => s + v, 0) / successLatencies.length)
      : null
    sowStats.sentToLegal = sentCount ?? 0
    sowStats.signed = signedCount ?? 0
  } catch {
    // best effort
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="font-heading font-bold text-2xl text-[#0F172A] mb-1">Good morning, {firstName}.</h2>
        <p className="text-[#64748B] text-sm">{internalUser.role === 'pm' ? 'Project Manager' : internalUser.role.replace('_', ' ')} — FullStack Internal Portal</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg text-[#0F172A]">Today&apos;s Reports</h3>
          <span className="text-[#94A3B8] text-xs">{dateStr}</span>
        </div>

        {(!engagements || engagements.length === 0) ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center">
            <p className="text-[#64748B] text-sm">No engagements assigned to you.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(engagements as Array<{
              id: string
              title: string
              status: string
              companies?: { name: string } | { name: string }[] | null
              intake_responses?: Record<string, unknown> | null
            }>).map((eng) => {
              const hasReport = reportMap.has(eng.id)
              const intakeHealth = (eng.intake_responses ?? null) as Record<string, unknown> | null
              const healthScore =
                reportMap.get(eng.id) ??
                (typeof intakeHealth?.health_score === 'number'
                  ? (intakeHealth.health_score as number)
                  : null)
              const companies = Array.isArray(eng.companies) ? eng.companies[0] : eng.companies
              const companyName = companies?.name

              return (
                <div key={eng.id} className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasReport ? 'bg-[#10B981]/10' : 'bg-[#7C3AED]/10'}`}>
                      {hasReport ? <CheckCircle2 size={16} className="text-[#10B981]" /> : <Zap size={16} className="text-[#7C3AED]" />}
                    </div>
                    <div>
                      <p className="text-[#0F172A] text-sm font-medium">{companyName ? `${companyName} — ` : ''}{eng.title}</p>
                      {hasReport && healthScore && (
                        <p className="text-xs mt-0.5">
                          <span className="text-[#64748B]">Published · Health </span>
                          <span className="font-mono-brand font-semibold" style={{ color: getHealthColor(healthScore) }}>{healthScore}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="w-36 shrink-0 text-right">
                    {hasReport ? (
                      <span className="text-[#10B981] text-xs font-medium">Done</span>
                    ) : (
                      <Link href={`/internal/daily-reports/new?engagement=${eng.id}`} className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-1.5 bg-[#7C3AED] text-white text-xs font-semibold rounded-lg hover:bg-[#8B5CF6] transition-colors">
                        Generate Report <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── SOW pipeline (last 7 days) ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg text-[#0F172A] flex items-center gap-2">
            <ScrollText size={16} className="text-[#5C6B4D]" />
            SOW pipeline
          </h3>
          <span className="text-[#94A3B8] text-xs">Last 7 days</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SowStat
            icon={<Sparkles size={14} className="text-[#5C6B4D]" />}
            label="Drafts generated"
            value={String(sowStats.draftsGenerated)}
            sub={
              sowStats.avgDraftLatencyMs !== null
                ? `${(sowStats.avgDraftLatencyMs / 1000).toFixed(1)}s avg`
                : '—'
            }
          />
          <SowStat
            icon={<ScrollText size={14} className="text-[#5C6B4D]" />}
            label="Sent to legal"
            value={String(sowStats.sentToLegal)}
          />
          <SowStat
            icon={<Send size={14} className="text-[#7C3AED]" />}
            label="Awaiting client"
            value="—"
            sub="See queue for live count"
          />
          <SowStat
            icon={<FileSignature size={14} className="text-[#10B981]" />}
            label="Signed"
            value={String(sowStats.signed)}
          />
        </div>
      </div>
    </div>
  )
}

function SowStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-[#64748B] mb-2">
        {icon}
        <span>{label}</span>
      </div>
      <p className="font-mono-brand text-[22px] font-bold text-[#0F172A] leading-none">{value}</p>
      {sub && <p className="text-[10px] text-[#94A3B8] mt-1.5">{sub}</p>}
    </div>
  )
}
