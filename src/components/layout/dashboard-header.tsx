'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Bell, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/engagements': 'Engagements',
  '/dashboard/my-talent': 'FullStack Talent Dashboard',
  '/dashboard/talent': 'Browse Talent',
  '/dashboard/messages': 'Messages',
  '/dashboard/settings': 'Settings',
}

interface DashboardHeaderProps {
  user: {
    full_name: string
    email: string
    company_name?: string
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const initials = getInitials(user.full_name)

  function getTitle() {
    if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
    if (pathname.startsWith('/dashboard/engagements/')) return 'Engagement Detail'
    if (pathname.startsWith('/dashboard/new-engagement')) return 'New Engagement'
    return 'Dashboard'
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="h-14 border-b border-[#E0DDD6] bg-[#F5F3EE] flex items-center justify-between px-6 shrink-0">
      <h1 className="font-heading font-bold text-[#2D2B27] text-lg">{getTitle()}</h1>

      <div className="flex items-center gap-4">
        <button
          className="w-8 h-8 flex items-center justify-center text-[#8B8781] hover:text-[#2D2B27] hover:bg-[#EFEDE8] rounded-lg transition-colors duration-150"
          aria-label="Notifications"
          title="Notifications (coming soon)"
        >
          <Bell size={16} strokeWidth={1.5} />
        </button>

        <div className="h-5 w-px bg-[#E2E8F0]" />

        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#EFEDE8] flex items-center justify-center text-[#6B8F5E] font-mono-brand text-[10px] font-semibold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[#2D2B27] text-sm font-medium leading-tight truncate">{user.full_name}</p>
            {user.company_name && (
              <p className="text-[#B0ADA6] text-[10px] leading-tight truncate">{user.company_name}</p>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="w-7 h-7 flex items-center justify-center text-[#8B8781] hover:text-[#F87171] hover:bg-[#F87171]/5 rounded-lg transition-colors duration-150"
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
