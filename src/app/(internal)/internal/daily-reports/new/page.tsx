import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DailyReportForm } from './daily-report-form'
import { Suspense } from 'react'

export default async function NewDailyReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/internal-login')

  const today = new Date().toISOString().split('T')[0]

  const { data: engagements } = await supabase
    .from('engagements')
    .select('id, title, status, companies(name)')
    .eq('pm_user_id', user.id)
    .in('status', ['active', 'in_review', 'scoping'])
    .order('created_at', { ascending: false })

  const engIds = (engagements ?? []).map((e) => e.id)
  const { data: todaysReports } = engIds.length > 0
    ? await supabase.from('daily_reports').select('engagement_id').in('engagement_id', engIds).eq('report_date', today)
    : { data: [] }

  const reportedIds = new Set((todaysReports ?? []).map((r) => r.engagement_id))

  const engagementsWithStatus = (engagements ?? []).map((eng) => ({
    id: eng.id,
    title: eng.title,
    status: eng.status,
    has_todays_report: reportedIds.has(eng.id),
    companies: eng.companies as unknown as { name: string } | null,
  }))

  return (
    <div className="max-w-4xl mx-auto">
      <Suspense fallback={<div className="text-[#8B8781] text-sm">Loading...</div>}>
        <DailyReportForm engagements={engagementsWithStatus} />
      </Suspense>
    </div>
  )
}
