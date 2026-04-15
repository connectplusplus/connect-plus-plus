import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InternalSidebar } from '@/components/layout/internal-sidebar'
import { InternalHeader } from '@/components/layout/internal-header'

export default async function InternalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/internal-login')
  }

  // Verify this is an internal user
  const { data: internalUser } = await supabase
    .from('internal_users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!internalUser) {
    // Authenticated but not an internal user — redirect without signing out
    // (they may be a client user who navigated here by mistake)
    redirect('/internal-login')
  }

  const displayUser = {
    full_name: internalUser.full_name,
    email: internalUser.email ?? user.email ?? '',
    role: internalUser.role,
  }

  return (
    <div className="flex min-h-screen bg-[#F5F3EE]">
      <InternalSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <InternalHeader user={displayUser} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
