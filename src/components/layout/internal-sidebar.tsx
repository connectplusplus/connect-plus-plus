'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  FileText,
  Layers,
  Users,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Overview', href: '/internal', icon: Home, exact: true, enabled: true },
  { label: 'Daily Reports', href: '/internal/daily-reports', icon: FileText, exact: false, enabled: true },
  { label: 'Engagements', href: '/internal/engagements', icon: Layers, exact: false, enabled: false },
  { label: 'Talent', href: '/internal/talent', icon: Users, exact: false, enabled: false },
]

export function InternalSidebar() {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-[#E2E8F0] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-3 h-14 flex items-center border-b border-[#E2E8F0]">
        <Link href="/internal" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Glassbox"
            className="h-7 w-auto"
          />
          <span className="text-[#7C3AED] font-heading font-semibold text-xs border-l border-[#E2E8F0] pl-2">
            Internal
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact)
          if (!item.enabled) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#94A3B8] cursor-not-allowed opacity-50"
              >
                <item.icon size={17} strokeWidth={1.5} />
                {item.label}
              </div>
            )
          }
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
        <p className="text-[#94A3B8] text-[10px]">FullStack Internal Portal</p>
      </div>
    </aside>
  )
}
