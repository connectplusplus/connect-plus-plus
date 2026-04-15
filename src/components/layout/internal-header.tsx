'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

const ROUTE_TITLES: Record<string, string> = {
  '/internal': 'Internal Dashboard',
  '/internal/daily-reports': 'Daily Reports',
  '/internal/daily-reports/new': 'New Daily Report',
}

interface InternalHeaderProps {
  user: {
    full_name: string
    email: string
    role: string
  }
}

export function InternalHeader({ user }: InternalHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const initials = getInitials(user.full_name)

  function getTitle() {
    if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
    if (pathname.startsWith('/internal/daily-reports')) return 'Daily Reports'
    return 'Internal'
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/internal-login')
    router.refresh()
  }

  return (
    <header className="h-14 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between px-6 shrink-0">
      <h1 className="font-heading font-bold text-[#0F172A] text-lg">{getTitle()}</h1>

      <div className="flex items-center gap-4">
        <div className="h-5 w-px bg-[#E2E8F0]" />

        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED] font-mono-brand text-[10px] font-semibold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[#0F172A] text-sm font-medium leading-tight truncate">{user.full_name}</p>
            <p className="text-[#94A3B8] text-[10px] leading-tight truncate capitalize">{user.role.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-7 h-7 flex items-center justify-center text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/5 rounded-lg transition-colors duration-150"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  )
}
