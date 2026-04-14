'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Layers,
  Store,
  MessageCircle,
  Settings,
  Users,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Overview', href: '/dashboard', icon: Home, exact: true },
  { label: 'Engagements', href: '/dashboard/engagements', icon: Layers, exact: false },
  { label: 'Talent by FullStack', href: '/dashboard/my-talent', icon: Users, exact: false },
  { label: 'New Engagement', href: '/dashboard/new-engagement', icon: Store, exact: false },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageCircle, exact: false },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, exact: false },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 min-h-screen bg-[#0B0B0F] border-r border-[#2A2A30] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-3 py-5 border-b border-[#2A2A30]">
        <Link href="/dashboard">
          <img
            src="/logo.png"
            alt="Glassbox"
            className="w-[66%]"
          />
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

      {/* FullStack branding */}
      <div className="px-4 py-4 border-t border-[#2A2A30]">
        <a href="https://fullstack.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 opacity-50 hover:opacity-80 transition-opacity">
          <span className="text-[#6B7280] text-[10px]">Powered by</span>
          <img
            src="https://cdn.prod.website-files.com/63ea859d3ade03089d7e65c6/651c3035ed3443430da378d1_fs_logo_horizontal_white.svg"
            alt="FullStack"
            className="h-4 w-auto"
          />
        </a>
      </div>
    </aside>
  )
}
