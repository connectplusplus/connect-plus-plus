import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, FileText, CheckCircle2 } from 'lucide-react'
import { getHealthLabel, getHealthColor } from '@/lib/types'

export default async function DailyReportsListPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/internal-login')

  const { data: reports } = await supabase
    .from('daily_reports')
    .select('*, engagements(title, company_id, companies(name))')
    .eq('author_id', user.id)
    .order('report_date', { ascending: false })
    .limit(30)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-[#2D2B27] mb-1">My Daily Reports</h2>
          <p className="text-[#8B8781] text-sm">{(reports ?? []).length} reports submitted</p>
        </div>
        <Link href="/internal/daily-reports/new">
          <Button className="bg-[#6B8F5E] text-white hover:bg-[#7DA06E] font-semibold">
            <Plus size={14} className="mr-2" />
            New Report
          </Button>
        </Link>
      </div>

      {(!reports || reports.length === 0) ? (
        <div className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-[#6B8F5E]/10 flex items-center justify-center mx-auto mb-4">
            <FileText size={24} className="text-[#6B8F5E]" />
          </div>
          <h3 className="font-heading font-semibold text-[#2D2B27] text-lg mb-2">No reports yet</h3>
          <p className="text-[#8B8781] text-sm mb-5">Submit your first daily report to get started.</p>
          <Link href="/internal/daily-reports/new">
            <Button className="bg-[#6B8F5E] text-white hover:bg-[#7DA06E] font-semibold">
              Write your first report
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report: any) => {
            const eng = report.engagements as any
            const companyName = eng?.companies?.name
            const engTitle = eng?.title ?? 'Unknown'
            const healthColor = getHealthColor(report.health_score)
            const healthLabel = getHealthLabel(report.health_score)
            const dateStr = new Date(report.report_date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })

            return (
              <div key={report.id} className="bg-[#FAFAF7] border border-[#E0DDD6] rounded-xl p-5 hover:border-[#6B8F5E]/20 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[#2D2B27] text-sm font-semibold">{dateStr}</p>
                    <p className="text-[#6B8F5E] text-xs font-medium mt-0.5">
                      {companyName ? `${companyName} — ` : ''}{engTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-brand font-bold text-sm" style={{ color: healthColor }}>
                      {report.health_score}
                    </span>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ color: healthColor, backgroundColor: `${healthColor}15` }}
                    >
                      {healthLabel}
                    </span>
                  </div>
                </div>
                <p className="text-[#8B8781] text-sm line-clamp-2">{report.accomplishments}</p>
                {report.blockers && (
                  <p className="text-[#EF4444] text-xs mt-2">Blocker: {report.blockers.slice(0, 100)}{report.blockers.length > 100 ? '...' : ''}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
