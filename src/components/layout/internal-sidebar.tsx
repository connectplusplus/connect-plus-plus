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
    <aside className="w-60 min-h-screen bg-[#FAFAF7] border-r border-[#E0DDD6] flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-3 border-b border-[#E0DDD6]">
        <Link href="/internal">
          <img
            src="/logo.png"
            alt="Glassbox"
            className="h-5 w-auto mb-1"
          />
          <p className="text-[#B0ADA6] text-[10px] font-medium uppercase tracking-widest">PM Console</p>
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#B0ADA6] cursor-not-allowed opacity-50"
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
                  ? 'bg-[#6B8F5E]/10 text-[#6B8F5E]'
                  : 'text-[#8B8781] hover:text-[#2D2B27] hover:bg-[#EFEDE8]'
              }`}
            >
              {active && (
                <span className="absolute left-0 w-0.5 h-5 bg-[#6B8F5E] rounded-r" />
              )}
              <item.icon
                size={17}
                strokeWidth={1.5}
                className={active ? 'text-[#6B8F5E]' : ''}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* FullStack branding */}
      <div className="px-4 py-4 border-t border-[#E0DDD6]">
        <p className="text-[#B0ADA6] text-[10px]">FullStack Internal Portal</p>
      </div>
    </aside>
  )
}
