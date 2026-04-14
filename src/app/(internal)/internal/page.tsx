import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function InternalDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/internal-login')

  const { data: internalUser } = await supabase
    .from('internal_users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!internalUser) redirect('/internal-login')

  // Get assigned engagements count
  const { count: engagementCount } = await supabase
    .from('engagements')
    .select('id', { count: 'exact', head: true })
    .eq('pm_user_id', user.id)

  // Get recent reports count
  const { count: reportCount } = await supabase
    .from('daily_reports')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', user.id)

  const firstName = internalUser.full_name.split(' ')[0]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="font-heading font-bold text-2xl text-[#0F172A] mb-1">
          Welcome back, {firstName}
        </h2>
        <p className="text-[#64748B] text-sm">
          {internalUser.role === 'pm' ? 'Project Manager' : internalUser.role.replace('_', ' ')} — FullStack Internal Portal
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
          <p className="text-[#94A3B8] text-xs uppercase tracking-widest mb-2">Assigned Engagements</p>
          <p className="font-mono-brand font-bold text-3xl text-[#0F172A]">{engagementCount ?? 0}</p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
          <p className="text-[#94A3B8] text-xs uppercase tracking-widest mb-2">Reports Submitted</p>
          <p className="font-mono-brand font-bold text-3xl text-[#0F172A]">{reportCount ?? 0}</p>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mx-auto mb-4">
          <FileText size={24} className="text-[#7C3AED]" />
        </div>
        <h3 className="font-heading font-semibold text-lg text-[#0F172A] mb-2">
          Submit a Daily Report
        </h3>
        <p className="text-[#64748B] text-sm mb-5 max-w-md mx-auto">
          Keep your clients informed with a structured end-of-day update. Reports appear
          instantly on the client&apos;s engagement dashboard.
        </p>
        <Link href="/internal/daily-reports/new">
          <Button className="bg-[#7C3AED] text-white hover:bg-[#8B5CF6] font-semibold">
            <Plus size={14} className="mr-2" />
            New Daily Report
          </Button>
        </Link>
      </div>
    </div>
  )
}
