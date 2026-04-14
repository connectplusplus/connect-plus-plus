import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DailyReportForm } from './daily-report-form'

export default async function NewDailyReportPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/internal-login')

  // Fetch engagements assigned to this PM
  const { data: engagements } = await supabase
    .from('engagements')
    .select('id, title, status, companies(name)')
    .eq('pm_user_id', user.id)
    .in('status', ['active', 'in_review', 'scoping'])
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto">
      <DailyReportForm engagements={(engagements ?? []) as any[]} />
    </div>
  )
}
