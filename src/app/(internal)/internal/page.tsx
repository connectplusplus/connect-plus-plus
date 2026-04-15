import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CheckCircle2, Zap, ArrowRight } from 'lucide-react'
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

  const engIds = (engagements ?? []).map((e: any) => e.id)
  const { data: todaysReports } = engIds.length > 0
    ? await supabase.from('daily_reports').select('engagement_id, health_score').in('engagement_id', engIds).eq('report_date', today)
    : { data: [] }

  const reportMap = new Map((todaysReports ?? []).map((r: any) => [r.engagement_id, r.health_score]))
  const firstName = internalUser.full_name.split(' ')[0]
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="font-heading font-bold text-2xl text-[#2D2B27] mb-1">Good morning, {firstName}.</h2>
        <p className="text-[#8B8781] text-sm">{internalUser.role === 'pm' ? 'Project Manager' : internalUser.role.replace('_', ' ')} — FullStack Internal Portal</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg text-[#2D2B27]">Today&apos;s Reports</h3>
          <span className="text-[#B0ADA6] text-xs">{dateStr}</span>
        </div>

        {(!engagements || engagements.length === 0) ? (
          <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-8 text-center">
            <p className="text-[#8B8781] text-sm">No engagements assigned to you.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {engagements.map((eng: any) => {
              const hasReport = reportMap.has(eng.id)
              const healthScore = reportMap.get(eng.id) ?? (eng.intake_responses as any)?.health_score ?? null
              const companyName = (eng.companies as any)?.name

              return (
                <div key={eng.id} className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasReport ? 'bg-[#10B981]/10' : 'bg-[#6B8F5E]/10'}`}>
                      {hasReport ? <CheckCircle2 size={16} className="text-[#10B981]" /> : <Zap size={16} className="text-[#6B8F5E]" />}
                    </div>
                    <div>
                      <p className="text-[#2D2B27] text-sm font-medium">{companyName ? `${companyName} — ` : ''}{eng.title}</p>
                      {hasReport && healthScore && (
                        <p className="text-xs mt-0.5">
                          <span className="text-[#8B8781]">Published · Health </span>
                          <span className="font-mono-brand font-semibold" style={{ color: getHealthColor(healthScore) }}>{healthScore}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="w-36 shrink-0 text-right">
                    {hasReport ? (
                      <span className="text-[#10B981] text-xs font-medium">Done</span>
                    ) : (
                      <Link href={`/internal/daily-reports/new?engagement=${eng.id}`} className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-1.5 bg-[#6B8F5E] text-white text-xs font-semibold rounded-lg hover:bg-[#7DA06E] transition-colors">
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
    </div>
  )
}
