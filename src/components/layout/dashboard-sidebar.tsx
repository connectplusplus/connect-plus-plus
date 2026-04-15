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
    <aside className="w-60 min-h-screen bg-white border-r border-[#E2E8F0] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-3 h-14 flex items-center border-b border-[#E2E8F0]">
        <Link href="/dashboard">
          <img
            src="/logo2.png"
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
                  ? 'bg-[#7C3AED]/10 text-[#7C3AED]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
              }`}
            >
              {active && (
                <span className="absolute left-0 w-0.5 h-5 bg-[#7C3AED] rounded-r" />
              )}
              <item.icon
                size={17}
                strokeWidth={1.5}
                className={active ? 'text-[#7C3AED]' : ''}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* FullStack branding */}
      <div className="px-4 py-4 border-t border-[#E2E8F0]">
        <a href="https://fullstack.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 opacity-50 hover:opacity-80 transition-opacity">
          <span className="text-[#94A3B8] text-[10px]">Powered by</span>
          <img
            src="https://cdn.prod.website-files.com/63ea859d3ade03089d7e65c6/651c3035ed3443430da378d1_fs_logo_horizontal_white.svg" style={{ filter: "brightness(0) saturate(100%)" }}
            alt="FullStack"
            className="h-4 w-auto"
          />
        </a>
      </div>
    </aside>
  )
}
