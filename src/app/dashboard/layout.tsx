import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile + company
  const { data: userProfile } = await supabase
    .from('users')
    .select('*, companies(name)')
    .eq('id', user.id)
    .single()

  const displayUser = {
    full_name: userProfile?.full_name ?? user.email?.split('@')[0] ?? 'User',
    email: user.email ?? '',
    company_name: (userProfile?.companies as { name?: string } | null)?.name ?? undefined,
  }

  return (
    <div className="flex min-h-screen bg-[#111116]">
      <DashboardSidebar user={displayUser} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
