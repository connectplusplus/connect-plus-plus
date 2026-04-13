'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Layers,
  Store,
  MessageCircle,
  Settings,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

interface DashboardSidebarProps {
  user: {
    full_name: string
    email: string
    company_name?: string
  }
}

const NAV_ITEMS = [
  { label: 'Overview', href: '/dashboard', icon: Home, exact: true },
  { label: 'Engagements', href: '/dashboard/engagements', icon: Layers, exact: false },
  { label: 'New Engagement', href: '/dashboard/new-engagement', icon: Store, exact: false },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageCircle, exact: false },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, exact: false },
]

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const initials = getInitials(user.full_name)

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-60 min-h-screen bg-[#0B0B0F] border-r border-[#2A2A30] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#2A2A30]">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="https://cdn.prod.website-files.com/63ea859d3ade03089d7e65c6/651c3035ed3443430da378d1_fs_logo_horizontal_white.svg"
            alt="FullStack"
            className="h-5 w-auto"
          />
          <span className="text-[#A6F84C] font-heading font-semibold text-xs border-l border-[#2A2A30] pl-2">
            Connect++
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                active
                  ? 'bg-[#A6F84C]/10 text-[#A6F84C]'
                  : 'text-[#9CA3AF] hover:text-white hover:bg-[#1E1E24]'
              }`}
            >
              {active && (
                <span className="absolute left-0 w-0.5 h-5 bg-[#A6F84C] rounded-r" />
              )}
              <item.icon
                size={17}
                strokeWidth={1.5}
                className={active ? 'text-[#A6F84C]' : ''}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-[#2A2A30]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#1E1E24] flex items-center justify-center text-[#A6F84C] font-mono-brand text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user.full_name}</p>
            {user.company_name && (
              <p className="text-[#6B7280] text-xs truncate">{user.company_name}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[#9CA3AF] hover:text-[#F87171] hover:bg-[#F87171]/5 text-sm transition-colors duration-150"
        >
          <LogOut size={15} strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
