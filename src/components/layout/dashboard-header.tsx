'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/engagements': 'Engagements',
  '/dashboard/messages': 'Messages',
  '/dashboard/settings': 'Settings',
}

export function DashboardHeader() {
  const pathname = usePathname()

  function getTitle() {
    // Exact match
    if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
    // Engagement detail
    if (pathname.startsWith('/dashboard/engagements/')) return 'Engagement Detail'
    return 'Dashboard'
  }

  return (
    <header className="h-14 border-b border-[#2A2A30] bg-[#111116] flex items-center justify-between px-6 shrink-0">
      <h1 className="font-heading font-semibold text-white text-base">{getTitle()}</h1>

      <div className="flex items-center gap-3">
        <Link href="/dashboard/new-engagement">
          <Button
            size="sm"
            className="bg-[#A6F84C] text-[#0B0B0F] hover:bg-[#BCFF6E] font-semibold text-xs h-8 gap-1.5"
          >
            <Plus size={14} strokeWidth={2.5} />
            New Engagement
          </Button>
        </Link>
        <button
          className="w-8 h-8 flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-[#1E1E24] rounded-lg transition-colors duration-150"
          aria-label="Notifications"
          title="Notifications (coming soon)"
        >
          <Bell size={16} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  )
}
